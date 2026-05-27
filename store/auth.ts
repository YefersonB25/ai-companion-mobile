import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { User } from '@/types'
import api from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  hydrated: boolean
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  hydrated: false,

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('token')
    if (token) {
      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        set({ user: data, token, hydrated: true })
      } catch {
        await SecureStore.deleteItemAsync('token')
        set({ hydrated: true })
      }
    } else {
      set({ hydrated: true })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    const { data } = await api.post('/auth/login', { email, password })
    await SecureStore.setItemAsync('token', data.token)
    set({ user: data.user, token: data.token, isLoading: false })
  },

  register: async (name, email, password) => {
    set({ isLoading: true })
    const { data } = await api.post('/auth/register', {
      name, email, password, password_confirmation: password,
    })
    await SecureStore.setItemAsync('token', data.token)
    set({ user: data.user, token: data.token, isLoading: false })
  },

  logout: async () => {
    try { await api.post('/auth/logout') } catch {}
    await SecureStore.deleteItemAsync('token')
    set({ user: null, token: null })
  },
}))
