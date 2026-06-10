import { create } from 'zustand'
import api from '@/lib/api'
import { LicenseStatus } from '@aria/core'

interface LicenseState {
  status: LicenseStatus | null
  loading: boolean
  fetch: () => Promise<void>
  clear: () => void
}

export const useLicenseStore = create<LicenseState>((set) => ({
  status: null,
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get<LicenseStatus>('/license/status')
      set({ status: data })
    } catch {
      set({ status: null })
    } finally {
      set({ loading: false })
    }
  },

  clear: () => set({ status: null, loading: false }),
}))
