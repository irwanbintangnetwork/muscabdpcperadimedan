#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "════════════════════════════════════════════════════════════════"
echo "   📱 Android APK Builder"
echo "   Muscab DPC Peradimedan"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
fi

echo -e "${BLUE}🏗️  Building web application...${NC}"
pnpm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Web build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Web build completed${NC}"
echo ""

# Copy web assets to Android
echo -e "${BLUE}📥 Copying web assets to Android...${NC}"
npx cap copy android

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Capacitor copy failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Web assets copied${NC}"
echo ""

# Ask user for build type
echo -e "${YELLOW}Select build type:${NC}"
echo "1) Debug APK (for testing)"
echo "2) Release APK (signed, for production)"
echo "3) AAB Bundle (for Play Store)"
echo ""
read -p "Enter choice (1, 2, or 3): " choice

case $choice in
    1)
        echo -e "${BLUE}🔨 Building Debug APK...${NC}"
        cd android
        chmod +x ./gradlew
        ./gradlew assembleDebug
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Debug APK created successfully!${NC}"
            echo -e "${BLUE}📁 Output: android/app/build/outputs/apk/debug/app-debug.apk${NC}"
        else
            echo -e "${RED}✗ Debug build failed!${NC}"
            exit 1
        fi
        ;;
    2)
        echo -e "${YELLOW}Release build requires keystore configuration.${NC}"
        read -p "Keystore file path (e.g., android/app/keystore.jks): " keystore_path
        read -sp "Keystore password: " keystore_pass
        echo ""
        read -p "Key alias (e.g., muscab-key): " key_alias
        read -sp "Key password: " key_pass
        echo ""
        
        if [ ! -f "$keystore_path" ]; then
            echo -e "${RED}✗ Keystore file not found at $keystore_path${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🔨 Building Release APK...${NC}"
        cd android
        chmod +x ./gradlew
        ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file="$keystore_path" \
            -Pandroid.injected.signing.store.password="$keystore_pass" \
            -Pandroid.injected.signing.key.alias="$key_alias" \
            -Pandroid.injected.signing.key.password="$key_pass"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Release APK created successfully!${NC}"
            echo -e "${BLUE}📁 Output: android/app/build/outputs/apk/release/app-release.apk${NC}"
        else
            echo -e "${RED}✗ Release build failed!${NC}"
            exit 1
        fi
        ;;
    3)
        echo -e "${YELLOW}AAB build requires keystore configuration.${NC}"
        read -p "Keystore file path (e.g., android/app/keystore.jks): " keystore_path
        read -sp "Keystore password: " keystore_pass
        echo ""
        read -p "Key alias (e.g., muscab-key): " key_alias
        read -sp "Key password: " key_pass
        echo ""
        
        if [ ! -f "$keystore_path" ]; then
            echo -e "${RED}✗ Keystore file not found at $keystore_path${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🔨 Building AAB Bundle...${NC}"
        cd android
        chmod +x ./gradlew
        ./gradlew bundleRelease \
            -Pandroid.injected.signing.store.file="$keystore_path" \
            -Pandroid.injected.signing.store.password="$keystore_pass" \
            -Pandroid.injected.signing.key.alias="$key_alias" \
            -Pandroid.injected.signing.key.password="$key_pass"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ AAB Bundle created successfully!${NC}"
            echo -e "${BLUE}📁 Output: android/app/build/outputs/bundle/release/app-release.aab${NC}"
        else
            echo -e "${RED}✗ AAB build failed!${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}✗ Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}"
echo "════════════════════════════════════════════════════════════════"
echo "   ✅ Build completed successfully!"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"
