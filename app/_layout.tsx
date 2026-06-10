import { useEffect, useRef } from 'react'
import { Stack, useRouter } from 'expo-router'
import { Linking } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { useAuthStore, initializeAuthStore, initializeChatStore } from '@/store/auth'
import { useOnboarding } from '@/store/onboarding'
import { syncDeviceToken } from '@/lib/notifications'
import { useAppUpdate } from '@/lib/useAppUpdate'
import { syncDailyBriefing, setBriefingPending } from '@/lib/localNotifications'
import UpdateModal from '@/components/ui/UpdateModal'
import { useVoiceTrigger } from '@/store/voiceTrigger'
import { useOAuthReturn } from '@/store/oauthReturn'
import { wakeWord } from '@/lib/wakeWord'
import api from '@/lib/api'
import '../global.css'

// Initialize @aria/core stores with mobile-specific configuration
initializeAuthStore({
  api,
  onTokenChange: async (token) => {
    if (token) {
      await wakeWord.setAuthToken(token)
    }
  },
})

initializeChatStore({
  api,
  channel: 'mobile',
})

export default function RootLayout() {
  const { hydrate, token } = useAuthStore()
  const router = useRouter()
  const { updateInfo, dismiss } = useAppUpdate()
  const { completed } = useOnboarding()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifListener = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseListener = useRef<any>(null)

  useEffect(() => { hydrate() }, [hydrate])

  // Redirigir a onboarding si no está completado (solo si está autenticado)
  useEffect(() => {
    if (token && !completed) {
      router.replace('/onboarding/welcome' as never)
    }
  }, [token, completed, router])


  // Register push token + schedule daily briefing + restart wake word if enabled
  useEffect(() => {
    if (token) {
      syncDeviceToken()
      syncDailyBriefing()
      // Auto-restart servicio de voz si estaba habilitado (se detiene al actualizar la app)
      if (wakeWord.available) {
        wakeWord.isRunning().then(enabled => { if (enabled) wakeWord.start() })
      }
    }
  }, [token])

  // Detect launches via deep links:
  //  - ai-companion://voice (home shortcut, assist intent target)
  //  - ai-companion://oauth?google=connected (return from Google consent)
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return
      if (url.includes('voice')) {
        useVoiceTrigger.getState().trigger()
      }
      if (url.includes('oauth') && url.includes('google=connected')) {
        useOAuthReturn.getState().markGoogleConnected()
      }
    }
    Linking.getInitialURL().then(handleUrl)
    const sub = Linking.addEventListener('url', (evt) => handleUrl(evt.url))
    return () => sub.remove()
  }, [])

  // Handle notification tap — navigate to the relevant conversation
  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // foreground notification received — no action needed, already visible
    })

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>
      if (data?.conversation_id) {
        router.push(`/(app)/${data.conversation_id}` as never)
      } else if (data?.type === 'briefing') {
        // Mark the briefing as pending so the chat screen fetches & presents it
        setBriefingPending()
        router.push('/(app)' as never)
        useVoiceTrigger.setState({ pending: false }) // ensure mic doesn't auto-start
      } else if (data?.type === 'reminder') {
        router.push('/(app)' as never)
      } else if (data?.type === 'calendar_trigger') {
        // Open chat so the user can ask Aria about the upcoming event
        router.push('/(app)' as never)
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
