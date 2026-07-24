export const STARRED_REPOS_QUERY = /* GraphQL */ `
  query StarredRepos($cursor: String) {
    viewer {
      starredRepositories(first: 50, after: $cursor, orderBy: { field: STARRED_AT, direction: DESC }) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          starredAt
          node {
            id
            name
            nameWithOwner
            owner {
              login
              avatarUrl
            }
            description
            url
            homepageUrl
            sshUrl
            stargazerCount
            forkCount
            updatedAt
            primaryLanguage {
              name
              color
            }
            licenseInfo {
              spdxId
              name
            }
            repositoryTopics(first: 10) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`

export const VIEWER_LISTS_QUERY = /* GraphQL */ `
  query ViewerLists {
    viewer {
      lists(first: 100) {
        nodes {
          id
          name
          description
          isPrivate
          items(first: 100) {
            nodes {
              ... on Repository {
                id
                nameWithOwner
              }
            }
          }
        }
      }
    }
  }
`

// updateUserListsForItem REPLACES the item's entire list membership — callers
// must pass the full desired set of list IDs, not a single list to add/remove.
export const UPDATE_USER_LISTS_FOR_ITEM_MUTATION = /* GraphQL */ `
  mutation UpdateUserListsForItem($itemId: ID!, $listIds: [ID!]!) {
    updateUserListsForItem(input: { itemId: $itemId, listIds: $listIds }) {
      lists {
        id
        name
      }
    }
  }
`

export const CREATE_USER_LIST_MUTATION = /* GraphQL */ `
  mutation CreateUserList($name: String!, $description: String, $isPrivate: Boolean) {
    createUserList(input: { name: $name, description: $description, isPrivate: $isPrivate }) {
      list {
        id
        name
        description
        isPrivate
      }
    }
  }
`

export const ORG_VIEWER_FOLLOWING_QUERY = /* GraphQL */ `
  query OrgViewerFollowing($login: String!) {
    organization(login: $login) {
      viewerIsFollowing
    }
  }
`

export const ORG_REPOSITORIES_QUERY = /* GraphQL */ `
  query OrgRepositories($login: String!, $cursor: String) {
    organization(login: $login) {
      repositories(
        first: 30
        after: $cursor
        privacy: PUBLIC
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          nameWithOwner
          owner {
            login
            avatarUrl
          }
          description
          url
          homepageUrl
          sshUrl
          stargazerCount
          forkCount
          updatedAt
          primaryLanguage {
            name
            color
          }
          licenseInfo {
            spdxId
            name
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
    }
  }
`

// Deliberately no `orderBy` — the exact ProjectV2Order enum member names
// aren't verifiable without a live schema, and an invalid enum value would
// fail the whole query. Default ordering is an acceptable trade-off.
export const ORG_PROJECTS_QUERY = /* GraphQL */ `
  query OrgProjects($login: String!, $cursor: String) {
    organization(login: $login) {
      projectsV2(first: 20, after: $cursor) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          number
          url
          shortDescription
          closed
        }
      }
    }
  }
`

// No `states` filter on either of these — open/closed/merged all show, matching
// the other org-modal tabs' "no filter bar" simplicity (state is distinguished
// by the row's own icon/color instead).
export const REPO_ISSUES_QUERY = /* GraphQL */ `
  query RepoIssues($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      issues(first: 20, after: $cursor, orderBy: { field: UPDATED_AT, direction: DESC }) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          url
          state
          updatedAt
          author {
            login
            avatarUrl
          }
        }
      }
    }
  }
`

export const REPO_PULL_REQUESTS_QUERY = /* GraphQL */ `
  query RepoPullRequests($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 20, after: $cursor, orderBy: { field: UPDATED_AT, direction: DESC }) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          url
          state
          updatedAt
          author {
            login
            avatarUrl
          }
        }
      }
    }
  }
`

// Deliberately no `orderBy` — same reasoning as ORG_PROJECTS_QUERY.
export const REPO_PROJECTS_QUERY = /* GraphQL */ `
  query RepoProjects($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      projectsV2(first: 20, after: $cursor) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          number
          url
          shortDescription
          closed
        }
      }
    }
  }
`

// Powers the deployment drift check: latest releases (if the repo cuts them) and
// latest commits on the default branch (for repos that just push to main).
export const REPO_DEPLOYMENT_INFO_QUERY = /* GraphQL */ `
  query RepoDeploymentInfo($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      releases(first: 10, orderBy: { field: CREATED_AT, direction: DESC }) {
        totalCount
        nodes {
          tagName
          name
          publishedAt
          url
          isPrerelease
        }
      }
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 30) {
              nodes {
                oid
                committedDate
                messageHeadline
              }
            }
          }
        }
      }
    }
  }
`

export const FOLLOW_ORGANIZATION_MUTATION = /* GraphQL */ `
  mutation FollowOrganization($orgId: ID!) {
    followOrganization(input: { organizationId: $orgId }) {
      organization {
        id
        viewerIsFollowing
      }
    }
  }
`

export const UNFOLLOW_ORGANIZATION_MUTATION = /* GraphQL */ `
  mutation UnfollowOrganization($orgId: ID!) {
    unfollowOrganization(input: { organizationId: $orgId }) {
      organization {
        id
        viewerIsFollowing
      }
    }
  }
`
