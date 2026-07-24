export interface GithubUser {
  id: string
  login: string
  name: string | null
  email: string | null
  avatarUrl: string
}

export interface RepoOwner {
  login: string
  avatarUrl: string
}

export interface RepoLicense {
  spdxId: string | null
  name: string
}

export interface Repo {
  id: string
  name: string
  nameWithOwner: string
  owner: RepoOwner
  description: string | null
  url: string
  homepageUrl: string | null
  sshUrl: string
  stargazerCount: number
  forkCount: number
  updatedAt: string
  starredAt: string
  primaryLanguage: { name: string; color: string | null } | null
  licenseInfo: RepoLicense | null
  topics: string[]
  listIds: string[]
}

export interface StarList {
  id: string
  name: string
  description: string | null
  isPrivate: boolean
  repoIds: string[]
}

export interface Organization {
  id: string
  login: string
  name: string | null
  avatarUrl: string
  description: string | null
  url: string
  websiteUrl: string | null
  location: string | null
  repoCount: number | null
  memberCount: number | null
  followerCount: number | null
  viewerIsFollowing: boolean
}

export interface OrgProject {
  id: string
  title: string
  number: number
  url: string
  shortDescription: string | null
  closed: boolean
}

export interface OrgMember {
  login: string
  avatarUrl: string
  url: string
}
