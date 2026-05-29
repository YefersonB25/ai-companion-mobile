/**
 * Phone action executor. The assistant emits JSON action blocks in its response
 * (delimited by [ACTION]...[/ACTION]). This module parses them out and executes
 * the matching native call (SMS, dial, music, etc.).
 *
 * Supported actions:
 *   { "type": "send_sms",   "contact": "Maria", "message": "Voy en camino" }
 *   { "type": "make_call",  "contact": "Maria" }
 *   { "type": "play_music", "query": "rock clásico", "app": "spotify" }
 *   { "type": "open_app",   "name": "whatsapp" }
 */
import { Alert, Linking, Platform } from 'react-native'
import * as Contacts from 'expo-contacts'
import * as SMS from 'expo-sms'
import * as IntentLauncher from 'expo-intent-launcher'
import { scheduleReminder } from './localNotifications'

export interface PhoneAction {
  type: 'send_sms' | 'make_call' | 'play_music' | 'open_app' | 'set_reminder'
  contact?: string
  message?: string
  query?: string
  app?: string
  name?: string
  when?: string
}

/** Extract action blocks from text and return cleaned text + actions list. */
export function parseActions(text: string): { cleanText: string; actions: PhoneAction[] } {
  const actions: PhoneAction[] = []
  const cleanText = text.replace(/\[ACTION\]([\s\S]*?)\[\/ACTION\]/g, (_, json) => {
    try {
      const parsed = JSON.parse(json.trim())
      if (parsed?.type) actions.push(parsed)
    } catch {
      // ignore malformed action blocks
    }
    return ''
  }).trim()
  return { cleanText, actions }
}

async function findContactPhone(name: string): Promise<string | null> {
  const { status } = await Contacts.requestPermissionsAsync()
  if (status !== 'granted') return null

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    name,
  })

  const match = data.find(c =>
    c.name?.toLowerCase().includes(name.toLowerCase()) && c.phoneNumbers?.length
  )
  return match?.phoneNumbers?.[0]?.number ?? null
}

/**
 * Music player URI schemes for popular Android apps.
 * Each value is a search URI that triggers a play action inside the app.
 */
const MUSIC_APPS: Record<string, { label: string; uri: (q: string) => string; pkg: string }> = {
  spotify: {
    label: 'Spotify',
    uri: (q) => `spotify:search:${encodeURIComponent(q)}`,
    pkg: 'com.spotify.music',
  },
  youtubemusic: {
    label: 'YouTube Music',
    uri: (q) => `https://music.youtube.com/search?q=${encodeURIComponent(q)}`,
    pkg: 'com.google.android.apps.youtube.music',
  },
  youtube: {
    label: 'YouTube',
    uri: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    pkg: 'com.google.android.youtube',
  },
}

const APP_PACKAGES: Record<string, string> = {
  whatsapp:    'com.whatsapp',
  telegram:    'org.telegram.messenger',
  spotify:     'com.spotify.music',
  youtube:     'com.google.android.youtube',
  gmail:       'com.google.android.gm',
  maps:        'com.google.android.apps.maps',
  chrome:      'com.android.chrome',
  instagram:   'com.instagram.android',
  facebook:    'com.facebook.katana',
  twitter:     'com.twitter.android',
}

async function executeSendSMS(action: PhoneAction) {
  if (!action.contact || !action.message) {
    Alert.alert('Acción inválida', 'Falta contacto o mensaje.')
    return
  }
  const phone = await findContactPhone(action.contact)
  if (!phone) {
    Alert.alert('Contacto no encontrado', `No encontré "${action.contact}" en tus contactos.`)
    return
  }
  const { result } = await SMS.sendSMSAsync(phone, action.message)
  if (result === 'cancelled') {
    // user cancelled, no need to alert
  }
}

async function executeMakeCall(action: PhoneAction) {
  if (!action.contact) {
    Alert.alert('Acción inválida', 'Falta contacto.')
    return
  }
  const phone = await findContactPhone(action.contact)
  if (!phone) {
    Alert.alert('Contacto no encontrado', `No encontré "${action.contact}" en tus contactos.`)
    return
  }
  Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`)
}

async function pickMusicApp(): Promise<string | null> {
  // Detect which music apps the user has installed via canOpenURL.
  const installed: { key: string; label: string }[] = []
  for (const [key, cfg] of Object.entries(MUSIC_APPS)) {
    const can = await Linking.canOpenURL(cfg.uri('test'))
    if (can) installed.push({ key, label: cfg.label })
  }
  if (installed.length === 0) return null
  if (installed.length === 1) return installed[0].key

  return new Promise((resolve) => {
    Alert.alert(
      'Elige reproductor',
      '¿En cuál quieres reproducir?',
      [
        ...installed.map((app) => ({
          text: app.label,
          onPress: () => resolve(app.key),
        })),
        { text: 'Cancelar', style: 'cancel' as const, onPress: () => resolve(null) },
      ],
    )
  })
}

async function executePlayMusic(action: PhoneAction) {
  if (!action.query) {
    Alert.alert('Acción inválida', 'Falta búsqueda de música.')
    return
  }
  const appKey = action.app ?? (await pickMusicApp())
  if (!appKey) return
  const cfg = MUSIC_APPS[appKey]
  if (!cfg) {
    Alert.alert('Reproductor no soportado', `"${appKey}" no está en la lista.`)
    return
  }
  Linking.openURL(cfg.uri(action.query))
}

async function executeOpenApp(action: PhoneAction) {
  if (!action.name) {
    Alert.alert('Acción inválida', 'Falta nombre de app.')
    return
  }
  const pkg = APP_PACKAGES[action.name.toLowerCase()]
  if (!pkg) {
    Alert.alert('App no reconocida', `No conozco "${action.name}". Las soportadas son: ${Object.keys(APP_PACKAGES).join(', ')}.`)
    return
  }
  if (Platform.OS !== 'android') {
    Alert.alert('No soportado', 'Esta acción solo funciona en Android.')
    return
  }
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
      packageName: pkg,
      flags: 0x10000000, // FLAG_ACTIVITY_NEW_TASK
    })
  } catch {
    Alert.alert('No instalada', `${action.name} no está instalada en tu teléfono.`)
  }
}

async function executeSetReminder(action: PhoneAction) {
  if (!action.when || !action.message) {
    Alert.alert('Acción inválida', 'Falta hora o mensaje del recordatorio.')
    return
  }
  const id = await scheduleReminder(action.when, action.message)
  if (!id) {
    Alert.alert('Recordatorio no programado', 'La fecha ya pasó o no se pudo entender.')
  }
}

export async function executeAction(action: PhoneAction) {
  switch (action.type) {
    case 'send_sms':     return executeSendSMS(action)
    case 'make_call':    return executeMakeCall(action)
    case 'play_music':   return executePlayMusic(action)
    case 'open_app':     return executeOpenApp(action)
    case 'set_reminder': return executeSetReminder(action)
  }
}
