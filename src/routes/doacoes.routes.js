const express = require('express');
const router = express.Router();
const DoacoesController = require('../controllers/doacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas/privadas (com query parameter)
router.get('/', DoacoesController.findAll);

// Rotas públicas específicas (depois das rotas específicas)
router.get('/:id', DoacoesController.findById);

// Rotas protegidas
router.post('/', authMiddleware, DoacoesController.create);
router.put('/:id', authMiddleware, DoacoesController.update);
router.delete('/:id', authMiddleware, DoacoesController.deleteDoacao);

// Nova rota para atualizar status
router.patch('/:id/status', authMiddleware, DoacoesController.updateStatus);

module.exports = router;