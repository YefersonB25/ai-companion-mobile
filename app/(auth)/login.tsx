import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { C } from '@/lib/theme'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading }    = useAuthStore()
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa tu email y contraseña.')
      return
    }
    try {
      await login(email, password)
      router.replace('/(app)')
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }, message?: string })
      const apiMsg = res?.response?.data?.errors?.email?.[0]
        ?? res?.response?.data?.message
      const msg = apiMsg ?? `No se pudo conectar con el servidor. (${res?.message ?? 'error desconocido'})`
      Alert.alert('Error', msg)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="sparkles" size={36} color="#fff" />
          </View>
          <Text style={styles.title}>AI Companion</Text>
          <Text style={styles.subtitle}>Tu asistente personal de inteligencia artificial</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="tu@email.com"
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button
            label={isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
          <Text style={styles.link}>
            ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 28 },
  logoContainer: { alignItems: 'center', gap: 12 },
  logo: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 28, fontWeight: '700', color: C.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: C.surface, borderRadius: 20,
    padding: 24, gap: 16,
    borderWidth: 1, borderColor: C.border,
  },
  link:     { textAlign: 'center', color: C.textSecondary, fontSize: 14 },
  linkBold: { color: C.primary, fontWeight: '600' },
})
