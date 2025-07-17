const express = require('express');
const router = express.Router();
const realocacoesController = require('../controllers/realocacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// ========================================
// ROTAS PÚBLICAS (Marketplace de Realocações)
// ========================================

// GET /realocacoes - Listar todas as realocações disponíveis
router.get('/', realocacoesController.findAll);

// GET /realocacoes/:id - Buscar realocação específica
router.get('/:id', realocacoesController.findById);

// ========================================
// ROTAS PRIVADAS (Gestão de Realocações pela ONG)
// ========================================

// GET /realocacoes/minhas - Listar realocações da ONG logada
router.get('/minhas/lista', authMiddleware, realocacoesController.findMy);

// POST /realocacoes - Criar nova realocação
router.post('/', authMiddleware, realocacoesController.create);

// PUT /realocacoes/:id - Atualizar realocação
router.put('/:id', authMiddleware, realocacoesController.update);

// PATCH /realocacoes/:id/status - Atualizar status da realocação
router.patch('/:id/status', authMiddleware, realocacoesController.updateStatus);

// DELETE /realocacoes/:id - Deletar realocação
router.delete('/:id', authMiddleware, realocacoesController.deleteRealocacao);

module.exports = router;