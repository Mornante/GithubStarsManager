import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GithubUser } from '../types/github'

interface StoredAccount {
  token: string
  user: GithubUser
}

interface AuthState {
  accounts: Record<string, StoredAccount>
  currentUserId: string | null
  login: (token: string, user: GithubUser) => void
  logout: () => void
  currentAccount: () => StoredAccount | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: {},
      currentUserId: null,
      login: (token, user) =>
        set((state) => ({
          accounts: { ...state.accounts, [user.id]: { token, user } },
          currentUserId: user.id,
        })),
      logout: () => set({ currentUserId: null }),
      currentAccount: () => {
        const { accounts, currentUserId } = get()
        return currentUserId ? (accounts[currentUserId] ?? null) : null
      },
    }),
    { name: 'gh-stars-auth' },
  ),
)
