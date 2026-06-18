# 📱 Android APK Build Guide - Muscab DPC Peradimedan

## 📋 Daftar Isi
1. [Persyaratan](#persyaratan)
2. [Setup Awal](#setup-awal)
3. [Konfigurasi Keystore](#konfigurasi-keystore)
4. [GitHub Secrets](#github-secrets)
5. [Build Lokal](#build-lokal)
6. [Build Otomatis](#build-otomatis)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## ⚙️ Persyaratan

- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ pnpm 8+ (`npm install -g pnpm`)
- ✅ Java 11+ ([Download](https://adoptium.net/))
- ✅ Android SDK (API level 34)
- ✅ Android NDK (versi 25.2.9519653)
- ✅ Git

## 🚀 Setup Awal

### 1. Install Capacitor CLI

```bash
npm install -g @capacitor/cli
