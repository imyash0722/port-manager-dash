# Port Manager Dashboard

A lightweight, premium web dashboard built with Node.js and Express to seamlessly manage `systemd` services and monitor their active ports. Designed to work beautifully over a private Tailscale network for secure remote homelab access.

## ✨ Features

- **Live Service Management:** Start, stop, and monitor the real-time status of your Linux systemd services directly from your web browser.
- **Port Mapping:** explicitly map your services to their respective ports (e.g., Port 4567 for Suwayomi, Port 9050 for Tor) so you always know where things are running.
- **Premium UI:** A completely bespoke, dark-mode dashboard built with pure CSS and responsive Flexbox. No heavy frameworks, no bloated libraries.
- **Lightweight Backend:** Powered by a tiny Node.js/Express server that securely interfaces with your system's `systemctl` commands.

## 🚀 Setup Guide

### 1. Prerequisites
- Linux OS with `systemd`
- [Node.js](https://nodejs.org/) installed
- (Optional but recommended) [Tailscale](https://tailscale.com/) for secure remote access.

### 2. Installation

Clone the repository and install the dependencies:
```bash
git clone https://github.com/imyash0722/port-manager-dash.git
cd port-manager-dash
npm install
```

### 3. Configuration

Open `server.js` and modify the `services` array to include the specific `systemd` services and ports you want to track:

```javascript
const services = [
    { id: 'suwayomi', name: 'Suwayomi Server', port: 4567, systemd: 'suwayomi-server' },
    { id: 'sshd', name: 'Secure Shell (SSH)', port: 22, systemd: 'sshd' },
    { id: 'tor', name: 'Tor Proxy Network', port: 9050, systemd: 'tor' }
];
```

### 4. Running as a System Service (Port 80)

To allow the dashboard to start and stop other system services, and to host it on the default web port (80), it must be run as `root` via its own systemd service.

Copy the provided service file to your systemd directory and enable it:

```bash
sudo cp port-manager-dash.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now port-manager-dash
```

## 💻 Usage

Once the service is running, simply open your web browser and navigate to your machine's IP address (or Tailscale IP):
`http://localhost` or `http://<your-tailscale-ip>`

Click the **Start/Stop Service** buttons to instantly manage your configured services!

## 🤝 Credits

- **Author:** Custom built specifically for this homelab setup.
- **Inspiration:** The concept of managing `systemd` services via a web UI was heavily inspired by the excellent [systemd-dashboard by Phrendo](https://github.com/Phrendo/systemd-dashboard). While this Node.js project was written entirely from scratch to support explicit port-mapping and a custom UI, Phrendo's repository served as the initial conceptual inspiration!
