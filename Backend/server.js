require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./src/routes/authRoutes');
const vsRoutes = require('./src/routes/vsRoutes');
const vstRoutes = require('./src/routes/vstRoutes');

const app = express();
const PORT = process.env.PORT || 80;

const corsOptions = {
    origin: [
        'http://localhost:80',
        'http://127.0.0.1:80',
        'http://cloud.dei.isep.ipp.pt',
        'https://cloud.dei.isep.ipp.pt'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware global
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false  
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('combined'));

// Para debugging - log de todos os pedidos
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Rotas públicas
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/vs', vsRoutes);
app.use('/api/vst', vstRoutes);

// Rota de teste CORS (útil para debug)
app.options('/api/test', cors(corsOptions));
app.get('/api/test', (req, res) => {
    res.json({ message: 'CORS test successful' });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

const frontendPath = '/var/www/html';

if (fs.existsSync(frontendPath)) {
    console.log(`📁 Serving frontend from: ${frontendPath}`);
    app.use(express.static(frontendPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    console.log(`Frontend path not found: ${frontendPath}`);
    console.log('API only mode - frontend not being served');
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS enabled for: ${corsOptions.origin.join(', ')}`);
});