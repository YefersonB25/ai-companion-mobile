# 📱 AI Companion Release Guide

> Todo lo que necesitas saber sobre versiones, actualizaciones y releases

## 🎯 Quick Start

### Para hacer un release completo (lo más común):

```bash
cd /Users/yefersonbc/Herd/ai-companion-mobile
./release.sh
```

That's it! El script hace:
1. ✅ Actualiza versión
2. ✅ Compila APK
3. ✅ Sube APK
4. ✅ Publica en backend
5. ✅ Deploy
6. ✅ Verifica que funciona

**Tiempo**: ~10-15 minutos

---

## 📚 Documentación Completa

### 1. **Para Entender el Sistema**

Lee en este orden:

```
📄 Este archivo (README_RELEASES.md)
    ↓
📄 VERSION_CHEATSHEET.md (Referencia rápida)
    ↓
📄 VERSION_UPDATE_GUIDE.md (Guía completa - Mobile)
    ↓
📄 /ai-companion/APP_VERSIONING.md (Guía completa - Backend)
```

### 2. **Para Hacer un Release**

```
Opción A - Automated (Recomendado):
    → ./release.sh

Opción B - Manual:
    → Seguir VERSION_CHEATSHEET.md (pasos en 5 minutos)

Opción C - Publish solo:
    → /ai-companion/publish-version.sh
```

### 3. **Para Entender los Scripts**

```
📄 RELEASE_SCRIPTS.md - Documentación completa de scripts
```

---

## 🚀 Tres Formas de Hacer Release

### Forma 1: Totalmente Automática (RECOMENDADO)

```bash
./release.sh
```

**Pros**:
- ✅ Un comando
- ✅ Todo automático
- ✅ Interactivo y user-friendly
- ✅ Verifica que funciona
- ✅ Manejo de errores

**Contras**:
- ⏱️ Más lento (~15 min)
- 🔄 Necesita compilar APK

**Cuándo usar**: 90% de las veces

---

### Forma 2: Manual Rápido

```bash
# 1. Editar app.json, package.json manualmente
vim app.json
vim package.json

# 2. Compilar
npm run build:prod

# 3. Subir APK manualmente
scp dist/ai-companion-v1.0.62.apk root@ai.omnirepair.online:/var/www/ai-companion/public/downloads/

# 4. Publicar versión
cd /ai-companion
./publish-version.sh 1.0.62

# 5. Deploy (si hay cambios de código)
git push origin main
ssh root@ai.omnirepair.online "bash /var/www/ai-companion/deploy.sh"
```

**Pros**:
- 📖 Aprendes cómo funciona
- 🎯 Control total
- 🔍 Ves cada paso

**Contras**:
- ⚠️ Más propenso a errores
- ⏱️ Toma más tiempo

**Cuándo usar**: Para aprender o debugging

---

### Forma 3: Publish Solo (Sin APK)

```bash
cd /ai-companion
./publish-version.sh 1.0.62 android
```

**Pros**:
- ⚡ Super rápido (~2 min)
- 🎯 Solo publicar versión

**Contras**:
- ⚠️ Requiere APK pre-existente

**Cuándo usar**: 
- Ya compilaste el APK
- Necesitas actualizar changelog
- Push fallido pero APK ya existe

---

## 🎨 Flujo Visual

```
┌─────────────────────────────────────────────────────────┐
│  Usuario ejecuta: ./release.sh                          │
└─────────────┬───────────────────────────────────────────┘
              │
              ├─→ [INTERACTIVO] Preguntar versión
              │   (sugerir siguiente)
              │
              ├─→ [INTERACTIVO] Changelog
              │   (una línea por cambio)
              │
              ├─→ [INTERACTIVO] ¿Obligatoria?
              │
              ├─→ [CONFIRMACIÓN] Mostrar resumen
              │
              └─→ [AUTOMÁTICO] Ejecutar:
                  │
                  ├─→ Actualizar archivos (app.json, package.json)
                  │   └─→ Git commit
                  │
                  ├─→ npm run build:prod
                  │   └─→ Generar APK
                  │
                  ├─→ scp APK al servidor
                  │   └─→ Subir archivo
                  │
                  ├─→ php artisan app:release
                  │   └─→ Publicar en BD
                  │
                  ├─→ git push
                  │   └─→ Enviar código
                  │
                  ├─→ bash deploy.sh
                  │   └─→ Deploy backend
                  │
                  ├─→ curl /api/app/version
                  │   └─→ Verificar
                  │
                  └─→ [ÉXITO] ✓ Release completada
```

---

## 📋 Checklist Completo

### Pre-Release

```
□ Estoy en rama master
□ Todos los cambios están commiteados
□ Tengo notas de los cambios preparadas
□ SSH configurado sin contraseña (ssh-copy-id)
□ Tengo internet estable
```

### Ejecutar Release

```
./release.sh
```

### Post-Release

```
□ Esperar ~2 minutos para que se propague
□ Abrir app versión antigua en emulador/device
□ Confirmar que aparece modal de actualización
□ Descargar e instalar
□ Confirmar que funciona
□ Anunciar a usuarios (Slack, email, etc)
```

---

## 🔍 Verificación Manual

Después del release, verificar:

```bash
# 1. Endpoint retorna nueva versión
curl https://ai.omnirepair.online/api/app/version | jq

# Esperado:
{
  "update_available": true,
  "version": "1.0.62",
  "version_code": 62,
  ...
}

# 2. APK disponible
curl -I http://ai.omnirepair.online/downloads/ai-companion-v1.0.62.apk
# Esperado: 200 OK

# 3. DB tiene versión
ssh root@ai.omnirepair.online
php /var/www/ai-companion/artisan tinker
>>> AppVersion::latest()->first()
```

---

## 🆘 Troubleshooting

### El script falla en compilación

```bash
# Limpiar:
rm -rf node_modules dist
npm install

# Intentar de nuevo:
./release.sh
```

### El script falla en upload

```bash
# Verificar SSH:
ssh root@ai.omnirepair.online "ls /var/www/ai-companion/public/downloads/"

# Configurar SSH sin contraseña:
ssh-copy-id root@ai.omnirepair.online

# Intentar de nuevo:
./release.sh
```

### El endpoint sigue devolviendo versión vieja

```bash
# Clear cache en backend:
ssh root@ai.omnirepair.online "cd /var/www/ai-companion && php artisan cache:clear"

# Verificar BD:
ssh root@ai.omnirepair.online
mysql
USE ai_companion;
SELECT * FROM app_versions ORDER BY version_code DESC LIMIT 1;
```

### Mobile no detecta actualización

```bash
# En device:
adb logcat | grep UPDATE

# Verificar que app no tiene la nueva versión aún:
adb shell dumpsys package com.aicompanion.mobile | grep versionCode

# Forzar check manual:
- Cerrar app completamente
- Abrir app
- Debería checkear automáticamente
```

---

## 🎓 Ejemplos Reales

### Ejemplo 1: Patch Release (1.0.61 → 1.0.62)

```bash
$ ./release.sh

Versión actual: 1.0.61
Versión sugerida: 1.0.62

Ingresa la nueva versión [1.0.62]: [ENTER]

Ingresa cambios:
FIXES v1.0.62: NotificationListenerService
Fix: WakeWord initialization
[ENTER para terminar]

¿Es una actualización obligatoria? (y/N) [ENTER]

¿Continuar con la release? (Y/n) y

[... automatización ...]

✓ Release Completado
```

### Ejemplo 2: Minor Release (1.0.62 → 1.1.0)

```bash
$ ./release.sh

Versión actual: 1.0.62
Versión sugerida: 1.0.63

Ingresa la nueva versión [1.0.63]: 1.1.0

Ingresa cambios:
NEW: Voice control improvements
NEW: Dark mode UI
IMPROVED: Battery optimization
FIXED: Several bugs
[ENTER]

¿Es una actualización obligatoria? (y/N) [ENTER]

¿Continuar con la release? (Y/n) y

[... automatización ...]

✓ Release Completado
```

### Ejemplo 3: Actualización Obligatoria (Security)

```bash
$ ./release.sh

Versión actual: 1.1.0
Versión sugerida: 1.1.1

Ingresa la nueva versión [1.1.1]: [ENTER]

Ingresa cambios:
CRITICAL: Security patch - SQL injection vulnerability
[ENTER]

¿Es una actualización obligatoria? (y/N) y

¿Continuar con la release? (Y/n) y

[... automatización ...]

✓ Release Completado

# Resultado: Usuarios recibirán modal sin opción "Recordarme"
```

---

## 📊 Historial de Versiones

Para ver todas las versiones publicadas:

```bash
# En servidor:
ssh root@ai.omnirepair.online
php /var/www/ai-companion/artisan tinker

>>> AppVersion::orderBy('version_code', 'desc')->get(['version', 'version_code', 'is_required', 'updated_at'])
```

---

## 🔗 Enlaces Rápidos

| Recurso | Ubicación |
|---------|-----------|
| Este archivo | `README_RELEASES.md` |
| Cheat sheet | `VERSION_CHEATSHEET.md` |
| Guía mobile | `VERSION_UPDATE_GUIDE.md` |
| Guía backend | `../ai-companion/APP_VERSIONING.md` |
| Scripts docs | `RELEASE_SCRIPTS.md` |
| Release script | `release.sh` |
| Publish script | `../ai-companion/publish-version.sh` |

---

## 💡 Tips & Tricks

### Alias rápido

```bash
# Agregar a ~/.zshrc o ~/.bashrc:
alias release='cd ~/Herd/ai-companion-mobile && ./release.sh'
alias publish='cd ~/Herd/ai-companion && ./publish-version.sh'

# Usar:
release
publish 1.0.63
```

### Ver logs en tiempo real

```bash
ssh root@ai.omnirepair.online "tail -f /var/www/ai-companion/storage/logs/laravel.log"
```

### Resetear versiones (si hay error)

```bash
ssh root@ai.omnirepair.online
php /var/www/ai-companion/artisan tinker

# Ver últimas
>>> AppVersion::latest('id')->first()

# Eliminar si está mal
>>> AppVersion::find(ID)->delete()

# O marcar como no obligatoria
>>> AppVersion::find(ID)->update(['is_required' => false])
```

### Compilar sin release

```bash
npm run build:preview    # Para testing
npm run build:prod       # Para producción
```

---

## 🚨 Errores Comunes y Soluciones

| Error | Solución |
|-------|----------|
| `Permission denied` | `ssh-copy-id root@ai.omnirepair.online` |
| `jq: command not found` | `brew install jq` (macOS) o `apt-get install jq` (Linux) |
| `APK file not found` | Build falló. Revisar logs: `npm run build:prod` |
| `Endpoint returns old version` | `php artisan cache:clear` en servidor |
| Mobile no detecta | Cerrar app completamente, abrir de nuevo |
| Script se detiene | Ver último error en output, revisar logs |

---

## 📞 Support

### Si algo falla:

1. **Lee los logs**:
   ```bash
   # Script output
   ./release.sh 2>&1 | tail -50
   
   # Server logs
   ssh root@ai.omnirepair.online "tail -f /var/www/ai-companion/storage/logs/laravel.log"
   ```

2. **Revisa la documentación**:
   - `VERSION_CHEATSHEET.md` - Referencia rápida
   - `VERSION_UPDATE_GUIDE.md` - Guía completa
   - `RELEASE_SCRIPTS.md` - Docs de scripts

3. **Rollback si es necesario**:
   ```bash
   # Revertir commit mobile
   git revert HEAD
   
   # Eliminar versión backend
   ssh root@ai.omnirepair.online
   php /var/www/ai-companion/artisan tinker
   >>> AppVersion::where('version', '1.0.62')->delete()
   ```

---

## ✅ Summary

| Acción | Comando | Tiempo |
|--------|---------|--------|
| Release completo | `./release.sh` | 10-15m |
| Publish solo | `./publish-version.sh` | 2m |
| Manual rápido | Ver VERSION_CHEATSHEET | 5-10m |
| Verificar | `curl api/app/version` | 10s |

---

**Última actualización**: 2026-06-12

**Versión ejemplo**: 1.0.62

**Mantenedor**: YefersonB25

---

## 🎉 ¡Ahora estás listo!

Ejecuta:

```bash
cd /Users/yefersonbc/Herd/ai-companion-mobile
./release.sh
```

¡Y disfruta de releases automáticas! 🚀
