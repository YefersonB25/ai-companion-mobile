import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet, Text } from 'react-native'
import { C } from '@/lib/theme'

interface Props {
  isRecording: boolean
  recordingDuration?: number
  interimText?: string
  variant?: 'compact' | 'expanded'
}

/**
 * Animated waveform visualizer during voice recording.
 * Shows: 4 bars pulsing in sync → visual feedback that mic is active.
 * Inspired by Shazam, Siri, and Google Assistant listening states.
 */
export default function AnimatedWaveform({
  isRecording,
  recordingDuration = 0,
  interimText = '',
  variant = 'compact',
}: Props) {
  // Create 4 independent animations (one per bar)
  const animations = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ]

  useEffect(() => {
    if (!isRecording) {
      // Reset all bars to minimum height
      animations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }).start()
      })
      return
    }

    // Start staggered pulse animations for each bar
    const loops = animations.map((anim, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(idx * 50), // Stagger start time
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]),
        { iterations: -1 }
      )
    )

    loops.forEach((loop) => loop.start())

    return () => {
      loops.forEach((loop) => loop.stop())
    }
  }, [isRecording])

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  if (variant === 'expanded') {
    return (
      <View style={styles.containerExpanded}>
        <View style={styles.waveformRow}>
          {animations.map((anim, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.barExpanded,
                {
                  transform: [
                    {
                      scaleY: anim.interpolate({
                        inputRange: [0.3, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {interimText && (
          <Text style={styles.interimText} numberOfLines={2}>
            Entendí: "{interimText}"
          </Text>
        )}

        <Text style={styles.durationText}>
          {formatDuration(recordingDuration)} grabando
        </Text>
      </View>
    )
  }

  // Compact variant (inline in ChatInput)
  return (
    <View style={styles.containerCompact}>
      {animations.map((anim, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.barCompact,
            {
              transform: [
                {
                  scaleY: anim.interpolate({
                    inputRange: [0.3, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    height: 24,
  },
  barCompact: {
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: C.primary,
  },
  containerExpanded: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 80,
  },
  barExpanded: {
    width: 6,
    height: 60,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  interimText: {
    fontSize: 14,
    color: C.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
  durationText: {
    fontSize: 12,
    color: C.textSecondary,
  },
})
