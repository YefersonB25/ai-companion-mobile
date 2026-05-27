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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      Alert.alert('Error', msg ?? 'No se pudo crear la cuenta.')
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
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

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.link}>
            ¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#f8fafc' },
  scroll:   { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  header:   { alignItems: 'center', gap: 8 },
  title:    { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 15, color: '#64748b' },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 3,
  },
  link:     { textAlign: 'center', color: '#64748b', fontSize: 14 },
  linkBold: { color: '#6366f1', fontWeight: '600' },
})
