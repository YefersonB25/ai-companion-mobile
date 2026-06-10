import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { C } from '@/lib/theme'
import { ErrorMessage } from '@/lib/errorMessages'

interface Props {
  error: ErrorMessage | null
  onDismiss?: () => void
  onAction?: () => void
  duration?: number
}

/**
 * Error banner that slides in from top.
 * Displays contextual error messages with action buttons.
 * Auto-dismisses after duration (unless severity='error').
 */
export default function ErrorBanner({ error, onDismiss, onAction, duration = 5000 }: Props) {
  const slideAnim = useRef(new Animated.Value(-100)).current
  const dismissTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (error) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()

      // Auto-dismiss non-error messages
      if (error.severity !== 'error' && duration > 0) {
        dismissTimeout.current = setTimeout(() => {
          onDismiss?.()
        }, duration)
      }
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }

    return () => {
      if (dismissTimeout.current) clearTimeout(dismissTimeout.current)
    }
  }, [error])

  if (!error) return null

  const bgColor = {
    error: C.red,
    warning: C.primary,
    info: C.primaryDark,
  }[error.severity]

  const icon = {
    error: 'alert-circle',
    warning: 'warning',
    info: 'information-circle',
  }[error.severity]

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: bgColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={icon as any} size={20} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{error.title}</Text>
          <Text style={styles.description}>{error.description}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {error.action && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              onAction?.()
              onDismiss?.()
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>{error.action}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onDismiss}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  closeBtn: {
    padding: 6,
  },
})
