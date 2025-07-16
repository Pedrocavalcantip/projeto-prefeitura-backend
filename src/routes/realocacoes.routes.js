const express = require('express');
const router = express.Router();
const controller = require('../controllers/realocacoes.controller');
const verificarToken = require('../middlewares/authMiddleware');

// Todas as rotas protegidas
router.get('/', verificarToken, controller.findAll);
router.get('/:id', verificarToken, controller.findById);
router.post('/', verificarToken, controller.create);
router.put('/:id', verificarToken, controller.update);
router.delete('/:id', verificarToken, controller.deleteRealocacao);

module.exports = router;
