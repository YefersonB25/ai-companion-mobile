#!/usr/bin/env bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_HOST="root@ai.omnirepair.online"
BACKEND_PATH="/var/www/ai-companion"
DOWNLOAD_URL_BASE="http://ai.omnirepair.online/downloads"
PLATFORM="android"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

confirm() {
    local prompt="$1"
    local default="${2:-n}"
    read -p "$(echo -e ${YELLOW})$prompt (y/N)$(echo -e ${NC}) " -n 1 -r response
    echo
    [[ "$response" == "y" ]] || [[ "$response" == "Y" ]]
}

# Main
main() {
    print_header "AI Companion - Release Script"

    # Get version
    local current_version=$(jq -r '.expo.version' app.json)
    local suggested_version="${current_version%.*}.$((${current_version##*.} + 1))"
    
    echo "Versión actual: $current_version"
    echo "Versión sugerida: $suggested_version"
    echo ""
    
    read -p "Nueva versión [$suggested_version]: " new_version
    new_version=${new_version:-$suggested_version}
    
    if ! [[ $new_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Versión inválida"
        exit 1
    fi

    print_success "Nueva versión: $new_version"
    
    # Changelog
    echo ""
    print_step "Ingresa cambios (línea vacía para terminar):"
    local changelog=""
    while IFS= read -r line; do
        [ -z "$line" ] && break
        changelog="$changelog$line"$'\n'
    done

    # Confirm
    echo ""
    if ! confirm "¿Continuar con la release?"; then
        print_error "Cancelada"
        exit 1
    fi

    echo ""
    print_header "Ejecutando Release"

    # Update versions
    print_step "Actualizando versiones..."
    local version_code=$(echo "$new_version" | cut -d. -f3)
    jq ".expo.version = \"$new_version\" | .expo.ios.buildNumber = \"$version_code\" | .expo.android.versionCode = $version_code" app.json > app.json.tmp && mv app.json.tmp app.json
    jq ".version = \"$new_version\"" package.json > package.json.tmp && mv package.json.tmp package.json
    print_success "Versiones actualizadas"

    # Commit
    print_step "Haciendo commit..."
    git add app.json package.json
    git commit -m "Bump version to v$new_version

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
    print_success "Commiteado"

    # Build APK
    print_step "Compilando APK..."
    npm run build:prod > /dev/null 2>&1 || { print_error "Build falló"; exit 1; }
    print_success "APK compilado"

    # Upload APK
    print_step "Subiendo APK..."
    scp dist/ai-companion-v${new_version}.apk "$BACKEND_HOST:$BACKEND_PATH/public/downloads/" > /dev/null 2>&1 || { print_error "Upload falló"; exit 1; }
    print_success "APK subido"

    # Publish version
    print_step "Publicando en backend..."
    local changelog_lines=$(echo "$changelog" | grep -v '^$' || echo "Release v$new_version")
    ssh "$BACKEND_HOST" << EOF > /dev/null 2>&1 || { print_error "Publicación falló"; exit 1; }
cd $BACKEND_PATH
php artisan app:release $new_version --platform=$PLATFORM --url='$DOWNLOAD_URL_BASE/ai-companion-v${new_version}.apk' << 'EOCMD'
$version_code
$changelog_lines

EOCMD
EOF
    print_success "Versión publicada"

    # Push
    print_step "Haciendo push..."
    git push origin master > /dev/null 2>&1 || { print_error "Push falló"; exit 1; }
    print_success "Código pusheado"

    # Deploy
    print_step "Haciendo deploy..."
    ssh "$BACKEND_HOST" "bash $BACKEND_PATH/deploy.sh" > /dev/null 2>&1 || { print_error "Deploy falló"; exit 1; }
    print_success "Backend deployado"

    # Verify
    print_step "Verificando..."
    local response=$(curl -s "https://ai.omnirepair.online/api/app/version")
    local returned_version=$(echo "$response" | jq -r '.version // empty')
    [ "$returned_version" == "$new_version" ] && print_success "Verificado: v$new_version" || print_error "Verificación falló"

    echo ""
    print_header "✓ Release Completada"
    echo "Versión $new_version está lista"
}

trap 'print_error "Interrumpido"; exit 1' INT TERM
main "$@"
