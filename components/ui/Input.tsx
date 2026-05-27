import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native'

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
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label:     { fontSize: 14, fontWeight: '500', color: '#1e293b' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#1e293b',
  },
  inputError: { borderColor: '#ef4444' },
  error: { fontSize: 12, color: '#ef4444' },
})
