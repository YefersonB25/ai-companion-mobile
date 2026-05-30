import { NativeModules, Platform } from 'react-native'

const Native = (NativeModules as { UpdateManager?: UpdateManagerNative }).UpdateManager

interface UpdateManagerNative {
  downloadAndInstall(url: string, version: string): Promise<boolean>
  canInstallApks(): Promise<boolean>
  requestInstallPermission(): Promise<null>
}

export const updateManager = {
  available: Platform.OS === 'android' && !!Native,

  async downloadAndInstall(url: string, version: string): Promise<void> {
    if (!Native) throw new Error('UpdateManager no disponible')
    await Native.downloadAndInstall(url, version)
  },

  async canInstallApks(): Promise<boolean> {
    if (!Native) return false
    try { return await Native.canInstallApks() } catch { return false }
  },

  async requestInstallPermission(): Promise<void> {
    if (!Native) return
    try { await Native.requestInstallPermission() } catch { /* no-op */ }
  },
}
