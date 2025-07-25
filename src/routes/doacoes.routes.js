const express           = require('express');
const router            = express.Router();
const doacoesController = require('../controllers/doacoes.controller');
const authMiddleware    = require('../middlewares/authMiddleware');
const upload            = require('../middlewares/upload.middleware');

// ========================================
// ROTAS PÚBLICAS
// ========================================

// GET /doacoes - Marketplace público 
router.get('/', doacoesController.findAll);

// GET /doacoes/prestes-a-vencer - Doações que estão prestes a vencer
router.get('/prestes-a-vencer', doacoesController.findPrestesAVencer);

// GET /doacoes/:id - Buscar doação específica
router.get('/:id', doacoesController.findById);

// ========================================
// ROTAS PROTEGIDAS (precisam de token)
// ========================================

// GET  /doacoes/minha             - Buscar doações da ONG logada
router.get('/minha', authMiddleware, doacoesController.findMinhas);

// POST /doacoes                   - Criar nova doação (upload de foto)
router.post(
  '/', 
  authMiddleware,
  upload.single('foto'),        // <<— middleware de upload aqui
  doacoesController.create
);

// PUT  /doacoes/:id               - Atualizar doação (pode enviar nova foto)
router.put(
  '/:id', 
  authMiddleware,
  upload.single('foto'),        // <<— se houver foto nova, processa o upload
  doacoesController.update
);

// PATCH /doacoes/:id/status       - Atualizar status da doação
router.patch('/:id/status', authMiddleware, doacoesController.updateStatus);

// DELETE /doacoes/:id             - Deletar doação
router.delete('/:id', authMiddleware, doacoesController.deleteDoacao);


// cleanup

// Rota para limpeza em lote (bulk)
router.delete(
  '/doacoes/expiradas',
  validateToken,
  doacoesController.limparExpiradas
);

// Rota para finalizar expiradas individualmente
router.patch(
  '/doacoes/expiradas/status',
  validateToken,
  doacoesController.finalizarExpiradas
);

module.exports = router;
