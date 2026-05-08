#!/bin/bash
# Script to setup SoftEther VPN Client on GitHub Actions runner

set -e

echo "========================================="
echo "Setting up SoftEther VPN Client"
echo "========================================="

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

SOFTETHER_VERSION="v4.42-9798-rtm"
SOFTETHER_FILE="softether-vpnclient-${SOFTETHER_VERSION}-2023.06.30-linux-x64-64bit.tar.gz"
SOFTETHER_URL="https://github.com/SoftEtherVPN/SoftEtherVPN_Stable/releases/download/${SOFTETHER_VERSION}/${SOFTETHER_FILE}"

echo "Downloading SoftEther from: $SOFTETHER_URL"
wget -q "$SOFTETHER_URL" -O softether.tar.gz

if [ ! -f softether.tar.gz ]; then
    echo "❌ Failed to download SoftEther"
    exit 1
fi

echo "Extracting..."
tar -xzf softether.tar.gz

EXTRACTED_DIR=$(ls -d softether-vpnclient-*/ 2>/dev/null | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
    echo "❌ Failed to find extracted directory"
    ls -la
    exit 1
fi

echo "Found extracted directory: $EXTRACTED_DIR"
cd "$EXTRACTED_DIR"

echo "Building SoftEther (this may take a moment)..."
echo "yes" | make > /dev/null 2>&1

echo "Installing..."
sudo make install > /dev/null 2>&1

sudo mkdir -p /usr/local/vpnclient

if command -v vpnclient >/dev/null 2>&1; then
    echo "✅ SoftEther VPN Client installed successfully"
else
    echo "❌ SoftEther VPN Client installation failed"
    exit 1
fi

cd /
rm -rf "$TEMP_DIR"

echo "✅ Setup complete"