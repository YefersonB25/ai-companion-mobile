import { useEffect, useState } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import Constants from 'expo-constants'
import api from './api'

export interface AppUpdateInfo {
  version: string
  version_code: number
  changelog: string[]
  download_url: string | null
  is_required: boolean
}

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null)

  const check = async () => {
    try {
      const versionCode =
        Platform.OS === 'android'
          ? (Constants.expoConfig?.android?.versionCode ?? 1)
          : parseInt(Constants.expoConfig?.ios?.buildNumber ?? '1', 10)

      const platform = Platform.OS === 'ios' ? 'ios' : 'android'

      const { data } = await api.get('/app/version', {
        params: { platform, version_code: versionCode },
      })

      if (data.update_available) {
        setUpdateInfo(data)
      }
    } catch {
      // silently ignore — no update check on network error
    }
  }

  // Check on mount
  useEffect(() => {
    check()
  }, [])

  // Re-check when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check()
    })
    return () => sub.remove()
  }, [])

  const dismiss = () => setUpdateInfo(null)

  return { updateInfo, dismiss }
}
