import { NativeModules, Platform } from 'react-native'

const Native = (NativeModules as { DeviceControl?: DeviceControlNative }).DeviceControl

interface DeviceControlNative {
  lockScreen(): Promise<boolean>
  isDeviceAdmin(): Promise<boolean>
  requestDeviceAdmin(): Promise<null>
  setFlashlight(on: boolean): Promise<boolean>
  setVolume(level: number): Promise<boolean>
  getVolume(): Promise<{ current: number; max: number }>
  setBrightness(level: number): Promise<boolean>
  wakeScreen(): Promise<boolean>
  hasNotificationAccess(): Promise<boolean>
  requestNotificationAccess(): Promise<null>
  canWriteSettings(): Promise<boolean>
  getNotifications(): Promise<string>
}

export const deviceControl = {
  available: Platform.OS === 'android' && !!Native,

  async lockScreen(): Promise<boolean> {
    if (!Native) return false
    return Native.lockScreen()
  },
  async isDeviceAdmin(): Promise<boolean> {
    if (!Native) return false
    return Native.isDeviceAdmin()
  },
  async requestDeviceAdmin(): Promise<void> {
    if (!Native) return
    await Native.requestDeviceAdmin()
  },
  async setFlashlight(on: boolean): Promise<void> {
    if (!Native) return
    await Native.setFlashlight(on)
  },
  async setVolume(level: number): Promise<void> {
    if (!Native) return
    await Native.setVolume(level)
  },
  async getVolume(): Promise<{ current: number; max: number }> {
    if (!Native) return { current: 8, max: 15 }
    return Native.getVolume()
  },
  async setBrightness(level: number): Promise<void> {
    if (!Native) return
    await Native.setBrightness(level)
  },
  async wakeScreen(): Promise<void> {
    if (!Native) return
    await Native.wakeScreen()
  },
  async hasNotificationAccess(): Promise<boolean> {
    if (!Native) return false
    return Native.hasNotificationAccess()
  },
  async requestNotificationAccess(): Promise<void> {
    if (!Native) return
    await Native.requestNotificationAccess()
  },
  async canWriteSettings(): Promise<boolean> {
    if (!Native) return false
    return Native.canWriteSettings()
  },
  async getNotifications(): Promise<any[]> {
    if (!Native) return []
    try {
      const json = await Native.getNotifications()
      return JSON.parse(json)
    } catch { return [] }
  },
}
