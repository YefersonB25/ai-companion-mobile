import { useEffect, useRef } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'
import { useAuthStore } from '@/store/auth'
import { syncDeviceToken } from '@/lib/notifications'
import { useAppUpdate } from '@/lib/useAppUpdate'
import UpdateModal from '@/components/ui/UpdateModal'
import '../global.css'

export default function RootLayout() {
  const { hydrate, token } = useAuthStore()
  const router = useRouter()
  const { updateInfo, dismiss } = useAppUpdate()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifListener = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseListener = useRef<any>(null)

  useEffect(() => { hydrate() }, [hydrate])

  // Register push token once logged in
  useEffect(() => {
    if (token) syncDeviceToken()
  }, [token])

  // Handle notification tap — navigate to the relevant conversation
  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // foreground notification received — no action needed, already visible
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>
      if (data?.conversation_id) {
        router.push(`/(app)/${data.conversation_id}` as never)
      }
    })

    return () => {
      notifListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [router])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
      {updateInfo && (
        <UpdateModal info={updateInfo} onDismiss={dismiss} />
      )}
    </GestureHandlerRootView>
  )
}
