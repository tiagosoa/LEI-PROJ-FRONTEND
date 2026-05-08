#!/bin/bash
# Script to setup SoftEther VPN Client on GitHub Actions runner

set -e

echo "========================================="
echo "Setting up SoftEther VPN Client"
echo "========================================="

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

SOFTETHER_URL="https://github.com/SoftEtherVPN/SoftEtherVPN_Stable/releases/download/v4.42-9798-rtm/softether-vpnclient-v4.42-9798-rtm-2023.06.30-linux-x64-64bit.tar.gz"

echo "Downloading SoftEther from: $SOFTETHER_URL"
wget -q "$SOFTETHER_URL" -O softether.tar.gz

if [ ! -f softether.tar.gz ]; then
    echo "❌ Failed to download SoftEther"
    exit 1
fi

echo "Extracting..."
tar -xzf softether.tar.gz

echo "Contents after extraction:"
ls -la

if [ -d "vpnclient" ]; then
    cd vpnclient
    echo "Found vpnclient directory"
elif [ -d "softether-vpnclient-"* ]; then
    cd softether-vpnclient-*/
    echo "Found softether-vpnclient directory"
else
    echo "Failed to find extracted directory"
    exit 1
fi

echo "Building SoftEther (this may take a moment)..."
echo "yes" | make > /dev/null 2>&1

echo "Installing..."
sudo make install > /dev/null 2>&1

sudo mkdir -p /usr/local/vpnclient

if command -v vpnclient >/dev/null 2>&1; then
    echo "SoftEther VPN Client installed successfully"
    vpnclient --version 2>/dev/null || echo "Version info not available"
else
    echo "SoftEther VPN Client installation failed"
    exit 1
fi

cd /
rm -rf "$TEMP_DIR"

echo "✅ Setup complete"