const express           = require('express');
const router            = express.Router();
const doacoesController = require('../controllers/doacoes.controller');
const authMiddleware    = require('../middlewares/authMiddleware');
const upload            = require('../middlewares/upload.middleware');

// ========================================
// ROTAS PÚBLICAS
// ========================================

// GET  /doacoes                   - Marketplace público 
router.get('/', doacoesController.findAll);

// GET  /doacoes/prestes-a-vencer  - Doações que estão prestes a vencer
router.get('/prestes-a-vencer', doacoesController.findPrestesAVencer);

// GET  /doacoes/:id               - Buscar doação específica
router.get('/:id', doacoesController.findById);

// ========================================
// ROTAS PROTEGIDAS (precisam de token)
// ========================================

// GET    /doacoes/minhas/ativas       - Doações ATIVAS da ONG
router.get('/minhas/ativas', authMiddleware, doacoesController.findMinhasAtivas);

// GET    /doacoes/minhas/finalizadas  - Doações FINALIZADAS da ONG
router.get('/minhas/finalizadas', authMiddleware, doacoesController.findMinhasFinalizadas);

// POST   /doacoes                     - Criar nova doação (upload de foto)
router.post(
  '/', 
  authMiddleware,
  upload.single('foto'),
  doacoesController.create
);

// PUT    /doacoes/:id                 - Atualizar doação (pode enviar nova foto)
router.put(
  '/:id', 
  authMiddleware,
  upload.single('foto'),
  doacoesController.update
);

// PATCH  /doacoes/:id/status          - Atualizar status da doação
router.patch('/:id/status', authMiddleware, doacoesController.updateStatus);

// DELETE /doacoes/:id                 - Deletar doação
router.delete('/:id', authMiddleware, doacoesController.deleteDoacao);

// ========================================
// ROTAS DE LIMPEZA (jobs via HTTP)
// ========================================

// PATCH  /doacoes/expiradas           - Finaliza em massa as expiradas
router.patch('/expiradas', authMiddleware, doacoesController.finalizarExpiradas);

// DELETE /doacoes/expiradas           - Exclui expiradas há +6 meses
router.delete('/expiradas', authMiddleware, doacoesController.limparExpiradas);

module.exports = router;
