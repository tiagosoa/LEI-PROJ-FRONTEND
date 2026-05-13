const express = require('express');
const router = express.Router();
const vsController = require('../controllers/vsController');
const { authenticate } = require('../middleware/authMiddleware');

// Todas as rotas de VS requerem autenticação
router.use(authenticate);

router.get('/credit', vsController.getUserCredit);
router.post('/create', vsController.createVS);
router.get('/', vsController.getUserVSList);
router.get('/all', vsController.getAllVSList);
router.get('/:folderName', vsController.getVSDetails);

module.exports = router;