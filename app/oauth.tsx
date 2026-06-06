import { useEffect } from 'react'
import { Redirect } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { useOAuthReturn } from '@/store/oauthReturn'

/**
 * Ruta destino del deep link ai-companion://oauth?google=connected.
 * Tras autorizar Google en el navegador, el callback reabre la app aquí.
 * Marca el flag de éxito para que Ajustes refresque las integraciones y
 * redirige de vuelta a Ajustes.
 */
export default function OAuthRoute() {
  const { google } = useLocalSearchParams<{ google?: string }>()

  useEffect(() => {
    if (google === 'connected') {
      useOAuthReturn.getState().markGoogleConnected()
    }
  }, [google])

  return <Redirect href="/(app)/settings" />
}
