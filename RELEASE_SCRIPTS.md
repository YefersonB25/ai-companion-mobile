# 🚀 Release Scripts - Automatizar Actualizaciones

## Scripts Disponibles

### 1. `release.sh` - Release Completo

**Ubicación**: `/ai-companion-mobile/release.sh`

**Automatiza TODO**:
1. Actualiza versiones en archivos
2. Compilar APK
3. Subir APK al servidor
4. Publicar versión en backend
5. Hacer git push
6. Deploy automático
7. Verificar que funciona

**Uso**:
```bash
./release.sh
```

**Flujo**: Interactivo con preguntas claras

---

### 2. `publish-version.sh` - Publicar Versión Manualmente

**Ubicación**: `/ai-companion/publish-version.sh`

**Útil para**:
- Cuando ya tienes compilado el APK
- Cuando necesitas actualizar una versión existente

**Uso**:
```bash
./publish-version.sh 1.0.62 android
```

---

## 📋 Casos de Uso

### Release Completo (Recomendado)
```bash
./release.sh
# ~10-15 minutos, todo automático
```

### Publicar Versión Existente
```bash
./publish-version.sh 1.0.62
# ~2 minutos, solo BD
```

### Manual Rápido
```bash
# Seguir VERSION_CHEATSHEET.md
# ~5-10 minutos
```

---

## 🔧 Requisitos

```bash
node --version
npm --version
git --version
ssh user@host
curl --version
jq --version  # brew install jq
```

---

**Última actualización**: 2026-06-12
