const express = require('express');
const router = express.Router();
const vstController = require('../controllers/vstController');
const { authenticate } = require('../middleware/authMiddleware');

// Todas as rotas de VST requerem autenticação
router.use(authenticate);

// Rotas
router.get('/all', vstController.getAllVSTs);
router.get('/', vstController.getAvailableVSTs);
router.get('/:folderName', vstController.getVSTDetails);

module.exports = router;