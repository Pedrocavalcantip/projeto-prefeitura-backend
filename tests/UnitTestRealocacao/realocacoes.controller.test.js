const request = require('supertest');
const express = require('express');

// MOCK do middleware de autenticação (antes de tudo)
jest.mock('../../src/middlewares/authMiddleware', () => (req, res, next) => {
  req.id_ong = 42; // sempre autentica e seta id_ong = 42
  next();
});

// Demais mocks
jest.mock('../../src/services/realocacoes.service', () => ({
  findCatalogoService: jest.fn(),
  findCatalogoByIdService: jest.fn(),
  findMinhasRealocacoesAtivasService: jest.fn(),
  findMinhasRealocacoesFinalizadasService: jest.fn(),
  createRealocacaoService: jest.fn(),
  updateRealocacaoService: jest.fn(),
  updateStatusRealocacaoService: jest.fn(),
  finalizarRealocacoesAntigas: jest.fn(),
  deleteRealocacaoService: jest.fn(),
  limparRealocacoesExpiradas: jest.fn()
}));
jest.mock('../../src/services/validacao.service', () => ({
  validarDadosRealocacao: jest.fn(() => ({ valido: true }))
}));
jest.mock('../../src/services/doacoes.service');
jest.mock('../../src/utils/tokenUtils', () => ({
  validateToken: jest.fn(() => ({ valid: true, decoded: { id_ong: 42 } }))
}));
jest.mock('../../src/utils/imageUtils', () => ({
  getImageData: jest.fn()
}));

// Requires DEVEM vir só depois dos mocks acima!
const realocacoesService = require('../../src/services/realocacoes.service');
const { validateToken } = require('../../src/utils/tokenUtils');
const { getImageData } = require('../../src/utils/imageUtils');
const realocacoesRouter = require('../../src/routes/realocacoes.routes');
const { validarDadosRealocacao } = require('../../src/services/validacao.service.js');

// Criação do app isolado só com o router de realocações
const app = express();
app.use(express.json());
app.use('/realocacoes', realocacoesRouter);

beforeEach(() => {
  jest.clearAllMocks();
  validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 42 } });
  getImageData.mockReturnValue(null);
});



describe('🗂️ Controller de Realocações', () => {
  describe('GET /realocacoes/catalogo', () => {
    it('→ 401 se não for ONG (sem token)', async () => {
      validateToken.mockReturnValue({ valid: false, error: 'Token não fornecido' });
      const res = await request(app).get('/realocacoes/catalogo');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token não fornecido' });
    });

    it('→ 200 e retorna lista de realocações', async () => {
      realocacoesService.findCatalogoService.mockResolvedValue([{ id_produto: 1 }]);
      const res = await request(app)
        .get('/realocacoes/catalogo')
        .set('Authorization', 'Bearer valido');
      expect(realocacoesService.findCatalogoService).toHaveBeenCalledWith({ titulo: undefined, tipo_item: undefined });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id_produto: 1 }]);
    });

    it('→ 500 em erro interno', async () => {
      realocacoesService.findCatalogoService.mockRejectedValue(new Error('erro DB'));
      const res = await request(app)
        .get('/realocacoes/catalogo')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'erro DB' });
    });
  });

  describe('GET /realocacoes/catalogo/:id', () => {
    it('→ 401 se token inválido', async () => {
      validateToken.mockReturnValue({ valid: false, error: 'Token não fornecido' });
      const res = await request(app).get('/realocacoes/catalogo/5');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token não fornecido' });
    });

    it('→ 400 se id inválido', async () => {
      const res = await request(app)
        .get('/realocacoes/catalogo/abc')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'ID deve ser um número válido maior que zero.' });
    });

    it('→ 200 e retorna realocação', async () => {
      realocacoesService.findCatalogoByIdService.mockResolvedValue({ id_produto: 5 });
      const res = await request(app)
        .get('/realocacoes/catalogo/5')
        .set('Authorization', 'Bearer valido');
      expect(realocacoesService.findCatalogoByIdService).toHaveBeenCalledWith('5');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id_produto: 5 });
    });

    it('→ 404 se não encontrada', async () => {
      realocacoesService.findCatalogoByIdService.mockRejectedValue(new Error('não encontrada'));
      const res = await request(app)
        .get('/realocacoes/catalogo/5')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'não encontrada' });
    });
  });

  describe('GET /realocacoes/minhas/ativas', () => {
    it('→ 200 e retorna apenas ativas', async () => {
      realocacoesService.findMinhasRealocacoesAtivasService.mockResolvedValue([{ id_produto: 10 }]);
      const res = await request(app)
        .get('/realocacoes/minhas/ativas')
        .set('Authorization', 'Bearer valido');
      expect(realocacoesService.findMinhasRealocacoesAtivasService).toHaveBeenCalledWith(42);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id_produto: 10 }]);
    });

    it('→ 500 em erro interno', async () => {
      realocacoesService.findMinhasRealocacoesAtivasService.mockRejectedValue(new Error());
      const res = await request(app)
        .get('/realocacoes/minhas/ativas')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao listar realocações ativas.' });
    });
  });

  describe('GET /realocacoes/minhas/finalizadas', () => {
    it('→ 200 e retorna apenas finalizadas', async () => {
      realocacoesService.findMinhasRealocacoesFinalizadasService.mockResolvedValue([{ id_produto: 11 }]);
      const res = await request(app)
        .get('/realocacoes/minhas/finalizadas')
        .set('Authorization', 'Bearer valido');
      expect(realocacoesService.findMinhasRealocacoesFinalizadasService).toHaveBeenCalledWith(42);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ id_produto: 11 }]);
    });

    it('→ 500 em erro interno', async () => {
      realocacoesService.findMinhasRealocacoesFinalizadasService.mockRejectedValue(new Error());
      const res = await request(app)
        .get('/realocacoes/minhas/finalizadas')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao listar realocações finalizadas.' });
    });
  });

  describe('POST /realocacoes', () => {
    const payload = {
      titulo: 'T', descricao: 'D', tipo_item: 'X',
      quantidade: 2, whatsapp: '123', email: 'e'
    };

    it('→ 400 quando não vier imagem', async () => {
      getImageData.mockReturnValue(null);
      const res = await request(app)
        .post('/realocacoes')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    });

    it('→ 201 quando tudo OK', async () => {
      getImageData.mockReturnValue({ url: 'http://img.jpg' });
      realocacoesService.createRealocacaoService.mockResolvedValue({ id_produto: 20 });
      const res = await request(app)
        .post('/realocacoes')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(realocacoesService.createRealocacaoService)
        .toHaveBeenCalledWith(expect.objectContaining({ ...payload, url_imagem: 'http://img.jpg' }), 42);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id_produto: 20 });
    });

    it('→ 500 em erro interno', async () => {
      getImageData.mockReturnValue({ url: 'http://img.jpg' });
      realocacoesService.createRealocacaoService.mockRejectedValue(new Error());
      const res = await request(app)
        .post('/realocacoes')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao criar realocação.' });
    });
  });

  describe('PUT /realocacoes/:id', () => {
    const payload = { titulo:'T', descricao:'D', tipo_item:'X', quantidade:2, whatsapp:'123', email:'e' };

    it('→ 400 quando id inválido', async () => {
      const res = await request(app)
        .put('/realocacoes/abc')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'ID inválido.' });
    });

    it('→ 400 quando não vier imagem', async () => {
      getImageData.mockReturnValue(null);
      const res = await request(app)
        .put('/realocacoes/5')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    });

    it('→ 200 quando tudo OK', async () => {
      getImageData.mockReturnValue({ url: 'http://nova.jpg' });
      realocacoesService.updateRealocacaoService.mockResolvedValue({ id_produto:5 });
      const res = await request(app)
        .put('/realocacoes/5')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(realocacoesService.updateRealocacaoService)
        .toHaveBeenCalledWith(5, expect.objectContaining({ ...payload, url_imagem:'http://nova.jpg' }), 42);
      expect(res.status).toBe(200);
    });

    it('→ 404 quando não encontrada', async () => {
      getImageData.mockReturnValue({ url: 'u' });
      realocacoesService.updateRealocacaoService.mockRejectedValue(new Error('Realocação não encontrada'));
      const res = await request(app)
        .put('/realocacoes/5')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Realocação não encontrada' });
    });

    it('→ 403 quando sem permissão', async () => {
      getImageData.mockReturnValue({ url: 'u' });
      realocacoesService.updateRealocacaoService.mockRejectedValue(new Error('Você não tem permissão'));
      const res = await request(app)
        .put('/realocacoes/5')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Você não tem permissão' });
    });

    it('→ 500 em erro inesperado', async () => {
      getImageData.mockReturnValue({ url: 'u' });
      realocacoesService.updateRealocacaoService.mockRejectedValue(new Error('oops'));
      const res = await request(app)
        .put('/realocacoes/5')
        .set('Authorization', 'Bearer valido')
        .send(payload);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao atualizar realocação.' });
    });
  });

  describe('PATCH /realocacoes/:id/status', () => {
    it('→ 400 quando id inválido', async () => {
      const res = await request(app)
        .patch('/realocacoes/abc/status')
        .set('Authorization', 'Bearer valido')
        .send({ status: 'ATIVA' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'ID deve ser um número válido maior que zero.' });
    });

    it('→ 400 quando status inválido', async () => {
      const res = await request(app)
        .patch('/realocacoes/5/status')
        .set('Authorization', 'Bearer valido')
        .send({ status: 'X' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Status inválido. Use ATIVA ou FINALIZADA.' });
    });

    it('→ 200 quando OK', async () => {
      realocacoesService.updateStatusRealocacaoService.mockResolvedValue({ id_produto:5, status:'FINALIZADA' });
      const res = await request(app)
        .patch('/realocacoes/5/status')
        .set('Authorization', 'Bearer valido')
        .send({ status: 'FINALIZADA' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id_produto:5, status:'FINALIZADA' });
    });

    it('→ 404 quando não encontrada', async () => {
      realocacoesService.updateStatusRealocacaoService.mockRejectedValue(new Error('não encontrada'));
      const res = await request(app)
        .patch('/realocacoes/5/status')
        .set('Authorization', 'Bearer valido')
        .send({ status: 'FINALIZADA' });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'não encontrada' });
    });

    it('→ 403 quando sem permissão', async () => {
      realocacoesService.updateStatusRealocacaoService.mockRejectedValue(new Error('Você não tem permissão'));
      const res = await request(app)
        .patch('/realocacoes/5/status')
        .set('Authorization', 'Bearer valido')
        .send({ status: 'FINALIZADA' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Você não tem permissão' });
    });
  });

  describe('PATCH /realocacoes/expiradas', () => {
    it('→ 200 finaliza antigas', async () => {
      realocacoesService.finalizarRealocacoesAntigas.mockResolvedValue([7,8]);
      const res = await request(app)
        .patch('/realocacoes/expiradas')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Realocações antigas finalizadas com sucesso.',
        idsFinalizadas: [7,8]
      });
    });

    it('→ 500 em erro interno', async () => {
      realocacoesService.finalizarRealocacoesAntigas.mockRejectedValue(new Error());
      const res = await request(app)
        .patch('/realocacoes/expiradas')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao finalizar realocações antigas.' });
    });
  });

  describe('DELETE /realocacoes/:id', () => {
    it('→ 400 se id inválido', async () => {
      const res = await request(app)
        .delete('/realocacoes/abc')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'ID deve ser um número válido maior que zero.' });
    });

    it('→ 204 quando OK', async () => {
      realocacoesService.deleteRealocacaoService.mockResolvedValue();
      const res = await request(app)
        .delete('/realocacoes/5')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(204);
    });

    it('→ 404 quando não encontrada', async () => {
      realocacoesService.deleteRealocacaoService.mockRejectedValue(new Error('não encontrada'));
      const res = await request(app)
        .delete('/realocacoes/5')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'não encontrada' });
    });

    it('→ 403 quando sem permissão', async () => {
      realocacoesService.deleteRealocacaoService.mockRejectedValue(new Error('Você não tem permissão'));
      const res = await request(app)
        .delete('/realocacoes/5')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Você não tem permissão' });
    });
  });

  describe('DELETE /realocacoes/expiradas', () => {
    it('→ 200 limpa antigas', async () => {
      realocacoesService.limparRealocacoesExpiradas.mockResolvedValue({ totalExcluidas: 3 });
      const res = await request(app)
        .delete('/realocacoes/expiradas')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: 'Limpeza de realocações expiradas realizada com sucesso.',
        detalhes: { totalExcluidas: 3 }
      });
    });

    it('→ 500 em erro interno', async () => {
      realocacoesService.limparRealocacoesExpiradas.mockRejectedValue(new Error());
      const res = await request(app)
        .delete('/realocacoes/expiradas')
        .set('Authorization', 'Bearer valido');
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao limpar realocações expiradas.' });
    });
  });
});
