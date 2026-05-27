import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
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

  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
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
    const token = (await Notifications.getExpoPushTokenAsync()).data
    await api.delete('/device-tokens', { data: { token } })
  } catch {}
}
