import { create } from 'zustand'

/**
 * Global flag used to auto-start microphone dictation when the app is opened
 * via deep link (ai-companion://voice) or the home-screen shortcut.
 *
 * Producer: `_layout.tsx` (parses initial URL).
 * Consumer: `ChatInput.tsx` (reads on mount, then calls clear()).
 */
interface VoiceTriggerState {
  pending: boolean
  trigger: () => void
  clear: () => void
}

export const useVoiceTrigger = create<VoiceTriggerState>((set) => ({
  pending: false,
  trigger: () => set({ pending: true }),
  clear: () => set({ pending: false }),
}))
