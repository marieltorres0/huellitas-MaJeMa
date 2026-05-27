import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'normal'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (userData: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (userData) =>
    set({
      user: userData,
      isAuthenticated: true,
    }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}))