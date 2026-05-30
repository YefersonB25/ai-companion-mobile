import { useEffect, useRef, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { Linking } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '@/store/auth'
import { syncDeviceToken } from '@/lib/notifications'
import { useAppUpdate } from '@/lib/useAppUpdate'
import { syncDailyBriefing } from '@/lib/localNotifications'
import UpdateModal from '@/components/ui/UpdateModal'
import OnboardingModal from '@/components/ui/OnboardingModal'
import { useVoiceTrigger } from '@/store/voiceTrigger'
import { wakeWord } from '@/lib/wakeWord'
import '../global.css'

const ONBOARDING_KEY = 'aria_onboarding_done'

export default function RootLayout() {
  const { hydrate, token } = useAuthStore()
  const router = useRouter()
  const { updateInfo, dismiss } = useAppUpdate()
  const [showOnboarding, setShowOnboarding] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifListener = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const responseListener = useRef<any>(null)

  useEffect(() => { hydrate() }, [hydrate])

  // Mostrar onboarding la primera vez que el usuario usa la app
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(done => {
      if (!done) setShowOnboarding(true)
    })
  }, [])

  const closeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

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

  // Detect launches via deep link ai-companion://voice (home shortcut, assist intent target)
  useEffect(() => {
    const checkVoiceLaunch = (url: string | null) => {
      if (url && url.includes('voice')) {
        useVoiceTrigger.getState().trigger()
      }
    }
    Linking.getInitialURL().then(checkVoiceLaunch)
    const sub = Linking.addEventListener('url', (evt) => checkVoiceLaunch(evt.url))
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
        // Open chat and let the chat screen pick up the pending briefing flag
        router.push('/(app)' as never)
        useVoiceTrigger.setState({ pending: false }) // ensure mic doesn't auto-start
      } else if (data?.type === 'reminder') {
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
      <OnboardingModal visible={showOnboarding} onClose={closeOnboarding} />
    </GestureHandlerRootView>
  )
}
