import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useVoiceTrigger } from '@/store/voiceTrigger'

/**
 * Ruta destino del deep link ai-companion://voice.
 * Activa el trigger de voz y redirige al chat principal.
 */
export default function VoiceRoute() {
  useEffect(() => {
    useVoiceTrigger.getState().trigger()
  }, [])

  return <Redirect href="/(app)" />
}
