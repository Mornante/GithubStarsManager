import { githubGraphql } from './githubClient'
import { STARRED_REPOS_QUERY } from './queries'
import type { Repo } from '../types/github'

interface StarredReposResponse {
  viewer: {
    starredRepositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      edges: {
        starredAt: string
        node: {
          id: string
          name: string
          nameWithOwner: string
          owner: { login: string; avatarUrl: string }
          description: string | null
          url: string
          homepageUrl: string | null
          sshUrl: string
          stargazerCount: number
          forkCount: number
          updatedAt: string
          primaryLanguage: { name: string; color: string | null } | null
          licenseInfo: { spdxId: string | null; name: string } | null
          repositoryTopics: { nodes: { topic: { name: string } }[] }
        }
      }[]
    }
  }
}

export async function fetchAllStarredRepos(token: string): Promise<Repo[]> {
  const repos: Repo[] = []
  let cursor: string | null = null

  while (true) {
    const data: StarredReposResponse = await githubGraphql(token, STARRED_REPOS_QUERY, { cursor })
    const { edges, pageInfo } = data.viewer.starredRepositories

    for (const edge of edges) {
      const node = edge.node
      repos.push({
        id: node.id,
        name: node.name,
        nameWithOwner: node.nameWithOwner,
        owner: node.owner,
        description: node.description,
        url: node.url,
        homepageUrl: node.homepageUrl,
        sshUrl: node.sshUrl,
        stargazerCount: node.stargazerCount,
        forkCount: node.forkCount,
        updatedAt: node.updatedAt,
        starredAt: edge.starredAt,
        primaryLanguage: node.primaryLanguage,
        licenseInfo: node.licenseInfo,
        topics: node.repositoryTopics.nodes.map((n) => n.topic.name),
        listIds: [],
      })
    }

    if (!pageInfo.hasNextPage) break
    cursor = pageInfo.endCursor
  }

  return repos
}
