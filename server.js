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

app.get('/api/services', (req, res) => {
    // get status for all services
    const promises = services.map(s => {
        return new Promise((resolve) => {
            exec(`systemctl is-active ${s.systemd}`, (error, stdout, stderr) => {
                resolve({
                    ...s,
                    status: stdout.trim() === 'active' ? 'online' : 'offline'
                });
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

app.listen(port, '0.0.0.0', () => {
    console.log(`Dashboard listening on port ${port}`);
});
