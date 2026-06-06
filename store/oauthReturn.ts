import { create } from 'zustand'

/**
 * Global flag set when the app is reopened via the OAuth deep link
 * (ai-companion://oauth?google=connected) after the user authorizes Google
 * in the browser.
 *
 * Producer: `app/oauth.tsx` (deep-link target) and `_layout.tsx` (URL listener).
 * Consumer: `settings.tsx` (re-fetches integrations + shows success feedback).
 */
interface OAuthReturnState {
  /** Increments each time we come back from a successful Google consent. */
  googleConnected: number
  markGoogleConnected: () => void
}

export const useOAuthReturn = create<OAuthReturnState>((set) => ({
  googleConnected: 0,
  markGoogleConnected: () => set((s) => ({ googleConnected: s.googleConnected + 1 })),
}))
