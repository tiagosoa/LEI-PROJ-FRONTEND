require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./src/routes/authRoutes');
const vsRoutes = require('./src/routes/vsRoutes');
const vstRoutes = require('./src/routes/vstRoutes');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use(express.json());
app.use(morgan('combined'));

// Log de pedidos
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Rotas públicas
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vs', vsRoutes);
app.use('/api/vst', vstRoutes);

// Error handler
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});