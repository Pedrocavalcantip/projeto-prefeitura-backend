const { Router } = require('express');
const verificarToken = require('../middlewares/authMiddleware');
const doacoesController = require('../controllers/doacoes.controller.js');


const doacoesRouter = Router();

// Rotas públicas
doacoesRouter.get('/', doacoesController.findAll);
doacoesRouter.get('/:id', doacoesController.findById);


// Rotas protegidas (aplicando middleware)
doacoesRouter.use(verificarToken);

doacoesRouter.post('/', doacoesController.create);
doacoesRouter.put('/:id', doacoesController.update);
doacoesRouter.delete('/:id', doacoesController.deleteDoacao);


module.exports = doacoesRouter;