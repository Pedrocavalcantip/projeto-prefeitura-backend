const request = require('supertest');
const express = require('express');

// 1) Mocks
jest.mock('../../src/middlewares/authMiddleware', () => (req, res, next) => {
  // sempre permite e injeta id_ong = 1
  req.id_ong = 1;
  next();
});
jest.mock('../../src/services/doacoes.service');
jest.mock('../../src/utils/tokenUtils', () => ({
  validateToken: jest.fn(() => ({ valid: true, decoded: { id_ong: 1 } }))
}));
jest.mock('../../src/utils/imageUtils', () => ({
  getImageData: jest.fn()
}));

// 2) Imports (depois dos mocks)
const doacoesService    = require('../../src/services/doacoes.service');
const { validateToken } = require('../../src/utils/tokenUtils');
const { getImageData }  = require('../../src/utils/imageUtils');
const doacoesRouter     = require('../../src/routes/doacoes.routes');

// 3) Monta o app só com o router de doações
const app = express();
app.use(express.json());
app.use('/doacoes', doacoesRouter);

describe('🗂️  Controller de Doações', () => {
  const payload = {
    titulo:       'Título X',
    descricao:    'Descrição Y',
    tipo_item:    'Alimento',
    whatsapp:     '11999999999',
    email:        'a@b.com',
    dias_validade:'5',
    quantidade:   '2'
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /doacoes', () => {
    it('→ 401 quando token ausente ou inválido', async () => {
      validateToken.mockReturnValue({ valid: false, error: 'Token inválido' });
      const res = await request(app)
        .post('/doacoes')
        .send(payload);
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ message: 'Token inválido' });
    });

    it('→ 400 quando não vier imagem', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      getImageData.mockReturnValue(null);
      const res = await request(app)
        .post('/doacoes')
        .set('Authorization','Bearer qualquer')
        .send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.'
      });
      expect(doacoesService.createDoacaoService).not.toHaveBeenCalled();
    });

    it('→ 201 quando tudo OK (URL via getImageData)', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 42 } });
      getImageData.mockReturnValue({ url: 'http://img.jpg' });
      doacoesService.createDoacaoService.mockResolvedValue({ id_produto: 123 });

      const res = await request(app)
        .post('/doacoes')
        .set('Authorization','Bearer valido')
        .send({ ...payload, url_imagem: 'será ignorado' });

      expect(res.statusCode).toBe(201);
      expect(doacoesService.createDoacaoService).toHaveBeenCalledWith(
        expect.objectContaining({
          ...payload,
          url_imagem: 'http://img.jpg'
        }),
        42
      );
      expect(res.body).toEqual({ id_produto: 123 });
    });

    it ('→ 500 se o service falhar internamente', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      getImageData.mockReturnValue({ url: 'http://img.jpg' });
      doacoesService.createDoacaoService.mockRejectedValue(new Error('Erro X'));
      const res = await request(app)
        .post('/doacoes')
        .set('Authorization','Bearer valido')
        .send(payload);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao criar doação.' });
    });
  });

  describe('PUT /doacoes/:id', () => {
    it('→ 401 quando token ausente ou inválido', async () => {
      validateToken.mockReturnValue({ valid: false, error: 'Token inválido' });
      const res = await request(app)
        .put('/doacoes/5')
        .send(payload);
      expect(res.statusCode).toBe(401);
    });

    it('→ 400 quando id inválido', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      const res = await request(app)
        .put('/doacoes/abc')
        .send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ message: 'ID deve ser um número válido maior que zero.' });
    });

    it('→ 400 quando status está FINALIZADA', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      // simula findById retornando status FINALIZADA
      doacoesService.findByIdDoacaoService = jest.fn().mockResolvedValue({ status: 'FINALIZADA' });
      const res = await request(app)
        .put('/doacoes/5')
        .set('Authorization','Bearer valido')
        .send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ message: 'Doação FINALIZADA não pode ser modificada.' });
    });

    it('→ 400 quando não vier imagem', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      doacoesService.findByIdDoacaoService = jest.fn().mockResolvedValue({ status: 'ATIVA' });
      getImageData.mockReturnValue(null);
      const res = await request(app)
        .put('/doacoes/5')
        .set('Authorization','Bearer valido')
        .send(payload);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({
        message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.'
      });
      expect(doacoesService.updateDoacaoService).not.toHaveBeenCalled();
    });

    it('→ 200 quando tudo OK', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 7 } });
      doacoesService.findByIdDoacaoService = jest.fn().mockResolvedValue({ status: 'ATIVA' });
      getImageData.mockReturnValue({ url: 'http://nova.jpg' });
      doacoesService.updateDoacaoService.mockResolvedValue({ sucesso: true });

      const res = await request(app)
        .put('/doacoes/5')
        .set('Authorization','Bearer valido')
        .send(payload);

      expect(res.statusCode).toBe(200);
      expect(doacoesService.updateDoacaoService).toHaveBeenCalledWith(
        5,
        expect.objectContaining({ ...payload, url_imagem: 'http://nova.jpg' }),
        7
      );
      expect(res.body).toEqual({ sucesso: true });
    });

    it('→ 404 quando service lança not found', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      doacoesService.findByIdDoacaoService = jest.fn().mockResolvedValue({ status: 'ATIVA' });
      getImageData.mockReturnValue({ url: 'x' });
      doacoesService.updateDoacaoService.mockRejectedValue(new Error('Doação não encontrada'));
      const res = await request(app)
        .put('/doacoes/5')
        .set('Authorization','Bearer valido')
        .send(payload);
      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ message: 'Doação não encontrada' });
    });

    it('→ 403 quando service lança permissão', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      doacoesService.findByIdDoacaoService = jest.fn().mockResolvedValue({ status: 'ATIVA' });
      getImageData.mockReturnValue({ url: 'x' });
      doacoesService.updateDoacaoService.mockRejectedValue(new Error('Você não tem permissão'));
      const res = await request(app)
        .put('/doacoes/5')
        .set('Authorization','Bearer valido')
        .send(payload);
      expect(res.statusCode).toBe(403);
      expect(res.body).toEqual({ message: 'Você não tem permissão' });
    });

    it('→ 500 em erro inesperado', async () => {
      validateToken.mockReturnValue({ valid: true, decoded: { id_ong: 1 } });
      doacoesService.findByIdDoacaoService = jest.fn().mockResolvedValue({ status: 'ATIVA' });
      getImageData.mockReturnValue({ url: 'x' });
      doacoesService.updateDoacaoService.mockRejectedValue(new Error('Erro qualquer'));
      const res = await request(app)
        .put('/doacoes/5')
        .set('Authorization','Bearer valido')
        .send(payload);
      expect(res.statusCode).toBe(500);
      expect(res.body).toEqual({ message: 'Erro interno ao atualizar doação.' });
    });
  });
});
