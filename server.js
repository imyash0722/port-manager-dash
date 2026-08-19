const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 80;

app.use(express.static('public'));
app.use(express.json());

// Allowed services
const services = [
    { id: 'suwayomi', name: 'Suwayomi Server', port: 4567, systemd: 'suwayomi-server' },
    { id: 'sshd', name: 'Secure Shell (SSH)', port: 22, systemd: 'sshd' },
    { id: 'tor', name: 'Tor Proxy Network', port: 9050, systemd: 'tor' }
];

app.get('/api/services', async (req, res) => {
    // get status for all services
    const promises = services.map(s => {
        return new Promise((resolve) => {
            exec(`systemctl is-active ${s.systemd}`, (error, stdout, stderr) => {
                let statusObj = {
                    ...s,
                    status: stdout.trim() === 'active' ? 'online' : 'offline'
                };
                
                // If it's suwayomi, check if Tor proxy is enabled in its config
                if (s.id === 'suwayomi') {
                    exec(`grep -q 'server.socksProxyEnabled = true' /var/lib/suwayomi/server.conf`, (grepErr) => {
                        statusObj.torProxyEnabled = !grepErr; // 0 exit code means true
                        resolve(statusObj);
                    });
                } else {
                    resolve(statusObj);
                }
            });
        });
    });
    Promise.all(promises).then(results => res.json(results));
});

app.post('/api/services/:id/toggle', (req, res) => {
    const service = services.find(s => s.id === req.params.id);
    if (!service) return res.status(404).send('Not found');

    const action = req.body.action; // 'start' or 'stop'
    if (action !== 'start' && action !== 'stop') return res.status(400).send('Invalid action');

    // Run systemctl command
    exec(`systemctl ${action} ${service.systemd}`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, error: stderr || stdout });
        }
        res.json({ success: true });
    });
});

app.post('/api/suwayomi/tor', (req, res) => {
    const enable = req.body.enable; // true or false
    const search = enable ? 'server.socksProxyEnabled = false' : 'server.socksProxyEnabled = true';
    const replace = enable ? 'server.socksProxyEnabled = true' : 'server.socksProxyEnabled = false';
    
    // Replace the config value and restart the service
    exec(`sed -i 's/${search}/${replace}/' /var/lib/suwayomi/server.conf && systemctl restart suwayomi-server`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, error: stderr || stdout });
        }
        res.json({ success: true });
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Dashboard listening on port ${port}`);
});
