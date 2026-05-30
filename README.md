# AI Companion — App Mobile (Expo / React Native)

Asistente personal de IA tipo Jarvis. Chat con streaming, wake word "Hey Aria", conversación continua, TTS, control del dispositivo por voz y acciones del teléfono.

---

## Stack

| | Tecnología |
|--|------------|
| Framework | Expo SDK 56 + React Native 0.85 |
| Navegación | Expo Router v4 (file-based) |
| Estilos | NativeWind v4 + Tailwind v4 |
| Estado | Zustand |
| Auth | Expo SecureStore (tokens) |
| Voz STT | expo-speech-recognition (chat) + Android SpeechRecognizer (servicio) |
| Voz TTS | Android TextToSpeech (servicio) + expo-speech (chat) |
| Wake word | Vosk (Android nativo, modelo español ~40MB, on-device) |
| Push | Expo Push Notifications |
| Control dispositivo | DevicePolicyManager + CameraManager + AudioManager |
| Notificaciones | NotificationListenerService |

---

## Desarrollo local

### Requisitos
- Node.js 20+
- Expo Go en el celular **o** emulador Android

### Instalación

```bash
git clone https://github.com/YefersonB25/ai-companion-mobile.git
cd ai-companion-mobile
npm install
```

Edita `lib/api.ts` con la IP de tu máquina en la red local:
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
| `/(app)/index` | Chat principal con IA, streaming, voz, TTS |
| `/(app)/conversations` | Historial de conversaciones |
| `/(app)/memory` | Mapa mental de nodos de memoria |
| `/(app)/providers` | Configurar proveedores IA |
| `/(app)/settings` | TTS, wake word, control dispositivo, modo conducción |
| `/(app)/profile` | Datos personales |

---

## Asistente de Voz — Modo Jarvis

### Activación

| Frase | Acción |
|-------|--------|
| "Hey Aria" / "Oye Aria" / "Hola Aria" | Activa el asistente |
| "gracias" / "adiós" / "chao" | Cierra la conversación |

**Sin tocar el teléfono:** Aria escucha, responde con TTS y sigue esperando tu siguiente pregunta durante 8 segundos. Si no hay respuesta, dice "Si no necesitas nada más, daré por finalizada la conversación."

### Modos especiales

| Modo | Cómo activar | Efecto |
|------|-------------|--------|
| **Modo voz** | Automático al usar wake word | Respuestas 2-3 oraciones sin markdown |
| **Modo conducción** | Toggle en Ajustes | Respuestas 1-2 oraciones máximo, prioridad seguridad |

### Acciones del teléfono (voz o chat)

| Comando | Acción |
|---------|--------|
| "Llama a [nombre/número]" | Llama directamente |
| "Envíale un WhatsApp a [nombre] diciendo [mensaje]" | Abre WhatsApp con mensaje |
| "Manda un SMS a [nombre]" | Envía SMS |
| "Pon música de [artista]" | Abre YouTube Music/Spotify |
| "Reanuda la música" | Reanuda reproducción activa |
| "Abre [app]" | Abre WhatsApp, Telegram, YouTube, Gmail, Maps, etc. |
| "Bloquea la pantalla" | Bloquea (requiere Device Admin) |
| "Enciende la linterna" / "Apaga la linterna" | Control de linterna |
| "Sube el volumen a [nivel]" | Volumen de media (0-15) |
| "Pon brillo al máximo" / "Baja el brillo" | Brillo de pantalla (requiere Write Settings) |
| "Lee mis notificaciones" | Resume notificaciones pendientes con IA |
| "Pide un [taxi/comida]..." | Búsqueda web + sugerencias |

### Permisos especiales (activar una vez en Ajustes)

| Permiso | Para qué |
|---------|---------|
| **Administrador de dispositivo** | Bloquear pantalla con voz |
| **Acceso a notificaciones** | Leer y resumir notificaciones |
| **Escritura en ajustes** | Controlar brillo de pantalla |
| **Superposición** | Abrir apps desde el servicio de voz |

---

## Build APK (producción)

### Requisitos

```bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.19/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=~/Library/Android/sdk
```

### Compilar

```bash
# 1. Actualizar versión en app.json (version + android.versionCode)
# 2. Actualizar android/app/build.gradle (versionCode + versionName)
# 3. Compilar:
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
export PATH="$JAVA_HOME/bin:$PATH"
cd android && ./gradlew assembleRelease
```

APK en: `android/app/build/outputs/apk/release/app-release.apk`

### Subir y registrar

```bash
# Subir APK
scp android/app/build/outputs/apk/release/app-release.apk \
  root@134.122.21.84:/var/www/ai-companion/public/downloads/ai-companion-vX.X.X.apk

# Registrar versión
curl -sL -X POST "https://ai.omnirepair.online/api/app/version" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"android","version":"X.X.X","version_code":N,"changelog":["..."],"download_url":"https://ai.omnirepair.online/downloads/ai-companion-vX.X.X.apk","is_required":false}'
```

---

## Notas importantes

- **`/android` está en `.gitignore`** — los archivos nativos no se versionan. Si se regenera con `expo prebuild --clean`, hay que recrear manualmente:
  - `android/app/src/main/java/com/aicompanion/mobile/wakeword/` (WakeWordService, Module, Package, BootReceiver, TokenStore)
  - `android/app/src/main/java/com/aicompanion/mobile/device/` (DeviceControlModule, Package, DeviceAdminReceiver, WakeScreenActivity, AriaNotificationListener)
  - `android/app/src/main/java/com/aicompanion/mobile/update/` (UpdateModule, UpdatePackage)
  - `android/app/src/main/assets/model-es/` (modelo Vosk español, descargar de alphacephei.com/vosk/models)
  - **Nunca correr `expo prebuild --clean`**

- **IP del backend**: cambiar en `lib/api.ts` para desarrollo local.

- **Modelo Vosk**: se descomprime automáticamente de assets al primer inicio (`~38MB`).

---

## Versiones publicadas

| Versión | versionCode | Cambios principales |
|---------|------------|---------------------|
| 1.0.25 | 26 | Control dispositivo, modo voz/conducción, GPS, notificaciones IA |
| 1.0.24 | 25 | Conversación continua restaurada, reintentos STT, cierre con "gracias" |
| 1.0.22 | 23 | Barge-in eliminado (causaba falsos positivos), errores STT silenciosos |
| 1.0.19 | 20 | Acciones teléfono mejoradas, WhatsApp deep link, overlay fix |
| 1.0.18 | 19 | Modo Jarvis completo hands-free, BootReceiver, descarga in-app |
| 1.0.17 | 18 | Fix stream:false para respuestas de voz confiables |
| 1.0.14 | 15 | Modo Jarvis: STT+API+TTS sin tocar teléfono, conversación continua |
| 1.0.10 | 11 | Wake word "Hey Aria" con Vosk, mejoras de chat |
