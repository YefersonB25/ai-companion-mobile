# AI Companion — App Mobile (Expo / React Native)

Aplicación móvil del asistente personal de IA. Chat con streaming, voz (STT/TTS), wake word "Hey Aria", notificaciones push y mapa mental de memoria.

---

## Stack

| | Tecnología |
|--|------------|
| Framework | Expo SDK 56 + React Native 0.85 |
| Navegación | Expo Router v4 (file-based) |
| Estilos | NativeWind v4 + Tailwind v4 |
| Estado | Zustand |
| Auth | Expo SecureStore (tokens) |
| Voz STT | expo-speech-recognition (continuous mode) |
| Voz TTS | expo-speech |
| Wake word | Vosk (Android nativo, modelo español ~40MB) |
| Push | Expo Push Notifications |

---

## Desarrollo local

### Requisitos
- Node.js 20+
- Expo Go en el celular **o** emulador Android/iOS
- Backend corriendo y accesible en red local

### Instalación

```bash
git clone https://github.com/YefersonB25/ai-companion-mobile.git
cd ai-companion-mobile
npm install
```

### Configurar IP del backend

Editar `lib/api.ts` y cambiar la IP por la de tu máquina en la red local:

```typescript
const BASE_URL = 'http://192.168.X.X/api'  // tu IP local
```

### Arrancar

```bash
npm start   # abre el QR para escanear con Expo Go
```

---

## Pantallas (tabs)

| Tab | Ruta | Descripción |
|-----|------|-------------|
| Chat | `/(app)/index` | Chat principal con IA, voz y TTS |
| Historial | `/(app)/conversations` | Lista de conversaciones |
| Memoria | `/(app)/memory` | Mapa mental de nodos |
| Proveedores | `/(app)/providers` | Configurar proveedores IA |
| Configuración | `/(app)/settings` | TTS, wake word, notificaciones |
| Perfil | `/(app)/profile` | Datos personales |

---

## Funcionalidades de voz

### Dictado (STT)
- Toca el ícono del micrófono en el chat
- Usa `expo-speech-recognition` en modo `continuous: true`
- Se envía automáticamente cuando hay resultado final

### Respuesta hablada (TTS)
- Se activa cuando el asistente responde a un mensaje de voz
- Usa `expo-speech` con idioma `es-ES`
- Se puede desactivar con el ícono de volumen en el header

### Wake word "Hey Aria" (solo Android)
- Activa el servicio desde **Configuración → Escuchar siempre**
- Frases: "Hey Aria", "Oye Aria", "Hola Aria"
- Implementado con Vosk (on-device, no requiere internet)
- El modelo español (~40MB) se descomprime en el primer inicio
- Requiere exención de optimización de batería para funcionar en background

### Activación por botón power (Android)
- Mantener presionado el botón power → intent ASSIST → activa dictado
- Configurar en Samsung: Ajustes → Funciones avanzadas → Tecla lateral

---

## Build APK (producción)

### Requisitos
- Java 17: `export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/.../Contents/Home`
- Android SDK: `export ANDROID_HOME=~/Library/Android/sdk`

### Compilar

```bash
# 1. Incrementar versión en app.json (version y android.versionCode)

# 2. Actualizar build.gradle
# android/app/build.gradle → versionCode y versionName

# 3. Compilar
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.19/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=~/Library/Android/sdk
export PATH="$JAVA_HOME/bin:$PATH"
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
cd android && ./gradlew assembleRelease
```

El APK queda en: `android/app/build/outputs/apk/release/app-release.apk`

### Subir al servidor

```bash
# Subir APK
scp android/app/build/outputs/apk/release/app-release.apk \
  root@134.122.21.84:/var/www/ai-companion/public/downloads/ai-companion-vX.X.X.apk

# Registrar versión en la API
curl -sL -X POST "https://ai.omnirepair.online/api/app/version" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "version": "X.X.X",
    "version_code": N,
    "changelog": ["Fix: ...", "Feat: ..."],
    "download_url": "https://ai.omnirepair.online/downloads/ai-companion-vX.X.X.apk",
    "is_required": false
  }'
```

O usando el script incluido:
```bash
API_TOKEN=tu_token bash scripts/publish-apk.sh \
  android/app/build/outputs/apk/release/app-release.apk
```

---

## Notas importantes

- **`/android` está en `.gitignore`** — los archivos nativos no se versionan.
  Si se regenera con `expo prebuild --clean`, se pierden los archivos nativos del WakeWord.
  **Nunca correr `expo prebuild --clean`** a menos que vayas a recrear manualmente:
  - `android/app/src/main/java/com/aicompanion/mobile/wakeword/` (WakeWordService, Module, Package)
  - `android/app/src/main/assets/model-es/` (modelo Vosk español)
  - Las entradas en `AndroidManifest.xml` y `MainApplication.kt`

- **IP del backend**: cambiar en `lib/api.ts` según la red (dev) o usar dominio (prod).

- **Expo prebuild sin `--clean`** es seguro y no borra los archivos nativos:
  ```bash
  npx expo prebuild --platform android   # sin --clean
  ```

---

## Versiones publicadas

| Versión | versionCode | Cambios |
|---------|------------|---------|
| 1.0.11 | 12 | Fix voz se apaga inmediatamente, wake word carga modelo, botón power activa asistente |
| 1.0.10 | 11 | Wake word "Hey Aria" con Vosk, mejoras de chat y notificaciones |
| 1.0.9 | 10 | Adjuntos de imagen, exportar conversaciones, indicador de voz pulsante |
