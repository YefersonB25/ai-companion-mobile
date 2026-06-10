/**
 * User-friendly error messages for Aria.
 * Replaces generic "Error" with context-specific, actionable feedback.
 *
 * Pattern:
 * - What happened (user perspective, not technical)
 * - Why it happened (if not obvious)
 * - What to do (action or reassurance)
 */

export type ErrorCode =
  | 'no_provider'
  | 'no_microphone_permission'
  | 'no_internet'
  | 'api_error'
  | 'tts_error'
  | 'speech_recognition_error'
  | 'license_invalid'
  | 'license_expired'
  | 'quota_exceeded'
  | 'unknown'

export interface ErrorMessage {
  title: string
  description: string
  action?: string
  actionHandler?: () => void
  severity: 'info' | 'warning' | 'error'
}

export const errorMessages: Record<ErrorCode, ErrorMessage> = {
  no_provider: {
    title: '⚙️ Sin proveedor de IA configurado',
    description: 'Necesitas agregar una API key para que Aria pueda responderte. Gemini es gratis.',
    action: 'Configurar',
    severity: 'warning',
  },

  no_microphone_permission: {
    title: '🎤 Micrófono sin permiso',
    description: 'Aria necesita acceso al micrófono para escucharte. Habilítalo en Configuración.',
    action: 'Abrir Configuración',
    severity: 'warning',
  },

  no_internet: {
    title: '📡 Sin conexión a internet',
    description: 'Aria necesita internet para conectarse con el servidor de IA. Verifica tu WiFi o datos móviles.',
    action: 'Reintentar',
    severity: 'warning',
  },

  api_error: {
    title: '⚠️ Error al conectar con Aria',
    description: 'El servidor está teniendo problemas. Intenta de nuevo en unos segundos.',
    action: 'Reintentar',
    severity: 'error',
  },

  tts_error: {
    title: '🔊 Error en lectura en voz alta',
    description: 'No pudimos reproducir la respuesta de Aria. Puedes leerla en el chat.',
    action: 'Entendido',
    severity: 'info',
  },

  speech_recognition_error: {
    title: '🎙️ No entendí lo que dijiste',
    description: 'Intenta hablar más claro o acércate al micrófono.',
    action: 'Reintentar',
    severity: 'info',
  },

  license_invalid: {
    title: '🔐 Licencia inválida',
    description: 'Tu licencia de Aria no es válida. Contacta a soporte.',
    action: 'Contactar',
    severity: 'error',
  },

  license_expired: {
    title: '⏰ Licencia expirada',
    description: 'Tu licencia de Aria venció. Renuévala para continuar usando.',
    action: 'Renovar',
    severity: 'warning',
  },

  quota_exceeded: {
    title: '📊 Límite de solicitudes alcanzado',
    description: 'Alcanzaste el límite de mensajes por hoy. Intenta mañana.',
    action: 'Entendido',
    severity: 'warning',
  },

  unknown: {
    title: '❌ Algo salió mal',
    description: 'Un error inesperado ocurrió. Intenta de nuevo o contacta a soporte.',
    action: 'Reintentar',
    severity: 'error',
  },
}

/**
 * Get error message from error code.
 * If code is unknown, returns generic error.
 */
export function getErrorMessage(code: ErrorCode | string): ErrorMessage {
  const msg = errorMessages[code as ErrorCode]
  return msg || errorMessages.unknown
}

/**
 * Parse API error response and map to user-friendly message.
 * Handles common API error responses.
 */
export function parseApiError(error: any): ErrorCode {
  if (!error) return 'unknown'

  // Check error code from API response
  if (error.response?.status === 401 || error.response?.status === 403) {
    return 'license_invalid'
  }

  if (error.response?.status === 429) {
    return 'quota_exceeded'
  }

  if (error.response?.status >= 500) {
    return 'api_error'
  }

  // Check error message
  const message = error.message?.toLowerCase() || ''
  const responseData = error.response?.data?.message?.toLowerCase() || ''

  if (message.includes('network') || message.includes('internet') || message.includes('offline')) {
    return 'no_internet'
  }

  if (responseData.includes('license')) {
    return 'license_invalid'
  }

  if (responseData.includes('quota') || responseData.includes('rate limit')) {
    return 'quota_exceeded'
  }

  if (responseData.includes('provider')) {
    return 'no_provider'
  }

  return 'api_error'
}

/**
 * Parse speech recognition error and map to user-friendly message.
 */
export function parseSpeechError(error: any): ErrorCode {
  if (!error) return 'speech_recognition_error'

  const message = error.message?.toLowerCase() || ''

  if (message.includes('permission') || message.includes('denied')) {
    return 'no_microphone_permission'
  }

  if (message.includes('network') || message.includes('offline')) {
    return 'no_internet'
  }

  return 'speech_recognition_error'
}
