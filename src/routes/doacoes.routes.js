const express = require('express');
const router = express.Router();
const doacoesController = require('../controllers/doacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// ========================================
// ROTAS PÚBLICAS/PRIVADAS
// ========================================

// GET /doacoes - Marketplace público 
router.get('/', doacoesController.findAll);

// GET /doacoes/prestes-a-vencer - Doações que estão prestes a vencer
router.get('/doacoes/prestes-a-vencer', doacoesController.findPrestesAVencer);

// GET /doacoes/:id - Buscar doação específica
router.get('/:id', doacoesController.findById);

// ========================================
// ROTAS PROTEGIDAS
// ========================================
// GET /doacoes/minhas - Buscar doações da ONG logada
router.get('/doacoes/minha', authMiddleware, doacoesController.findMinhas);

// POST /doacoes - Criar nova doação
router.post('/', authMiddleware, doacoesController.create);

// PUT /doacoes/:id - Atualizar doação
router.put('/:id', authMiddleware, doacoesController.update);

// PATCH /doacoes/:id/status - Atualizar status da doação
router.patch('/:id/status', authMiddleware, doacoesController.updateStatus);

// DELETE /doacoes/:id - Deletar doação
router.delete('/:id', authMiddleware, doacoesController.deleteDoacao);

module.exports = router;