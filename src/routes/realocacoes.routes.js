const express = require('express');
const router = express.Router();
const realocacoesController = require('../controllers/realocacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// get das relocacoes
router.get('/catalogo', authMiddleware, realocacoesController.findCatalogo);
router.get('/catalogo/:id', authMiddleware, realocacoesController.findCatalogoById);
router.get('/minhas-relocacoes', authMiddleware, realocacoesController.findMinhasRealocacoes);

// POST /realocacoes - Criar nova realocação
router.post('/', authMiddleware, realocacoesController.create);

// PUT /realocacoes/:id - Atualizar realocação
router.put('/:id', authMiddleware, realocacoesController.update);

// PATCH /realocacoes/:id/status - Atualizar status da realocação
router.patch('/:id/status', authMiddleware, realocacoesController.updateStatus);

// DELETE /realocacoes/:id - Deletar realocação
router.delete('/:id', authMiddleware, realocacoesController.deleteRealocacao);

module.exports = router;