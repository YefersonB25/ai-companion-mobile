# 🚀 Cheat Sheet - Actualizar Versión

## Actualización Rápida en 5 Pasos

### Paso 1: Actualizar versiones (Mobile)
```bash
cd /Users/yefersonbc/Herd/ai-companion-mobile
# Editar app.json (version, buildNumber, versionCode)
# Editar package.json (version)
git add app.json package.json
git commit -m "Bump version to v1.0.62"
```

### Paso 2: Compilar APK
```bash
npm run build:prod
```

### Paso 3: Subir APK a servidor
```bash
scp dist/ai-companion-v1.0.62.apk root@ai.omnirepair.online:/var/www/ai-companion/public/downloads/
```

### Paso 4: Publicar en Backend
```bash
ssh root@ai.omnirepair.online
cd /var/www/ai-companion
php artisan app:release 1.0.62 --platform=android --url="http://ai.omnirepair.online/downloads/ai-companion-v1.0.62.apk"
# Responder preguntas del comando
```

### Paso 5: Deploy
```bash
ssh root@ai.omnirepair.online "bash /var/www/ai-companion/deploy.sh"
```

## ✅ Verificación
```bash
curl https://ai.omnirepair.online/api/app/version | jq
```

---

**Versión de referencia**: 1.0.62
**Actualizado**: 2026-06-12
