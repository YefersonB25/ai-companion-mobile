import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import api from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AI Companion',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  // In standalone (non-Expo-Go) builds, getExpoPushTokenAsync requires the EAS projectId.
  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
    ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId

  if (!projectId) {
    console.warn('Push notifications: missing EAS projectId in app.json')
    return null
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    return token
  } catch (e) {
    console.warn('Push notifications: failed to obtain token', e)
    return null
  }
}

export async function syncDeviceToken(): Promise<void> {
  try {
    const token = await registerForPushNotifications()
    if (!token) return

    await api.post('/device-tokens', { token, platform: 'expo' })
  } catch (e) {
    console.warn('Failed to sync device token:', e)
  }
}

export async function removeDeviceToken(): Promise<void> {
  try {
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId
      ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
    if (!projectId) return
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    await api.delete('/device-tokens', { data: { token } })
  } catch {}
}
