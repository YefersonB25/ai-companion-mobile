import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { useRouter } from 'expo-router'
import { Text } from 'react-native'
import { useAuthStore } from '@/store/auth'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
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
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Memoria',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: 'IA',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
      {/* Perfil: accesible via navegación desde Settings, no en la tab bar */}
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  )
}
