import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'

interface Props {
  onPress: () => void
  label: string
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  onPress, label, loading, disabled,
  variant = 'primary', size = 'md',
}: Props) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#6366f1'} size="small" />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primary: { backgroundColor: '#6366f1' },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#6366f1' },
  ghost:   { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  size_sm: { paddingVertical: 8,  paddingHorizontal: 14, minHeight: 36 },
  size_md: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 52 },
  label: { fontSize: 15, fontWeight: '600' },
  label_primary: { color: '#fff' },
  label_outline:  { color: '#6366f1' },
  label_ghost:    { color: '#6366f1' },
})
