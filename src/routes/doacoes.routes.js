const { Router } = require('express');

// Importa o nosso controller, que já tem todas as funções prontas
const doacoesController = require('../controllers/doacoes.controller.js');

const doacoesRouter = Router();

// --- MAPEAMENTO DAS ROTAS ---

// Quando uma requisição GET chegar em '/doacoes', chame a função findAll do controller.
doacoesRouter.get('/', doacoesController.findAll);

// Quando uma requisição GET chegar em '/doacoes/1' (ou outro id), chame a função findById.
doacoesRouter.get('/:id', doacoesController.findById);

// Quando uma requisição POST chegar em '/doacoes', chame a função create.
doacoesRouter.post('/', doacoesController.create);

// Quando uma requisição PUT chegar em '/doacoes/1', chame a função update.
doacoesRouter.put('/:id', doacoesController.update);

// Quando uma requisição DELETE chegar em '/doacoes/1', chame a função deleteDoacao.
doacoesRouter.delete('/:id', doacoesController.deleteDoacao);


module.exports = doacoesRouter;