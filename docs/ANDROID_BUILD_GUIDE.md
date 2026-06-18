# 📱 Android APK Build Guide

## Daftar Isi
1. [Setup Awal](#setup-awal)
2. [Konfigurasi Keystore](#konfigurasi-keystore)
3. [GitHub Secrets](#github-secrets)
4. [Build Lokal](#build-lokal)
5. [Build Otomatis](#build-otomatis)
6. [Troubleshooting](#troubleshooting)

## Setup Awal

### Persyaratan
- Node.js 18+
- pnpm 8+
- Java 11+
- Android SDK (API level 34)
- Android NDK (versi 25.2.9519653)

### Install Capacitor

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Install dependencies
pnpm install

# Build web application
pnpm run build

# Add Android platform
npx cap add android
