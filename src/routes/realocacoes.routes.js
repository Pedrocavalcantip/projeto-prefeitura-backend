const express = require('express');
const router = express.Router();
const RealocacoesController = require('../controllers/realocacoes.controller'); // Mudança 1: Nome mais específico
const authMiddleware = require('../middlewares/auth.middleware'); // Mudança 2: Padronizar nome

// Todas as rotas protegidas
router.get('/', authMiddleware, RealocacoesController.findAll);
router.get('/:id', authMiddleware, RealocacoesController.findById);
router.post('/', authMiddleware, RealocacoesController.create);
router.put('/:id', authMiddleware, RealocacoesController.update);
router.delete('/:id', authMiddleware, RealocacoesController.deleteRealocacao);

module.exports = router;