const express = require('express');
const router = express.Router();
const DoacoesController = require('../controllers/doacoes.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rotas públicas
router.get('/', DoacoesController.findAll);
router.get('/:id', DoacoesController.findById);

// Rotas protegidas
router.post('/', authMiddleware, DoacoesController.create);
router.put('/:id', authMiddleware, DoacoesController.update);
router.delete('/:id', authMiddleware, DoacoesController.deleteDoacao);

// Nova rota para atualizar status
router.patch('/:id/status', authMiddleware, DoacoesController.updateStatus);

module.exports = router;