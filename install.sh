#!/bin/bash
set -e

echo "======================================"
echo "  Port Manager Dash - Installer"
echo "======================================"

if [[ $EUID -eq 0 ]]; then
   echo "This script must NOT be run as root. Run it as your normal user, it will prompt for sudo when needed." 
   exit 1
fi

echo ""
echo "[1/4] Configuring the zsh CLI alias..."
sudo mkdir -p /usr/local/bin
sudo cp cli/server-manager /usr/local/bin/server-manager
sudo chmod +x /usr/local/bin/server-manager
echo "  -> 'server-manager' CLI command installed globally."

echo ""
echo "[2/4] Setting up Port Manager dependencies..."
npm install

echo ""
echo "[3/4] Installing Optional Services"

# Tailscale
read -p "? Install Tailscale VPN? (y/n): " resp
if [[ "$resp" == [yY] ]]; then
    sudo pacman -S --needed --noconfirm tailscale
    sudo systemctl enable --now tailscaled
    echo "  -> Please log into Tailscale:"
    sudo tailscale up
fi

# SSH
read -p "? Install OpenSSH Server (sshd)? (y/n): " resp
if [[ "$resp" == [yY] ]]; then
    sudo pacman -S --needed --noconfirm openssh
    sudo systemctl enable --now sshd
fi

# Tor
read -p "? Install Tor Proxy? (y/n): " resp
if [[ "$resp" == [yY] ]]; then
    sudo pacman -S --needed --noconfirm tor
    sudo systemctl disable --now tor
    # Ensure localhost can connect to SOCKS
    sudo sed -i '/SocksPolicy accept 127.0.0.0\/8/d' /etc/tor/torrc || true
    echo "SocksPolicy accept 127.0.0.0/8" | sudo tee -a /etc/tor/torrc >/dev/null
    echo "SocksPolicy reject *" | sudo tee -a /etc/tor/torrc >/dev/null
fi

# Suwayomi
read -p "? Install Suwayomi Server (Manga)? (y/n): " resp
if [[ "$resp" == [yY] ]]; then
    if command -v paru &> /dev/null; then
        paru -S --needed --noconfirm suwayomi-server
    elif command -v yay &> /dev/null; then
        yay -S --needed --noconfirm suwayomi-server
    else
        echo "  -> Error: Neither paru nor yay found! Please install suwayomi-server manually."
    fi
    sudo systemctl enable suwayomi-server
    
    # Tie Tor to Suwayomi
    sudo mkdir -p /etc/systemd/system/suwayomi-server.service.d
    echo -e "[Unit]\nWants=tor.service\nAfter=tor.service" | sudo tee /etc/systemd/system/suwayomi-server.service.d/override.conf >/dev/null
    sudo systemctl daemon-reload
fi

# Terminus (Termius)
read -p "? Install Desktop version of Terminus (Termius SSH Client)? (y/n): " resp
if [[ "$resp" == [yY] ]]; then
    if command -v paru &> /dev/null; then
        paru -S --needed --noconfirm termius
    else
        echo "  -> Error: paru not found! Please install termius manually via AUR."
    fi
fi

echo ""
echo "[4/4] Setting up port-manager-dash.service"
CURRENT_DIR=$(pwd)
sudo cp port-manager-dash.service /etc/systemd/system/
sudo sed -i "s|WorkingDirectory=.*|WorkingDirectory=$CURRENT_DIR|g" /etc/systemd/system/port-manager-dash.service
sudo systemctl daemon-reload
sudo systemctl enable --now port-manager-dash.service

echo ""
echo "======================================"
echo " Installation Complete!"
echo " The dashboard is now running on port 80."
echo " Use 'server-manager' in your terminal anytime."
echo "======================================"
