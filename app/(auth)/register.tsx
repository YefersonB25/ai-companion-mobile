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

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { register, isLoading } = useAuthStore()
  const router = useRouter()

  const handleRegister = async () => {
    if (!name || !email || password.length < 8) {
      Alert.alert('Error', 'Completa todos los campos. La contraseña debe tener mínimo 8 caracteres.')
      return
    }
    try {
      await register(name, email, password)
      router.replace('/(app)')
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }, message?: string })
      const fieldErr = res?.response?.data?.errors
      const firstErr = fieldErr ? Object.values(fieldErr)[0]?.[0] : null
      const msg = firstErr ?? res?.response?.data?.message ?? `No se pudo conectar con el servidor. (${res?.message ?? 'error desconocido'})`
      Alert.alert('Error', msg)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="sparkles" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Tu asistente personal te espera</Text>
        </View>

        <View style={styles.card}>
          <Input label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
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
            placeholder="Mínimo 8 caracteres"
          />
          <Button
            label={isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            onPress={handleRegister}
            loading={isLoading}
            size="lg"
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
          <Text style={styles.link}>
            ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
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
    width: 72, height: 72, borderRadius: 20,
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
