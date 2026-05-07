require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./src/routes/authRoutes');
const vsRoutes = require('./src/routes/vsRoutes');
const { authenticate } = require('./src/middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

// Rotas de health check (pública)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (públicas)
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/vs', vsRoutes);

// Error handler global
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`LDAP URL: ${process.env.LDAP_URL}`);
});