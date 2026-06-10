import { Stack } from 'expo-router'
import { C } from '@/lib/theme'

/**
 * Onboarding Stack Layout
 *
 * Screens flow:
 * welcome → chat-mode → voice-mode → control-mode → (back to app)
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: C.bg },
        animationEnabled: true,
        animationTypeForReplace: true,
      }}
    >
      <Stack.Screen
        name="welcome"
        options={{
          animationEnabled: true,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="chat-mode"
        options={{
          animationEnabled: true,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="voice-mode"
        options={{
          animationEnabled: true,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="control-mode"
        options={{
          animationEnabled: true,
          gestureEnabled: false,
        }}
      />
    </Stack>
  )
}
