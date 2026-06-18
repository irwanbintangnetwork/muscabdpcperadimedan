#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "════════════════════════════════════════════════════════════════"
echo "   🚀 Android APK Setup Script"
echo "   Muscab DPC Peradimedan"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠ pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}✗ Java not found. Please install Java 11+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Java $(java -version 2>&1 | head -1)${NC}"

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${RED}✗ ANDROID_HOME not set. Please install Android SDK${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Android SDK at $ANDROID_HOME${NC}"

# Install Capacitor
echo -e "${BLUE}\n📦 Installing Capacitor CLI...${NC}"
npm install -g @capacitor/cli

# Install dependencies
echo -e "${BLUE}\n📥 Installing project dependencies...${NC}"
pnpm install

# Build web
echo -e "${BLUE}\n🏗️  Building web application...${NC}"
pnpm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Web build failed!${NC}"
    exit 1
fi

# Initialize Capacitor
echo -e "${BLUE}\n🚀 Initializing Capacitor...${NC}"
npx cap init --web-dir dist

# Add Android
echo -e "${BLUE}\n📱 Adding Android platform...${NC}"
npx cap add android

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to add Android platform${NC}"
    exit 1
fi

# Copy assets
echo -e "${BLUE}\n📋 Copying web assets to Android...${NC}"
npx cap copy android

echo -e "${GREEN}\n✅ Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Generate keystore: keytool -genkey -v -keystore android/app/keystore.jks ..."
echo "2. Setup GitHub Secrets for CI/CD"
echo "3. Build APK: bash scripts/build-apk.sh"
echo ""
echo -e "📖 See ${YELLOW}docs/ANDROID_BUILD_GUIDE.md${NC} for detailed instructions"
