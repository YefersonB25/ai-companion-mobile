import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { Ionicons } from '@expo/vector-icons'
import { C } from '@/lib/theme'

type IoniconsName = keyof typeof Ionicons.glyphMap

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? C.primary : C.textSecondary}
    />
  )
}

export default function AppLayout() {
  const { token, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (hydrated && !token) router.replace('/(auth)/login')
  }, [hydrated, token, router])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 14,
          paddingTop: 10,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => <TabIcon name="chatbubble-ellipses" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => <TabIcon name="time-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Memoria',
          tabBarIcon: ({ focused }) => <TabIcon name="sparkles-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: 'IA',
          tabBarIcon: ({ focused }) => <TabIcon name="hardware-chip-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => <TabIcon name="settings-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  )
}
