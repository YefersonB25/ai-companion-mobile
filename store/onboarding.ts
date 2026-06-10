import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface OnboardingState {
  // true = user has completed onboarding, don't show again
  completed: boolean
  currentStep: 'welcome' | 'chat_mode' | 'voice_mode' | 'control_mode' | 'done'

  // Track which modes user has tried
  chatModeTried: boolean
  voiceModeTried: boolean
  controlModeTried: boolean

  // Actions
  setCompleted: (completed: boolean) => void
  setCurrentStep: (step: OnboardingState['currentStep']) => void
  nextStep: () => void
  skipOnboarding: () => void
  markChatModeTried: () => void
  markVoiceModeTried: () => void
  markControlModeTried: () => void
  reset: () => void
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed: false,
      currentStep: 'welcome',
      chatModeTried: false,
      voiceModeTried: false,
      controlModeTried: false,

      setCompleted: (completed: boolean) => set({ completed }),

      setCurrentStep: (step: OnboardingState['currentStep']) => set({ currentStep: step }),

      nextStep: () => {
        const steps: Array<OnboardingState['currentStep']> = [
          'welcome',
          'chat_mode',
          'voice_mode',
          'control_mode',
          'done',
        ]
        const current = get().currentStep
        const currentIndex = steps.indexOf(current)
        if (currentIndex < steps.length - 1) {
          set({ currentStep: steps[currentIndex + 1] })
        } else {
          set({ completed: true, currentStep: 'done' })
        }
      },

      skipOnboarding: () => {
        set({ completed: true, currentStep: 'done' })
      },

      markChatModeTried: () => set({ chatModeTried: true }),
      markVoiceModeTried: () => set({ voiceModeTried: true }),
      markControlModeTried: () => set({ controlModeTried: true }),

      reset: () => set({
        completed: false,
        currentStep: 'welcome',
        chatModeTried: false,
        voiceModeTried: false,
        controlModeTried: false,
      }),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
