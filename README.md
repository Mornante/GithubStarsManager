# GitHub Stars Manager

A personal command center for the repos you star on GitHub — review each one, file it into a real star list on
purpose, track what's deployed where, keep markdown notes, and discover trending repos you haven't starred yet.

Runs entirely in the browser: you connect with a personal access token, and the app talks directly to
`api.github.com`. There's no backend and no server-side storage — your token stays in your browser's local storage,
and cross-device state (review stage tags, deployment records, notes) is stored as JSON in a private gist on your
own GitHub account (`GSM:STATE`).

## Getting started

```sh
npm install
npm run dev
```

Open the app and paste a [classic personal access token](https://github.com/settings/tokens/new) with the `user`,
`public_repo`, and `read:org` scopes.

## Scripts

| Script                 | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                      |
| `npm run build`        | Type-check (`tsc -b`) and build for production |
| `npm run preview`      | Preview a production build locally             |
| `npm run lint`         | Run oxlint                                     |
| `npm test`             | Run the test suite once                        |
| `npm run test:watch`   | Run the test suite in watch mode               |
| `npm run format`       | Format the codebase with Prettier              |
| `npm run format:check` | Check formatting without writing changes       |

## Project structure

- `src/api` — thin wrappers over GitHub's REST and GraphQL APIs; no state, no React.
- `src/store` — Zustand stores, one per domain (auth, starred repos, GSM state, organizations, trending, toasts).
  Each store owns its own fetch/optimistic-update/rollback logic for its slice of data.
- `src/hooks` — cross-cutting React hooks (data loading, URL-synced filters, dismissable dropdowns, infinite scroll).
- `src/selectors` — pure functions over domain data (filtering, sorting, deployment drift calculation).
- `src/config` — declarative, data-driven definitions (filter fields, quick-filter cards, review-stage labels).
- `src/components` — presentational and feature components, grouped by area (`repos/`, `orgs/`, `deployments/`,
  `notes/`, `shared/`).
- `src/routes` — one component per top-level page, wired up in `src/App.tsx`.

## Tech stack

React 19, TypeScript (strict), React Router, Zustand, Tailwind CSS v4, Vite, Vitest, oxlint.
