const express = require('express');
const router = express.Router();
const realocacoesController = require('../controllers/realocacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// ========================================
// ROTAS PÚBLICAS/PRIVADAS (Com Query Parameter)
// ========================================

// GET /realocacoes - Marketplace público OU realocações da ONG (com ?minha=true)
router.get('/', realocacoesController.findAll);

// ========================================
// ROTAS PÚBLICAS ESPECÍFICAS (depois das rotas específicas)
// ========================================

// GET /realocacoes/:id - Buscar realocação específica
router.get('/:id', realocacoesController.findById);

// POST /realocacoes - Criar nova realocação
router.post('/', authMiddleware, realocacoesController.create);

// PUT /realocacoes/:id - Atualizar realocação
router.put('/:id', authMiddleware, realocacoesController.update);

// PATCH /realocacoes/:id/status - Atualizar status da realocação
router.patch('/:id/status', authMiddleware, realocacoesController.updateStatus);

// DELETE /realocacoes/:id - Deletar realocação
router.delete('/:id', authMiddleware, realocacoesController.deleteRealocacao);

module.exports = router;