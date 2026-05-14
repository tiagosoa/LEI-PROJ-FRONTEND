const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Rotas públicas
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Rota protegida
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;