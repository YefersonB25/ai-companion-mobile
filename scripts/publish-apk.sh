#!/usr/bin/env bash
# Usage: ./scripts/publish-apk.sh <apk-path> [--required]
#
# Uploads the APK to the server and registers the new version via the API.
# Requires: SERVER, API_URL, and API_TOKEN env vars (or edit defaults below).
set -e

APK_PATH="$1"
if [ -z "$APK_PATH" ]; then
  echo "Usage: $0 <path-to-apk> [--required]"
  exit 1
fi

REQUIRED=false
if [ "$2" = "--required" ]; then REQUIRED=true; fi

SERVER="${SERVER:-root@134.122.21.84}"
API_URL="${API_URL:-http://134.122.21.84/api}"
API_TOKEN="${API_TOKEN:-}"

if [ -z "$API_TOKEN" ]; then
  echo "Error: API_TOKEN env var is required (Bearer token of an admin user)."
  exit 1
fi

# Read version info from app.json
APP_JSON="$(dirname "$0")/../app.json"
VERSION=$(node -e "console.log(require('$APP_JSON').expo.version)")
VERSION_CODE=$(node -e "console.log(require('$APP_JSON').expo.android.versionCode)")
APK_NAME="ai-companion-v${VERSION}.apk"

echo "==> Uploading ${APK_NAME} to server..."
scp "$APK_PATH" "${SERVER}:/var/www/ai-companion/public/downloads/${APK_NAME}"

DOWNLOAD_URL="${API_URL%/api}/downloads/${APK_NAME}"

echo "==> Reading changelog from CHANGELOG entry..."
echo "Enter changelog items (one per line, empty line to finish):"
CHANGELOG=()
while IFS= read -r line; do
  [ -z "$line" ] && break
  CHANGELOG+=("$line")
done

# Build JSON array
CHANGELOG_JSON=$(printf '%s\n' "${CHANGELOG[@]}" | jq -R . | jq -s .)

echo "==> Registering version v${VERSION} (code ${VERSION_CODE}) via API..."
curl -s -X POST "${API_URL}/app/version" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{
    \"platform\": \"android\",
    \"version\": \"${VERSION}\",
    \"version_code\": ${VERSION_CODE},
    \"changelog\": ${CHANGELOG_JSON},
    \"download_url\": \"${DOWNLOAD_URL}\",
    \"is_required\": ${REQUIRED}
  }" | jq .

echo ""
echo "==> Done! APK disponible en: ${DOWNLOAD_URL}"
