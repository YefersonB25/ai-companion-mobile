import { useEffect, useState } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import * as Application from 'expo-application'
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
      // expo-application reads the native build values (always reliable in standalone APK).
      const nativeBuild = Application.nativeBuildVersion ?? '1'
      const versionCode = parseInt(nativeBuild, 10) || 1
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
