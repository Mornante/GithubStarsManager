const GRAPHQL_ENDPOINT = 'https://api.github.com/graphql'
const REST_BASE = 'https://api.github.com'

export class GithubApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GithubApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  accept?: string
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function githubRest<T>(token: string, path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${REST_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...authHeader(token),
      Accept: options.accept ?? 'application/vnd.github+json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    throw new GithubApiError(`GitHub REST request failed: ${res.status} ${res.statusText}`, res.status)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}

export async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      ...authHeader(token),
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new GithubApiError(`GitHub GraphQL request failed: ${res.status} ${res.statusText}`, res.status)
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }

  if (json.errors?.length) {
    throw new GithubApiError(json.errors.map((e) => e.message).join('; '))
  }

  return json.data as T
}
