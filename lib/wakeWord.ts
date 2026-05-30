/**
 * Wrapper for the native Android WakeWord module (Vosk-based).
 *
 * Behavior:
 *   - start() launches a foreground service that listens for "Hey Aria",
 *     "Oye Aria" or "Hola Aria" using on-device Vosk speech recognition
 *     (Spanish small model, ~40MB bundled in assets).
 *   - When triggered, the service launches MainActivity with deep link
 *     ai-companion://voice, which auto-starts microphone dictation in the
 *     ChatInput.
 *   - stop() shuts down the service and releases the microphone.
 *   - The user must accept the microphone permission AND ideally exempt the
 *     app from battery optimization for it to survive in background.
 *
 * iOS: not supported (returns false from all methods).
 */
import { NativeModules, Platform } from 'react-native'

const Native = (NativeModules as { WakeWord?: WakeWordNative }).WakeWord

interface WakeWordNative {
  start(): Promise<boolean>
  stop(): Promise<boolean>
  isRunning(): Promise<boolean>
  setAuthToken(token: string): Promise<boolean>
  setApiUrl(url: string): Promise<boolean>
  setTtsSpeed(speed: number): Promise<boolean>
  setTtsPitch(pitch: number): Promise<boolean>
  canDrawOverlays(): Promise<boolean>
  requestOverlayPermission(): Promise<null>
  setDrivingMode(on: boolean): Promise<boolean>
  isDrivingMode(): Promise<boolean>
}

export const wakeWord = {
  available: Platform.OS === 'android' && !!Native,

  async start(): Promise<boolean> {
    if (!Native) return false
    try {
      await Native.start()
      return true
    } catch (e) {
      console.warn('wakeWord.start failed', e)
      return false
    }
  },

  async stop(): Promise<boolean> {
    if (!Native) return false
    try {
      await Native.stop()
      return true
    } catch (e) {
      console.warn('wakeWord.stop failed', e)
      return false
    }
  },

  async isRunning(): Promise<boolean> {
    if (!Native) return false
    try {
      return await Native.isRunning()
    } catch {
      return false
    }
  },

  async setAuthToken(token: string): Promise<void> {
    if (!Native) return
    try { await Native.setAuthToken(token) } catch { /* no-op */ }
  },

  async setApiUrl(url: string): Promise<void> {
    if (!Native) return
    try { await Native.setApiUrl(url) } catch { /* no-op */ }
  },

  async setTtsSpeed(speed: number): Promise<void> {
    if (!Native) return
    try { await Native.setTtsSpeed(speed) } catch { /* no-op */ }
  },

  async setTtsPitch(pitch: number): Promise<void> {
    if (!Native) return
    try { await Native.setTtsPitch(pitch) } catch { /* no-op */ }
  },

  async canDrawOverlays(): Promise<boolean> {
    if (!Native) return false
    try { return await Native.canDrawOverlays() } catch { return false }
  },

  async requestOverlayPermission(): Promise<void> {
    if (!Native) return
    try { await Native.requestOverlayPermission() } catch { /* no-op */ }
  },

  async setDrivingMode(on: boolean): Promise<void> {
    if (!Native) return
    try { await Native.setDrivingMode(on) } catch { /* no-op */ }
  },
  async isDrivingMode(): Promise<boolean> {
    if (!Native) return false
    try { return await Native.isDrivingMode() } catch { return false }
  },
}
