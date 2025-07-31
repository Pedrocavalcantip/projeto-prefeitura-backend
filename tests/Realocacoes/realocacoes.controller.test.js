// tests/unit/realocacoes.controller.test.js
const realocacoesController = require('../../src/controllers/realocacoes.controller.js');
const realocacoesService    = require('../../src/services/realocacoes.service.js');
const { validateToken }     = require('../../src/utils/tokenUtils.js');
const { getImageData }      = require('../../src/utils/imageUtils.js');

jest.mock('../../src/services/realocacoes.service.js');
jest.mock('../../src/utils/tokenUtils');
jest.mock('../../src/utils/imageUtils');

describe('Controllers de Realocações', () => {
  let req, res;

  beforeEach(() => {
    req = { headers: { authorization: 'token' }, params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json:   jest.fn().mockReturnThis(),
      send:   jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  // findCatalogo
  describe('findCatalogo', () => {
    it('401 quando token inválido', async () => {
      validateToken.mockReturnValue({ valid: false, error: 'no auth' });
      await realocacoesController.findCatalogo(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'no auth' });
    });

    it('200 retorna lista', async () => {
      validateToken.mockReturnValue({ valid: true });
      realocacoesService.findCatalogoService.mockResolvedValue([{ id:1 }]);
      req.query = { titulo: 'X', tipo_item: 'Y' };
      await realocacoesController.findCatalogo(req, res);
      expect(realocacoesService.findCatalogoService).toHaveBeenCalledWith({ titulo:'X', tipo_item:'Y' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ id:1 }]);
    });

    it('500 em erro interno', async () => {
      validateToken.mockReturnValue({ valid: true });
      realocacoesService.findCatalogoService.mockRejectedValue(new Error('fail'));
      await realocacoesController.findCatalogo(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message:'fail' });
    });
  });

  // findCatalogoById
  describe('findCatalogoById', () => {
    beforeEach(() => { validateToken.mockReturnValue({ valid: true }); });

    it('400 para id inválido', async () => {
      req.params.id = 'abc';
      await realocacoesController.findCatalogoById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'ID deve ser um número válido maior que zero.' });
    });

    it('404 quando não encontrada', async () => {
      req.params.id = '5';
      realocacoesService.findCatalogoByIdService.mockRejectedValue(new Error('não encontrada'));
      await realocacoesController.findCatalogoById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message:'não encontrada' });
    });

    it('200 retorna objeto', async () => {
      req.params.id = '5';
      realocacoesService.findCatalogoByIdService.mockResolvedValue({ id:5 });
      await realocacoesController.findCatalogoById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id:5 });
    });

    it('500 em erro genérico', async () => {
      req.params.id = '5';
      realocacoesService.findCatalogoByIdService.mockRejectedValue(new Error('timeout'));
      await realocacoesController.findCatalogoById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message:'timeout' });
    });
  });

  // findMinhasAtivas
  describe('findMinhasAtivas', () => {
    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid: false, error:'E' });
      await realocacoesController.findMinhasAtivas(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 retorna lista', async () => {
      validateToken.mockReturnValue({ valid:true, decoded:{ id_ong:1 }});
      realocacoesService.findMinhasRealocacoesAtivasService.mockResolvedValue([{}]);
      await realocacoesController.findMinhasAtivas(req, res);
      expect(realocacoesService.findMinhasRealocacoesAtivasService).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{}]);
    });

    it('500 em erro interno', async () => {
      validateToken.mockReturnValue({ valid:true, decoded:{ id_ong:1 }});
      realocacoesService.findMinhasRealocacoesAtivasService.mockRejectedValue(new Error('x'));
      await realocacoesController.findMinhasAtivas(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message:'Erro interno ao listar realocações ativas.' });
    });
  });

  // findMinhasFinalizadas
  describe('findMinhasFinalizadas', () => {
    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid:false, error:'E' });
      await realocacoesController.findMinhasFinalizadas(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 retorna lista', async () => {
      validateToken.mockReturnValue({ valid:true, decoded:{id_ong:2}});
      realocacoesService.findMinhasRealocacoesFinalizadasService.mockResolvedValue([{f:1}]);
      await realocacoesController.findMinhasFinalizadas(req, res);
      expect(realocacoesService.findMinhasRealocacoesFinalizadasService).toHaveBeenCalledWith(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{f:1}]);
    });

    it('500 em erro interno', async () => {
      validateToken.mockReturnValue({ valid:true, decoded:{id_ong:2}});
      realocacoesService.findMinhasRealocacoesFinalizadasService.mockRejectedValue(new Error());
      await realocacoesController.findMinhasFinalizadas(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message:'Erro interno ao listar realocações finalizadas.' });
    });
  });

  // create
  describe('create', () => {
    beforeEach(() => {
      validateToken.mockReturnValue({ valid:true, decoded:{id_ong:3}});
    });

    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid:false, error:'No' });
      await realocacoesController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('400 sem imagem', async () => {
      getImageData.mockReturnValue(null);
      await realocacoesController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message:'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    });

    it('201 cria com sucesso', async () => {
      getImageData.mockReturnValue({ url:'u' });
      realocacoesService.createRealocacaoService.mockResolvedValue({ id:10 });
      req.body = { foo:'bar' };
      await realocacoesController.create(req, res);
      expect(realocacoesService.createRealocacaoService).toHaveBeenCalledWith({ foo:'bar', url_imagem:'u' }, 3);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id:10 });
    });

    it('400 em erro de validação', async () => {
      getImageData.mockReturnValue({ url:'u' });
      realocacoesService.createRealocacaoService.mockRejectedValue({ status:400, message:'bad' });
      await realocacoesController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message:'bad' });
    });

    it('500 em erro interno', async () => {
      getImageData.mockReturnValue({ url:'u' });
      realocacoesService.createRealocacaoService.mockRejectedValue(new Error('Erro interno ao criar realocação.'));
      await realocacoesController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message:'Erro interno ao criar realocação.' });
    });
  });

  // update
  describe('update', () => {
    beforeEach(() => {
      validateToken.mockReturnValue({ valid:true, decoded:{id_ong:4}});
    });

    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid:false, error:'no' });
      await realocacoesController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 atualiza com imagem', async () => {
      getImageData.mockReturnValue({ url:'u2' });
      realocacoesService.updateRealocacaoService.mockResolvedValue({ ok:true });
      req.params.id = '7';
      req.body = { x:1 };
      await realocacoesController.update(req, res);
      expect(realocacoesService.updateRealocacaoService).toHaveBeenCalledWith('7', { x:1, url_imagem:'u2' }, 4);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('200 atualiza sem imagem', async () => {
      getImageData.mockReturnValue(null);
      realocacoesService.updateRealocacaoService.mockResolvedValue({ ok:true });
      req.params.id = '7';
      req.body = { y:2 };
      await realocacoesController.update(req, res);
      expect(realocacoesService.updateRealocacaoService).toHaveBeenCalledWith('7', { y:2 }, 4);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('400 em erro de validação', async () => {
      getImageData.mockReturnValue(null);
      realocacoesService.updateRealocacaoService.mockRejectedValue({ status:400, message:'bad upd' });
      req.params.id = '7'; req.body = {};
      await realocacoesController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message:'bad upd' });
    });

    it('500 em erro interno', async () => {
      getImageData.mockReturnValue(null);
      realocacoesService.updateRealocacaoService.mockRejectedValue(new Error('Erro ao atualizar realocação'));
      req.params.id = '7'; req.body = {};
      await realocacoesController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message:'Erro ao atualizar realocação' });
    });
  });

  // updateStatus
  describe('updateStatus', () => {
    beforeEach(() => validateToken.mockReturnValue({ valid:true, decoded:{id_ong:5}}));

    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid:false, error:'T' });
      await realocacoesController.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 finaliza com sucesso', async () => {
      realocacoesService.finalizarRealocacaoService.mockResolvedValue({ status:'F' });
      req.params.id='8';
      await realocacoesController.updateStatus(req, res);
      expect(realocacoesService.finalizarRealocacaoService).toHaveBeenCalledWith('8',5);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('400 em erro de validação', async () => {
      realocacoesService.finalizarRealocacaoService.mockRejectedValue({ status:400, message:'bad st' });
      req.params.id='8';
      await realocacoesController.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message:'bad st' });
    });

    it('500 em erro interno', async () => {
      realocacoesService.finalizarRealocacaoService.mockRejectedValue(new Error('Erro ao finalizar realocação'));
      req.params.id='8';
      await realocacoesController.updateStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message:'Erro ao finalizar realocação' });
    });
  });

  // deleteRealocacao
  describe('deleteRealocacao', () => {
    it('next quando id=expiradas', async () => {
      const next = jest.fn();
      req.params.id = 'expiradas';
      await realocacoesController.deleteRealocacao(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    beforeEach(() => validateToken.mockReturnValue({ valid:true, decoded:{id_ong:6}}));

    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid:false, error:'E' });
      req.params.id='9';
      await realocacoesController.deleteRealocacao(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('400 id inválido', async () => {
      req.params.id='0';
      await realocacoesController.deleteRealocacao(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('204 deleta com sucesso', async () => {
      realocacoesService.deleteRealocacaoService.mockResolvedValue();
      req.params.id='9';
      await realocacoesController.deleteRealocacao(req, res, jest.fn());
      expect(realocacoesService.deleteRealocacaoService).toHaveBeenCalledWith('9',6);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('404 não encontrado', async () => {
      realocacoesService.deleteRealocacaoService.mockRejectedValue(new Error('não encontrada'));
      req.params.id='9';
      await realocacoesController.deleteRealocacao(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('403 sem permissão', async () => {
      realocacoesService.deleteRealocacaoService.mockRejectedValue(new Error('permissão'));
      req.params.id='9';
      await realocacoesController.deleteRealocacao(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('500 erro genérico', async () => {
      realocacoesService.deleteRealocacaoService.mockRejectedValue(new Error('oops'));
      req.params.id='9';
      await realocacoesController.deleteRealocacao(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // finalizarRealocacoesAntigas
  describe('finalizarRealocacoesAntigas', () => {
    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid:false, error:'E' });
      await realocacoesController.finalizarRealocacoesAntigas(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 finaliza', async () => {
      validateToken.mockReturnValue({ valid:true });
      realocacoesService.finalizarRealocacoesAntigas.mockResolvedValue([1,2]);
      await realocacoesController.finalizarRealocacoesAntigas(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Realocações antigas finalizadas com sucesso.',
        idsFinalizadas: [1,2]
      });
    });

    it('500 erro interno', async () => {
      validateToken.mockReturnValue({ valid:true });
      realocacoesService.finalizarRealocacoesAntigas.mockRejectedValue(new Error());
      await realocacoesController.finalizarRealocacoesAntigas(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // limparRealocacoesExpiradas
  describe('limparRealocacoesExpiradas', () => {
    it('401 sem token', async () => {
      validateToken.mockReturnValue({ valid:false, error:'E' });
      await realocacoesController.limparRealocacoesExpiradas(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('200 limpa', async () => {
      validateToken.mockReturnValue({ valid:true });
      realocacoesService.limparRealocacoesExpiradas.mockResolvedValue({ total:3 });
      await realocacoesController.limparRealocacoesExpiradas(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Limpeza de realocações expiradas realizada com sucesso.',
        detalhes: { total:3 }
      });
    });

    it('500 erro interno', async () => {
      validateToken.mockReturnValue({ valid:true });
      realocacoesService.limparRealocacoesExpiradas.mockRejectedValue(new Error());
      await realocacoesController.limparRealocacoesExpiradas(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
