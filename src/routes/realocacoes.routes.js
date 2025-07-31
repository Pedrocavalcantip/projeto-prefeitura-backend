const express = require('express');
const router = express.Router();
const realocacoesController = require('../controllers/realocacoes.controller.js');
const authMiddleware = require('../middlewares/authMiddleware.js');
const upload            = require('../middlewares/upload.middleware.js');
const validateIdParam = require('../middlewares/parseNumbers.middleware.js');

// get das relocacoes
router.get('/catalogo', authMiddleware, realocacoesController.findCatalogo);
router.get('/catalogo/:id', authMiddleware, validateIdParam('id'), realocacoesController.findCatalogoById);
router.get('/minhas/ativas',      authMiddleware, realocacoesController.findMinhasAtivas);
router.get('/minhas/finalizadas', authMiddleware, realocacoesController.findMinhasFinalizadas);


// POST /realocacoes - Criar nova realocação
router.post('/', authMiddleware, upload.single('foto'),  realocacoesController.create);

// PUT /realocacoes/:id - Atualizar realocação
router.put('/:id', validateIdParam('id'), authMiddleware, upload.single('foto'), realocacoesController.update);

// PATCH /realocacoes/:id/status - Atualizar status da realocação
router.patch('/:id/status', validateIdParam('id'), authMiddleware, realocacoesController.updateStatus);

// Exclui todas as realocações FINALIZADAS há mais de 6 meses
// DELETE /realocacoes/expiradas
router.delete(
  '/expiradas',
  authMiddleware,
  realocacoesController.limparRealocacoesExpiradas
);

// DELETE /realocacoes/:id - Deletar realocação
router.delete('/:id', validateIdParam('id'), authMiddleware, realocacoesController.deleteRealocacao);

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



module.exports = router;