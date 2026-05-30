# AI Companion — App Mobile (Expo / React Native)

Asistente personal **Aria** modo Jarvis. Chat con streaming, wake word "Hey Aria", conversación continua manos libres, TTS, control del dispositivo por voz, notificaciones push y actualizaciones in-app.

---

## Stack

| | Tecnología |
|--|------------|
| Framework | Expo SDK 56 + React Native 0.85 |
| Navegación | Expo Router v4 (file-based) |
| Estilos | NativeWind v4 + Tailwind v4 |
| Estado | Zustand |
| Auth | Expo SecureStore (tokens) |
| Voz STT | expo-speech-recognition (chat) + Android SpeechRecognizer (Jarvis) |
| Voz TTS | Android TextToSpeech (Jarvis) + expo-speech (chat) |
| Wake word | Vosk (Android nativo, on-device, modelo español ~38MB) |
| Control dispositivo | DevicePolicyManager + CameraManager + AudioManager |
| Notificaciones | NotificationListenerService (AriaNotificationListener) |
| Token seguridad | EncryptedSharedPreferences AES-256 GCM (Android Keystore) |
| Push | Expo Push Notifications |

---

## Desarrollo local

### Requisitos
- Node.js 20+
- Expo Go en el celular o emulador Android

### Instalación

```bash
git clone https://github.com/YefersonB25/ai-companion-mobile.git
cd ai-companion-mobile
npm install
```

Edita `lib/api.ts` con tu IP local:
```typescript
const BASE_URL = 'http://192.168.X.X/api'
```

### Arrancar

```bash
npm start   # QR para Expo Go
```

---

## Pantallas (tabs)

| Ruta | Descripción |
|------|-------------|
| `/(app)/index` | Chat con IA, streaming, TTS, imágenes adjuntas |
| `/(app)/conversations` | Historial de conversaciones |
| `/(app)/memory` | Mapa mental de nodos de memoria |
| `/(app)/providers` | Configurar proveedores IA |
| `/(app)/settings` | Wake word, TTS, dispositivo, modo conducción |
| `/(app)/profile` | Perfil personal |
| `/(app)/help` | Guía de comandos (botón `?` en el chat) |

---

## Asistente de Voz — Modo Jarvis

### Flujo completo manos libres

```
Di "Hey Aria"
  ↓ Vosk detecta wake word (on-device, sin internet)
  ↓ Aria dice "Dime"
  ↓ Android SpeechRecognizer escucha tu pregunta (5s timeout)
  ↓ POST /api/conversations/{id}/messages (stream:false, voice:true)
  ↓ Android TextToSpeech lee la respuesta
  ↓ Espera 8s tu siguiente pregunta (conversación continua)
  ↓ Si no hay respuesta: "Si no necesitas nada más, daré por finalizada la conversación"
  ↓ Vuelve a escuchar wake word
```

### Activación

| Frase | Acción |
|-------|--------|
| "Hey Aria" / "Oye Aria" / "Hola Aria" | Activa el asistente |
| "gracias" / "adiós" / "chao" | Cierra la conversación |

### Parámetros que se envían al backend

```json
{
  "content": "tu pregunta",
  "stream": false,
  "voice": true,
  "driving_mode": false,
  "location": { "lat": 10.4, "lng": -75.5 }
}
```

### Servicio en background

- `START_STICKY` — Android lo reinicia si lo mata
- `stopWithTask=false` — sobrevive al cierre de la app
- `BootReceiver` — se inicia al encender el dispositivo (si estaba habilitado)
- `EncryptedSharedPreferences` — token cifrado AES-256 GCM (Android Keystore)

---

## Control del Dispositivo (por voz o chat)

| Comando | Acción | Permiso requerido |
|---------|--------|-------------------|
| "Bloquea la pantalla" | Bloquea | Device Admin |
| "Enciende la pantalla" | Enciende | Ninguno (WakeScreenActivity) |
| "Enciende/apaga la linterna" | Linterna | Ninguno |
| "Sube/baja el volumen a [N]" | Volumen media 0-15 | Ninguno |
| "Pon brillo al máximo/mínimo" | Brillo 0-255 | Write Settings |
| "Lee mis notificaciones" | Resume con IA | Notification Access |
| "Llama a [nombre/número]" | Llamada | CALL_PHONE |
| "Manda WhatsApp a [nombre]" | WhatsApp (wa.me) | Ninguno |
| "Envía SMS a [nombre]" | SMS | SEND_SMS |
| "Reanuda la música" | Play media key | Ninguno |
| "Abre [app]" | Launch intent | Overlay (Android 10+) |

### Activar permisos especiales

Ir a **Ajustes → Control del dispositivo**:
1. **Administrador de dispositivo** → para bloquear pantalla
2. **Acceso a notificaciones** → para leer/resumir notificaciones
3. **Escritura en ajustes** → para controlar brillo
4. **Superposición** → para abrir apps desde el servicio de voz

---

## Módulos Nativos Android

### WakeWordService (`:wakeword`)
- Vosk con gramática fija para frases de activación
- STT → API → TTS en loop
- Conversación continua 8s después de responder
- `EncryptedSharedPreferences` para token

### DeviceControlModule
- `lockScreen()` — DevicePolicyManager.lockNow()
- `setFlashlight(on)` — CameraManager
- `setVolume(level)` — AudioManager
- `setBrightness(level)` — Settings.System
- `wakeScreen()` — WakeScreenActivity transparente
- `getNotifications()` — AriaNotificationListener companion

### AriaNotificationListener
- `NotificationListenerService` en background
- Filtra notificaciones de la propia app
- Retorna JSON array para resumir con IA

### UpdateModule
- Descarga APK con `DownloadManager`
- Valida integridad: tamaño mínimo 10MB + magic bytes `PK`
- Notificación tap-para-instalar (Android 10+ no permite install desde background)

---

## Onboarding y Ayuda

- **Onboarding** (5 slides): aparece en el primer inicio
  1. Hola, soy Aria
  2. Actívame con tu voz
  3. Controlo tu teléfono
  4. Más que un asistente
  5. ¡Todo listo!
- **Pantalla de Ayuda** (`?` en el chat): referencia completa de comandos por categoría

---

## Build APK (producción)

### Requisitos

```bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.19/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=~/Library/Android/sdk
export PATH="$JAVA_HOME/bin:$PATH"
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### Compilar

```bash
# 1. Actualizar version en app.json (version + android.versionCode)
# 2. Actualizar android/app/build.gradle (versionCode + versionName)
# 3. Compilar
cd android && ./gradlew assembleRelease
```

APK en: `android/app/build/outputs/apk/release/app-release.apk`

### Subir y registrar

```bash
# Subir APK
scp android/app/build/outputs/apk/release/app-release.apk \
  root@134.122.21.84:/var/www/ai-companion/public/downloads/ai-companion-vX.X.X.apk

# Registrar versión (ruta admin requiere token de admin)
curl -X POST "https://ai.omnirepair.online/api/admin/app/version" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"android","version":"X.X.X","version_code":N,
       "changelog":["..."],
       "download_url":"https://ai.omnirepair.online/downloads/ai-companion-vX.X.X.apk",
       "is_required":false}'
```

---

## ⚠️ Notas críticas sobre `/android`

**`/android` está en `.gitignore`** — los archivos nativos NO se versionan.

Si se regenera con `expo prebuild --clean`, se pierden permanentemente. **Nunca correr `expo prebuild --clean`** sin recrear manualmente:

| Directorio | Contenido |
|------------|-----------|
| `android/.../wakeword/` | WakeWordService, WakeWordModule, WakeWordPackage, BootReceiver, TokenStore |
| `android/.../device/` | DeviceControlModule, DeviceControlPackage, DeviceAdminReceiver, WakeScreenActivity, AriaNotificationListener |
| `android/.../update/` | UpdateModule, UpdatePackage |
| `android/.../assets/model-es/` | Modelo Vosk español (~38MB) — descargar de alphacephei.com/vosk/models |

`expo prebuild` sin `--clean` es seguro:
```bash
npx expo prebuild --platform android   # ✅ sin --clean
```

---

## Historial de versiones

| Versión | versionCode | Cambios principales |
|---------|------------|---------------------|
| 1.0.30 | 31 | FlatList optimizada, imágenes aspect ratio, validación APK, filtro notificaciones propias |
| 1.0.29 | 30 | Delay TTS→STT 2000ms (race condition fix) |
| 1.0.28 | 29 | Token cifrado EncryptedSharedPreferences AES-256 GCM |
| 1.0.27 | 28 | GPS permissions, frozen state fix, NPE play_music |
| 1.0.26 | 27 | Onboarding 5 slides, pantalla de ayuda, Aria conoce sus capacidades |
| 1.0.25 | 26 | Control dispositivo, modo voz/conducción, GPS context |
| 1.0.24 | 25 | Conversación continua restaurada, reintentos STT |
| 1.0.19 | 20 | WhatsApp deep link, overlay fix, acciones mejoradas |
| 1.0.18 | 19 | Modo Jarvis hands-free, BootReceiver, descarga in-app |
| 1.0.14 | 15 | Jarvis: STT+API+TTS sin tocar teléfono |
| 1.0.10 | 11 | Wake word "Hey Aria" con Vosk |
