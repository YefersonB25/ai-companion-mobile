/**
 * Local notifications: scheduled on-device without needing FCM/push service.
 * Used for daily briefing and user-set reminders.
 *
 * All scheduled notifications survive app close. They DO NOT survive a reboot
 * unless we re-schedule on app open (we do — see `syncDailyBriefing()` called
 * from RootLayout).
 */
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from './api'

const BRIEFING_ID_KEY      = '@briefing_notif_id'
const BRIEFING_LAST_DAY    = '@briefing_last_day'
const REMINDER_PREFIX      = '@reminder_'

async function ensurePermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync()
  if (status === 'granted') return true
  const req = await Notifications.requestPermissionsAsync()
  return req.status === 'granted'
}

/**
 * Schedule the daily briefing notification. Idempotent: cancels any previous
 * schedule before creating a new one. Reads time from /api/settings.
 *
 * Behavior:
 *  - Schedules a repeating local notif at the user-configured time (HH:MM)
 *  - When fired, the notification displays "Buenos días 🌅" with a generic body
 *  - If the user taps it, the app opens and the chat screen requests the actual
 *    briefing content from /api/briefing/today
 */
export async function syncDailyBriefing(): Promise<void> {
  try {
    if (!(await ensurePermission())) return

    const { data: settings } = await api.get('/settings')
    if (!settings?.briefing_enabled) {
      await cancelDailyBriefing()
      return
    }

    const time = (settings.briefing_time ?? '08:00') as string
    const [h, m] = time.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return

    // Cancel any previously scheduled briefing
    const existingId = await AsyncStorage.getItem(BRIEFING_ID_KEY)
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => {})
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Buenos días 🌅',
        body: 'Tu briefing del día está listo. Tócame para escucharlo.',
        data: { type: 'briefing', screen: 'briefing' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
      },
    })

    await AsyncStorage.setItem(BRIEFING_ID_KEY, id)
  } catch (e) {
    console.warn('syncDailyBriefing failed', e)
  }
}

export async function cancelDailyBriefing(): Promise<void> {
  const id = await AsyncStorage.getItem(BRIEFING_ID_KEY)
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    await AsyncStorage.removeItem(BRIEFING_ID_KEY)
  }
}

/**
 * Fetch today's briefing content from the backend. Used when the briefing
 * notification fires and the user taps it (the chat screen calls this).
 * Returns null if disabled or on error.
 */
export async function fetchTodayBriefing(): Promise<string | null> {
  try {
    const { data } = await api.get('/briefing/today')
    if (!data?.enabled) return null
    return data.content ?? null
  } catch {
    return null
  }
}

/**
 * Schedule a one-shot local reminder for a specific date/time.
 * Used by the `set_reminder` action emitted by the AI.
 *
 * `when` accepts ISO 8601 ("2026-05-30T15:00:00") or a relative time interpreted
 * by the backend before emitting the action.
 */
export async function scheduleReminder(when: string, message: string): Promise<string | null> {
  try {
    if (!(await ensurePermission())) return null
    const date = new Date(when)
    if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) {
      return null
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Recordatorio',
        body: message,
        data: { type: 'reminder', message },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    })

    // Track for visibility/debug
    await AsyncStorage.setItem(REMINDER_PREFIX + id, JSON.stringify({ when, message }))
    return id
  } catch (e) {
    console.warn('scheduleReminder failed', e)
    return null
  }
}

export async function listReminders(): Promise<Array<{ id: string; when: string; message: string }>> {
  const keys = await AsyncStorage.getAllKeys()
  const reminderKeys = keys.filter(k => k.startsWith(REMINDER_PREFIX))
  const entries = await AsyncStorage.multiGet(reminderKeys)
  return entries
    .map(([k, v]) => {
      try {
        const parsed = JSON.parse(v ?? '{}')
        return { id: k.replace(REMINDER_PREFIX, ''), when: parsed.when, message: parsed.message }
      } catch {
        return null
      }
    })
    .filter((x): x is { id: string; when: string; message: string } => x !== null)
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
  await AsyncStorage.removeItem(REMINDER_PREFIX + id)
}
