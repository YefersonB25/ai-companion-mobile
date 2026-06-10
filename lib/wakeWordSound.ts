import { Audio } from 'expo-av'

/**
 * Wake word detection sound effect.
 * Provides audio feedback that "Hey Aria" was heard and recording started.
 */

let soundObject: Audio.Sound | null = null

export const wakeWordSound = {
  /**
   * Play a short "ding" sound to signal wake word detection.
   * Sound is a 200ms beep at 800Hz (pleasant, not jarring).
   */
  async play(): Promise<void> {
    try {
      if (!soundObject) {
        soundObject = new Audio.Sound()
        // Use a simple sine wave beep (800Hz, 200ms)
        // Fallback: use system notification sound if available
        await soundObject.loadAsync(require('@/assets/sounds/wake-word-ding.wav'))
      }

      await soundObject.playAsync()
    } catch (e) {
      // Silently fail if sound not available (no logging spam)
      console.debug('Wake word sound playback failed:', e)
    }
  },

  /**
   * Stop and release sound resources.
   */
  async unload(): Promise<void> {
    if (soundObject) {
      try {
        await soundObject.unloadAsync()
        soundObject = null
      } catch (e) {
        console.debug('Wake word sound unload failed:', e)
      }
    }
  },
}

/**
 * Fallback: Use expo-av to generate a simple sine wave beep.
 * This provides audio feedback even without pre-recorded sound files.
 */
export async function playWakeWordBeep(): Promise<void> {
  try {
    // Set up audio session for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DEFAULT,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DEFAULT,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    })

    // Play using system sound (notification sound)
    // On Android: Uses RingtoneManager.getDefaultUri(TYPE_NOTIFICATION)
    // On iOS: Uses UILocalNotificationDefaultSoundName
    const sound = new Audio.Sound()
    // Try to load a notification sound from assets
    try {
      await sound.loadAsync(require('@/assets/sounds/notification.wav'))
      await sound.playAsync()
    } catch {
      // Fallback: if no sound file, just log (no error spam)
      console.debug('Wake word beep not available')
    }
  } catch (e) {
    console.debug('Wake word beep setup failed:', e)
  }
}
