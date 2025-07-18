const express = require('express');
const router = express.Router();
const doacoesController = require('../controllers/doacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// ========================================
// ROTAS PÚBLICAS/PRIVADAS
// ========================================

// GET /doacoes - Marketplace público OU doações da ONG (com ?minha=true)
router.get('/', doacoesController.findAll);

// GET /doacoes/:id - Buscar doação específica
router.get('/:id', doacoesController.findById);

// ========================================
// ROTAS PROTEGIDAS
// ========================================

// POST /doacoes - Criar nova doação
router.post('/', authMiddleware, doacoesController.create);

// PUT /doacoes/:id - Atualizar doação
router.put('/:id', authMiddleware, doacoesController.update);

// PATCH /doacoes/:id/status - Atualizar status da doação
router.patch('/:id/status', authMiddleware, doacoesController.updateStatus);

// DELETE /doacoes/:id - Deletar doação
router.delete('/:id', authMiddleware, doacoesController.deleteDoacao);

module.exports = router;