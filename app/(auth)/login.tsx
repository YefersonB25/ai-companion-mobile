import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/store/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) return
    try {
      await login(email, password)
      router.replace('/(app)')
    } catch {
      Alert.alert('Error', 'Credenciales incorrectas. Verifica tu email y contraseña.')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🧠</Text>
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

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>
            ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  logoContainer: { alignItems: 'center', gap: 12 },
  logo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 36 },
  title:    { fontSize: 28, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 20, elevation: 3,
  },
  link:     { textAlign: 'center', color: '#64748b', fontSize: 14 },
  linkBold: { color: '#6366f1', fontWeight: '600' },
})
