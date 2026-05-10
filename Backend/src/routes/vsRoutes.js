const express = require('express');
const router = express.Router();
const vsController = require('../controllers/vsController');
const { authenticate } = require('../middleware/authMiddleware');

// Todas as rotas de VS requerem autenticação
router.use(authenticate);

router.get('/', vsController.getUserVSList);
router.get('/all', vsController.getAllVSList);
router.get('/:folderName/details', vsController.getVSDetailsExtended);
router.get('/:folderName', vsController.getVSDetails);

module.exports = router;