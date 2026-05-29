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
}
