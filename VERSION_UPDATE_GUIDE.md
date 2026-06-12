# Guía de Actualización de Versión - AI Companion

## 📋 Resumen del Sistema

El sistema de actualización automática funciona así:
1. **Cliente (Mobile)**: Chequea periódicamente si hay nueva versión
2. **Backend**: Expone endpoint `/api/app/version`
3. **Usuario**: Recibe notificación y puede descargar

## 🏗️ Componentes

### Backend
- **Tabla BD**: `app_versions`
- **Controlador**: `app/Http/Controllers/Api/AppVersionController.php`
- **Endpoint**: `GET /api/app/version`
- **Comando**: `php artisan app:release`

### Mobile
- **Hook**: `lib/useAppUpdate.ts` - Chequea actualizaciones
- **Modal**: `components/ui/UpdateModal.tsx` - Muestra UI
- **Descargador**: `lib/apkDownloader.ts` - Instala APK

### Archivos Configuración
- **`app.json`**: version, buildNumber, versionCode
- **`package.json`**: version (debe coincidir)

## 🚀 Pasos para Actualizar

### Paso 1: Actualizar Archivos
```bash
# app.json: version, ios.buildNumber, android.versionCode
# package.json: version
npm run sync-version  # Si existe el script
```

### Paso 2: Compilar
```bash
npm run build:prod
```

### Paso 3: Publicar Versión
```bash
cd /ai-companion
php artisan app:release X.X.XX --platform=android --url="..."
```

### Paso 4: Deploy
```bash
git push origin main
ssh root@ai.omnirepair.online "bash /var/www/ai-companion/deploy.sh"
```

## ✅ Verificación

```bash
curl /api/app/version
adb logcat | grep UPDATE
```

---

**Última actualización**: 2026-06-12
