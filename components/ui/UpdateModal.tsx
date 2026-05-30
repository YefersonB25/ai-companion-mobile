import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { AppUpdateInfo } from '@/lib/useAppUpdate'
import { updateManager } from '@/lib/updateManager'

interface Props {
  info: AppUpdateInfo
  onDismiss: () => void
}

export default function UpdateModal({ info, onDismiss }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [started, setStarted]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const handleUpdate = async () => {
    if (!info.download_url) return
    setError(null)

    if (updateManager.available) {
      setDownloading(true)
      try {
        await updateManager.downloadAndInstall(info.download_url, info.version)
        setStarted(true) // descarga iniciada — el usuario verá notificación al terminar
      } catch (e: any) {
        const msg: string = e?.message ?? 'Error desconocido'
        if (msg.includes('PERMISSION_REQUIRED')) {
          setError(msg)
        } else {
          setError(`Error: ${msg}`)
        }
      } finally {
        setDownloading(false)
      }
    } else {
      const { Linking } = require('react-native')
      Linking.openURL(info.download_url)
    }
  }

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
          <View className="bg-indigo-600 px-6 pt-6 pb-4">
            <Text className="text-white text-xl font-bold">Actualización disponible</Text>
            <Text className="text-indigo-200 text-sm mt-1">Versión {info.version}</Text>
          </View>

          <ScrollView className="px-6 pt-4" style={{ maxHeight: 260 }}>
            <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
              ¿Qué hay de nuevo?
            </Text>
            {info.changelog.map((item, i) => (
              <View key={i} className="flex-row items-start mb-2">
                <Text className="text-indigo-500 mr-2 mt-0.5">•</Text>
                <Text className="text-gray-700 text-sm flex-1">{item}</Text>
              </View>
            ))}
          </ScrollView>

          {error && (
            <View className="mx-6 mt-3 bg-red-50 rounded-xl p-3 border border-red-200">
              <Text className="text-red-600 text-xs">{error}</Text>
            </View>
          )}

          <View className="px-6 py-4 gap-2">
            {info.download_url && !started && (
              <Pressable
                onPress={handleUpdate}
                disabled={downloading}
                className="bg-indigo-600 rounded-xl py-3 items-center active:opacity-80"
                style={{ opacity: downloading ? 0.7 : 1 }}
              >
                {downloading ? (
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white font-semibold text-base">Iniciando descarga...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">
                    {updateManager.available ? 'Descargar e instalar' : 'Actualizar ahora'}
                  </Text>
                )}
              </Pressable>
            )}

            {started && (
              <View className="bg-green-50 rounded-xl py-3 px-4 items-center border border-green-200">
                <Text className="text-green-700 font-semibold text-base">✓ Descargando en segundo plano</Text>
                <Text className="text-green-600 text-xs mt-1 text-center">
                  Cuando termine verás una notificación. Tócala para instalar.
                </Text>
              </View>
            )}

            {!info.is_required && !downloading && (
              <Pressable onPress={onDismiss} className="py-3 items-center">
                <Text className="text-gray-400 text-sm">Recordarme después</Text>
              </Pressable>
            )}

            {info.is_required && (
              <Text className="text-center text-gray-400 text-xs pb-1">
                Esta actualización es obligatoria para continuar usando la app.
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}
