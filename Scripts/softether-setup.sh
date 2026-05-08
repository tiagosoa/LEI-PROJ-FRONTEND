#!/bin/bash
# Script to setup SoftEther VPN Client on GitHub Actions runner using pre-compiled binaries

set -e

echo "========================================="
echo "Setting up SoftEther VPN Client"
echo "========================================="

sudo apt-get update
sudo apt-get install -y wget

sudo mkdir -p /usr/local/vpnclient
cd /usr/local/vpnclient

echo "Downloading pre-compiled SoftEther binaries..."
sudo wget -q https://github.com/SoftEtherVPN/SoftEtherVPN_Stable/releases/download/v4.42-9798-rtm/softether-vpnclient-v4.42-9798-rtm-2023.06.30-linux-x64-64bit.tar.gz -O softether.tar.gz

echo "Extracting..."
sudo tar -xzf softether.tar.gz

# Find and move binaries
if [ -d "vpnclient" ]; then
    cd vpnclient
elif [ -d "softether-vpnclient-"* ]; then
    cd softether-vpnclient-*/
fi

echo "Installing binaries to /usr/local/bin..."
sudo cp -f vpnclient /usr/local/bin/ 2>/dev/null || true
sudo cp -f vpncmd /usr/local/bin/ 2>/dev/null || true
sudo chmod +x /usr/local/bin/vpnclient /usr/local/bin/vpncmd

if [ -f /usr/local/bin/vpnclient ] && [ -f /usr/local/bin/vpncmd ]; then
    echo "SoftEther VPN Client binaries installed successfully"
else
    echo "Failed to install binaries"
    ls -la /usr/local/bin/ | grep vpn
    exit 1
fi

sudo mkdir -p /var/run/vpnclient

echo "Setup complete"