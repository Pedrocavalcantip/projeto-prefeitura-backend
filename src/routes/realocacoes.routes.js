const express = require('express');
const router = express.Router();
const realocacoesController = require('../controllers/realocacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// ========================================
// ROTAS PÚBLICAS (Marketplace de Realocações)
// ========================================

// GET /realocacoes - Listar todas as realocações disponíveis
router.get('/', realocacoesController.findAll);

// ========================================
// ROTAS PRIVADAS (Gestão de Realocações pela ONG)
// ========================================

// GET /realocacoes/minhas - Listar realocações da ONG logada (DEVE VIR ANTES DO /:id)
router.get('/minhas', authMiddleware, realocacoesController.findMy);

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