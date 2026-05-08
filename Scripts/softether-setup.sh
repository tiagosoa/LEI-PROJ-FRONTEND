#!/bin/bash

set -e

echo "========================================="
echo "Setting up SoftEther VPN Client"
echo "========================================="


SOFTETHER_VERSION="v4.42-9798-rtm"
SOFTETHER_URL="https://github.com/SoftEtherVPN/SoftEtherVPN_Stable/releases/download/${SOFTETHER_VERSION}/softether-vpnclient-${SOFTETHER_VERSION}-2023.06.30-linux-x64-64bit.tar.gz"

cd /tmp
wget -q "$SOFTETHER_URL" -O softether.tar.gz
tar -xzf softether.tar.gz
cd softether-vpnclient-*/


echo "yes" | make > /dev/null 2>&1

# Install
sudo make install > /dev/null 2>&1

# Create configuration directory
sudo mkdir -p /usr/local/vpnclient

echo "✅ SoftEther VPN Client installed"

# Return to original directory
cd -