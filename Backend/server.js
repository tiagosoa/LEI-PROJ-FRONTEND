require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./src/routes/authRoutes');
const vsRoutes = require('./src/routes/vsRoutes');
const vstRoutes = require('./src/routes/vstRoutes');

const app = express();
const HTTP_PORT = 80;
const HTTPS_PORT = 443;

// Caminhos dos certificados SSL
const sslOptions = {
    key: fs.readFileSync('/etc/letsencrypt/live/vs-ctl2.dei.isep.ipp.pt/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/vs-ctl2.dei.isep.ipp.pt/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/vs-ctl2.dei.isep.ipp.pt/chain.pem')
};

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
app.use(express.json());
app.use(morgan('combined'));

// Middleware para redirecionar HTTP para HTTPS
app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${req.secure ? 'HTTPS' : 'HTTP'}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vs', vsRoutes);
app.use('/api/vst', vstRoutes);

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Servir frontend
const frontendPath = '/var/www/html';
if (fs.existsSync(frontendPath)) {
    console.log(`Serving frontend from: ${frontendPath}`);
    app.use(express.static(frontendPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    console.log(`Frontend path not found: ${frontendPath}`);
}

// Servidor HTTPS
const httpsServer = https.createServer(sslOptions, app);
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

const httpApp = express();
httpApp.use((req, res) => {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
});
const httpServer = http.createServer(httpApp);
httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`HTTP Server running on port ${HTTP_PORT} - redirecting to HTTPS`);
});

console.log(`Backend API running on port ${HTTPS_PORT} (HTTPS)`);
console.log(`Frontend served via HTTPS`);