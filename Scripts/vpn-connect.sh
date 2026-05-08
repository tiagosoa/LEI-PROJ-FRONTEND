#!/bin/bash
set -e

echo "=== Setting up SoftEther VPN Client ==="

VPN_DIR="/tmp/vpnclient"
VPN_SERVER="$1"
VPN_HUB="$2"
VPN_USER="$3"
VPN_PASSWORD="$4"

if [ ! -d "$VPN_DIR" ]; then
    echo "Downloading SoftEther VPN Client..."
    wget -q https://github.com/SoftEtherVPN/SoftEtherVPN_Stable/releases/download/v4.42-9798-rtm/softether-vpnclient-v4.42-9798-rtm-2023.06.30-linux-x64-64bit.tar.gz -O /tmp/vpnclient.tar.gz
    cd /tmp
    tar xzf vpnclient.tar.gz
    cd vpnclient
    make > /dev/null 2>&1
    echo "VPN Client compiled successfully"
fi

cd $VPN_DIR

./vpnclient stop 2>/dev/null || true

echo "Starting VPN client..."
./vpnclient start
sleep 2

echo "Creating VPN account..."
./vpncmd /CLIENT /CMD AccountDelete dei-vpn 2>/dev/null || true
./vpncmd /CLIENT /CMD AccountCreate dei-vpn /SERVER:$VPN_SERVER /HUB:$VPN_HUB /USERNAME:$VPN_USER

echo "Setting VPN password..."
./vpncmd /CLIENT /CMD AccountPasswordSet dei-vpn /PASSWORD:$VPN_PASSWORD /TYPE:standard

# Conectar
echo "Connecting to VPN..."
./vpncmd /CLIENT /CMD AccountConnect dei-vpn

sleep 10

echo "Checking VPN connection..."
./vpncmd /CLIENT /CMD AccountList

echo "VPN connection established!"