import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { AppUpdateInfo } from '@/lib/useAppUpdate'

interface Props {
  info: AppUpdateInfo
  onDismiss: () => void
}

export default function UpdateModal({ info, onDismiss }: Props) {
  const openDownload = () => {
    if (info.download_url) Linking.openURL(info.download_url)
  }

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
          {/* Header */}
          <View className="bg-indigo-600 px-6 pt-6 pb-4">
            <Text className="text-white text-xl font-bold">
              Actualización disponible
            </Text>
            <Text className="text-indigo-200 text-sm mt-1">
              Versión {info.version}
            </Text>
          </View>

          {/* Changelog */}
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

          {/* Actions */}
          <View className="px-6 py-4 gap-2">
            {info.download_url && (
              <Pressable
                onPress={openDownload}
                className="bg-indigo-600 rounded-xl py-3 items-center active:opacity-80"
              >
                <Text className="text-white font-semibold text-base">
                  Actualizar ahora
                </Text>
              </Pressable>
            )}

            {!info.is_required && (
              <Pressable
                onPress={onDismiss}
                className="py-3 items-center"
              >
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
