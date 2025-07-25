const express = require('express');
const router = express.Router();
const realocacoesController = require('../controllers/realocacoes.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const upload            = require('../middlewares/upload.middleware');


// get das relocacoes
router.get('/catalogo', authMiddleware, realocacoesController.findCatalogo);
router.get('/catalogo/:id', authMiddleware, realocacoesController.findCatalogoById);
router.get('/minhas-relocacoes', authMiddleware, realocacoesController.findMinhasRealocacoes);

// POST /realocacoes - Criar nova realocação
router.post('/', authMiddleware, realocacoesController.create);

// PUT /realocacoes/:id - Atualizar realocação
router.put('/:id', authMiddleware, upload.single('foto'), realocacoesController.update);

// PATCH /realocacoes/:id/status - Atualizar status da realocação
router.patch('/:id/status', authMiddleware, upload.single('foto'), realocacoesController.updateStatus);

// DELETE /realocacoes/:id - Deletar realocação
router.delete('/:id', authMiddleware, realocacoesController.deleteRealocacao);

// ========================================
// ROTAS DE LIMPEZA / JOBS
// ========================================

// Finaliza todas as realocações ATIVAS com mais de 60 dias
// PATCH /realocacoes/expiradas
router.patch(
  '/expiradas',
  authMiddleware,
  realocacoesController.finalizarRealocacoesAntigas
);

// Exclui todas as realocações FINALIZADAS há mais de 6 meses
// DELETE /realocacoes/expiradas
router.delete(
  '/expiradas',
  authMiddleware,
  realocacoesController.limparRealocacoesExpiradas
);

module.exports = router;