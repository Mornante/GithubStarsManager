# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal command center for GitHub-starred repos: review pipeline, star-list filing, deployment tracking,
notes, org following, and discovery. It's a pure client-side React app — **no backend, no server-side
storage**. It talks directly to `api.github.com` using a personal access token the user pastes in; the token
lives in browser `localStorage`, and any app-specific data that isn't a native GitHub object (review stage,
deployment record, note) is stored as JSON in a private gist on the user's own account (see "GSM:STATE" below).

## Commands

```sh
npm run dev              # Vite dev server
npm run build             # tsc -b (type-check) then vite build
npm run preview            # preview a production build locally
npm run lint              # oxlint
npm test                  # vitest run (single pass)
npm run test:watch        # vitest watch mode
npx vitest run path/to/file.test.ts   # run a single test file
npx vitest run -t "test name"         # run tests matching a name
npm run format             # prettier --write .
npm run format:check       # prettier --check .
```

CI (`.github/workflows/ci.yml`) runs, in order: `lint` → `format:check` → `test` → `build`. Match that order
locally before considering work done. There's also CodeQL analysis and gitleaks secret scanning as separate
workflows, and deploy is via Azure Static Web Apps.

## Architecture

### Two data domains, kept deliberately separate

- **Real GitHub data** (stars, star lists, follows, issues, orgs) — fetched live from GitHub's REST and
  GraphQL APIs, cached in Zustand stores, never round-tripped through app-specific storage.
- **App-specific data** (review stage, deployment record, freeform note per repo) — has no home in GitHub's
  data model, so it's persisted as a single JSON file (`gsm-state.json`, description `GSM:STATE`) inside a
  private gist on the user's own account. This is what makes state (tags, deployments, notes) sync across
  devices without a backend. See `src/types/gsmState.ts`, `src/api/gistApi.ts`, `src/store/gsmStateStore.ts`.

When adding a new piece of app-specific per-repo data, add a field to `RepoState` in `src/types/gsmState.ts`
(or to `GsmStateFile` directly if it's global, not per-repo) rather than inventing a new storage mechanism.

### GSM:STATE schema versioning

`GsmStateFile.schemaVersion` is checked against `CURRENT_SCHEMA_VERSION` (`src/types/gsmState.ts`) every time
the gist is loaded (`findOrCreateGsmStateGist` in `src/api/gistApi.ts`). If a gist is behind, it's run through
`migrateGsmState` (`src/api/gsmStateMigrations.ts`) — a chain of `MigrationStep`s, each describing how to get
from one version to the next — then the pre-migration content is snapshotted into its own file in the same
gist (`gsm-state.snapshot-v<old-version>.json`) before the live file is rewritten. **Any change to
`GsmStateFile`'s shape must**: bump `CURRENT_SCHEMA_VERSION`, and add a corresponding step to `MIGRATIONS`. A
version this build doesn't recognize (e.g. written by a newer build) is left untouched rather than guessed at.

### Multi-account support

`authStore` keys accounts by GitHub user id (`accounts: Record<string, StoredAccount>`) and tracks
`currentUserId` separately, so multiple GitHub accounts can be signed into the same browser. Every other
store that holds per-account data follows the same `Record<userId, ...>` shape (`starsStore.dataByUser`,
`gsmStateStore.byUser`) and every store action takes `(userId, token, ...)` explicitly rather than reading a
single "current" token — don't reintroduce an implicit-current-account assumption into new store code.

### Store conventions

Each Zustand store in `src/store/` owns one domain and is `persist`-ed to `localStorage` independently
(`auth`, `starred repos`, `GSM state`, `organizations`, `trending`, `issues`, `toasts`). Mutating actions
follow the same pattern throughout: snapshot `before`, apply an optimistic update via `set`, perform the
network call, and on failure roll back to `before` while setting `error`. Follow this pattern for new
mutations rather than awaiting-then-setting, so the UI stays responsive and consistent on failure.

### API layer

`src/api/` is thin and stateless — no React, no store imports (except the stores importing from here, never
the reverse). `src/api/githubClient.ts` is the only place raw `fetch` calls to `api.github.com` happen
(`githubRest`, `githubGraphql`, both throwing `GithubApiError` with a `status` on failure); everything else in
`src/api/` builds on those two functions. `src/api/pagination.ts` handles cursor-paginated GraphQL fetches
(e.g. all starred repos, which REST can't get list-membership for in one call — that's why starred repos go
through GraphQL while most other single-repo operations use REST).

### Data-driven filters

`src/config/filterDefinitions.ts` defines `FILTER_DEFINITIONS`, an array where each entry bundles its UI
control, predicate, URL (de)serializer, and pill-label logic in one place (built through the `defineFilter`
generic helper, which exists solely to keep each definition's own value type checked at its definition site).
Adding a new repo filter means adding one entry here, not touching the filter bar component. Filtering itself
happens in `src/selectors/filterRepos.ts` over this array.

### Routing

`src/App.tsx` wires up routes with `react-router-dom`. `HomePage` is eager (it's the landing page right after
auth); every other route is `lazy`-loaded. `AuthGate` redirects to `/login` when `authStore.currentAccount()`
is null, and wraps authenticated routes in the `Sidebar` layout.

### Directory map (see README.md "Project structure" for the authoritative version)

- `src/api` — GitHub REST/GraphQL wrappers, no state, no React.
- `src/store` — Zustand stores, one per domain, each owning its own fetch/optimistic-update/rollback logic.
- `src/hooks` — cross-cutting React hooks (data loading, URL-synced filters, infinite scroll, etc.).
- `src/selectors` — pure functions over domain data (filtering, sorting, deployment drift calculation).
- `src/config` — declarative/data-driven definitions (filter fields, quick-filter cards, review-stage labels).
- `src/components` — grouped by area (`repos/`, `orgs/`, `deployments/`, `notes/`, `issues/`, `shared/`).
- `src/routes` — one component per top-level page.

## Testing notes

Tests are colocated as `*.test.ts` next to the module under test, using Vitest. Store tests mock
`zustand/middleware`'s `persist` to strip out `localStorage` (unavailable in the Vitest `node` environment)
while still capturing options like `merge` so that logic can be tested directly — see
`src/store/gsmStateStore.test.ts` for the pattern if you need to test a new store.
