import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/store/auth'

export default function Index() {
  const { token, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    if (token) {
      router.replace('/(app)')
    } else {
      router.replace('/(auth)/login')
    }
  }, [hydrated, token, router])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  )
}
