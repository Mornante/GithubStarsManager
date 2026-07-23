import { githubGraphql } from './githubClient'
import { CREATE_USER_LIST_MUTATION, UPDATE_USER_LISTS_FOR_ITEM_MUTATION, VIEWER_LISTS_QUERY } from './queries'
import type { StarList } from '../types/github'

interface ViewerListsResponse {
  viewer: {
    lists: {
      nodes: {
        id: string
        name: string
        description: string | null
        isPrivate: boolean
        items: { nodes: { id: string; nameWithOwner: string }[] }
      }[]
    }
  }
}

export async function fetchViewerLists(token: string): Promise<StarList[]> {
  const data = await githubGraphql<ViewerListsResponse>(token, VIEWER_LISTS_QUERY)
  return data.viewer.lists.nodes.map((list) => ({
    id: list.id,
    name: list.name,
    description: list.description,
    isPrivate: list.isPrivate,
    repoIds: list.items.nodes.map((n) => n.id),
  }))
}

// updateUserListsForItem replaces the repo's entire list membership in one call,
// so callers must pass the complete desired set of list IDs.
export async function updateRepoListMembership(token: string, repoId: string, listIds: string[]): Promise<void> {
  await githubGraphql(token, UPDATE_USER_LISTS_FOR_ITEM_MUTATION, { itemId: repoId, listIds })
}

interface CreateUserListResponse {
  createUserList: {
    list: { id: string; name: string; description: string | null; isPrivate: boolean }
  }
}

export async function createList(
  token: string,
  name: string,
  description?: string,
  isPrivate = false,
): Promise<StarList> {
  const data = await githubGraphql<CreateUserListResponse>(token, CREATE_USER_LIST_MUTATION, {
    name,
    description: description ?? null,
    isPrivate,
  })
  const list = data.createUserList.list
  return { id: list.id, name: list.name, description: list.description, isPrivate: list.isPrivate, repoIds: [] }
}
