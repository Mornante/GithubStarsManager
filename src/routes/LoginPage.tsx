import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getViewer } from '../api/rest'
import { GithubApiError } from '../api/githubClient'
import { useAuthStore } from '../store/authStore'

const SCOPES = [
  { name: 'user', reason: 'Manage star lists — tagging and categorizing repos.' },
  { name: 'public_repo', reason: 'Read and star public repos.' },
  { name: 'read:org', reason: 'Browse and follow public organizations.' },
  { name: 'gist', reason: 'Create and update the private GSM:STATE gist that stores your tags, deployments, and notes.' },
  { name: 'read:project', reason: 'View an organization\'s GitHub Projects in the Projects tab.' },
]

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'validating' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setStatus('validating')
    setError(null)
    try {
      const user = await getViewer(token.trim())
      login(token.trim(), user)
      navigate('/')
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof GithubApiError && err.status === 401
          ? 'That token was rejected by GitHub. Double-check it was copied correctly and has not expired.'
          : 'Could not validate that token. Check your connection and try again.',
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md border border-border-default rounded-md p-6 bg-canvas-subtle">
        <h1 className="text-xl font-semibold mb-1">GitHub Stars Manager</h1>
        <p className="text-fg-muted text-sm mb-6">
          Paste a GitHub personal access token to connect your starred repositories.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pat" className="block text-sm font-medium mb-1">
              Personal access token
            </label>
            <input
              id="pat"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              autoComplete="off"
              spellCheck={false}
              className="w-full font-mono text-sm rounded-md border border-border-default bg-canvas px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-fg"
            />
          </div>

          {error && <p className="text-sm text-danger-fg">{error}</p>}

          <button
            type="submit"
            disabled={status === 'validating' || !token.trim()}
            className="w-full rounded-md bg-success-emphasis text-white font-medium py-2 disabled:opacity-50"
          >
            {status === 'validating' ? 'Validating…' : 'Connect'}
          </button>
        </form>

        <div className="mt-6 text-xs text-fg-muted">
          <p className="mb-2">
            Create a{' '}
            <a
              href="https://github.com/settings/tokens/new"
              target="_blank"
              rel="noreferrer"
              className="text-accent-fg hover:underline"
            >
              classic personal access token
            </a>{' '}
            with these scopes:
          </p>

          <ul className="space-y-2 mb-3">
            {SCOPES.map((scope) => (
              <li key={scope.name} className="flex items-start gap-2">
                <code className="shrink-0 rounded border border-border-default bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-fg-default">
                  {scope.name}
                </code>
                <span>{scope.reason}</span>
              </li>
            ))}
          </ul>

          <p>The token is stored only in your browser's local storage and sent directly to api.github.com.</p>
        </div>
      </div>
    </div>
  )
}
