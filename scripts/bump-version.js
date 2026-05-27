#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/bump-version.js patch   → 1.0.0 → 1.0.1
 *   node scripts/bump-version.js minor   → 1.0.0 → 1.1.0
 *   node scripts/bump-version.js major   → 1.0.0 → 2.0.0
 *
 * Increments version, versionCode (Android) and buildNumber (iOS).
 */

const fs = require('fs')
const path = require('path')

const appJsonPath = path.join(__dirname, '..', 'app.json')
const pkgPath     = path.join(__dirname, '..', 'package.json')

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const type = process.argv[2] ?? 'patch'
if (!['major', 'minor', 'patch'].includes(type)) {
  console.error('Usage: node bump-version.js [major|minor|patch]')
  process.exit(1)
}

const [major, minor, patch] = appJson.expo.version.split('.').map(Number)
let newVersion
if (type === 'major') newVersion = `${major + 1}.0.0`
else if (type === 'minor') newVersion = `${major}.${minor + 1}.0`
else newVersion = `${major}.${minor}.${patch + 1}`

const prevVersionCode = appJson.expo.android.versionCode
const newVersionCode  = prevVersionCode + 1
const newBuildNumber  = String(newVersionCode)

appJson.expo.version                   = newVersion
appJson.expo.android.versionCode       = newVersionCode
appJson.expo.ios.buildNumber           = newBuildNumber
pkg.version                            = newVersion

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n')
fs.writeFileSync(pkgPath,     JSON.stringify(pkg,     null, 2) + '\n')

console.log(`Bumped: ${appJson.expo.version.replace(newVersion, '')}${newVersion} (versionCode=${newVersionCode}, buildNumber=${newBuildNumber})`)
