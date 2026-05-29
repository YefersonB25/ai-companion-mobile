import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native'
import { C } from '@/lib/theme'

interface Props extends TextInputProps {
  label?: string
  error?: string
}

export default function Input({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={C.textSecondary}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label:     { fontSize: 13, fontWeight: '500', color: C.textPrimary },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: C.surface2,
    color: C.textPrimary,
  },
  inputError: { borderColor: C.red },
  error:      { fontSize: 12, color: C.red },
})
