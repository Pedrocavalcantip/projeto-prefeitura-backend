// tests/doacoes.service.test.js

const prisma = require('../../src/config/database');
jest.mock('../src/config/database', () => ({
  produtos: {
    findMany:    jest.fn(),
    findUnique:  jest.fn(),
    create:      jest.fn(),
    update:      jest.fn(),
    updateMany:  jest.fn(),
    deleteMany:  jest.fn(),
    delete:      jest.fn(),
  }
}));

const { validarDoacao } = require('../../src/services/validacao.service');
jest.mock('../src/services/validacao.service', () => ({
  validarDoacao: jest.fn(),
}));

const doacoesService = require('../../src/services/doacoes.service');

describe('doacoes.service', () => {
  beforeEach(() => {
    jest.resetAllMocks(); // limpa implementações e contagens de todos os mocks
  });

  describe('findAllDoacoesService', () => {
    it('deve chamar prisma.findMany sem filtros', async () => {
      prisma.produtos.findMany.mockResolvedValue([{ id_produto: 1 }]);
      const res = await doacoesService.findAllDoacoesService();
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status:'ATIVA', finalidade:'DOACAO' })
      }));
      expect(res).toEqual([{ id_produto: 1 }]);
    });

    it('deve aplicar filtros de titulo e tipo_item', async () => {
      prisma.produtos.findMany.mockResolvedValue([]);
      await doacoesService.findAllDoacoesService({ titulo:'X', tipo_item:'Y' });
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          titulo: expect.any(Object),
          tipo_item: expect.any(Object)
        })
      }));
    });
  });

  describe('findDoacoesPrestesAVencerService', () => {
    it('deve chamar prisma.findMany com prazo <= hoje+14d', async () => {
      prisma.produtos.findMany.mockResolvedValue([]);
      await doacoesService.findDoacoesPrestesAVencerService();
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          prazo_necessidade: expect.objectContaining({ lte: expect.any(Date) })
        })
      }));
    });
  });

  describe('findMinhasDoacoesAtivasService / findMinhasDoacoesFinalizadasService', () => {
    it('ativas: deve filtrar status ATIVA', async () => {
      prisma.produtos.findMany.mockResolvedValue([]);
      await doacoesService.findMinhasDoacoesAtivasService(5);
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ ong_id:5, status:'ATIVA' })
      }));
    });

    it('finalizadas: deve filtrar status FINALIZADA', async () => {
      prisma.produtos.findMany.mockResolvedValue([]);
      await doacoesService.findMinhasDoacoesFinalizadasService(5);
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ ong_id:5, status:'FINALIZADA' })
      }));
    });
  });

  describe('findByIdDoacaoService', () => {
    it('lança erro se id inválido', async () => {
      await expect(doacoesService.findByIdDoacaoService('abc'))
        .rejects
        .toThrow('ID deve ser um número válido');
    });

    it('lança erro se não encontrar', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(doacoesService.findByIdDoacaoService(1))
        .rejects
        .toThrow('Doação não encontrada');
    });

    it('retorna o produto se encontrado', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:1 });
      const p = await doacoesService.findByIdDoacaoService(1);
      expect(p).toEqual({ id_produto:1 });
    });
  });

  describe('createDoacaoService', () => {
    const baseData = {
      titulo:'T', descricao:'D', tipo_item:'X',
      url_imagem:'u', whatsapp:'12345', email:'a@b',
      dias_validade:'2', quantidade:'4', urgencia:'BAIXA'
    };

    it('chama validarDoacao e prisma.create com dados convertidos', async () => {
      validarDoacao.mockReturnValue();
      prisma.produtos.create.mockResolvedValue({ id_produto:1 });
      const out = await doacoesService.createDoacaoService(baseData, 10);

      expect(validarDoacao).toHaveBeenCalledWith(baseData);
      expect(prisma.produtos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          titulo:    'T',
          quantidade: expect.any(Number),
          urgencia:  'BAIXA',
          ong_id:    10,
          prazo_necessidade: expect.any(String)
        })
      });
      expect(out).toEqual({ id_produto:1 });
    });

    it('lança erro se validarDoacao falhar', async () => {
      validarDoacao.mockImplementation(() => { throw new Error('X'); });
      await expect(doacoesService.createDoacaoService({},1))
        .rejects
        .toThrow('X');
    });
  });

  describe('updateDoacaoService', () => {
    const data = {
      titulo:'T', descricao:'D', tipo_item:'X',
      dias_validade:'1', quantidade:'2',
      url_imagem:'u', whatsapp:'123', email:'e'
    };

    it('lança erro para id não numérico', async () => {
      await expect(doacoesService.updateDoacaoService('a', data,1))
        .rejects.toThrow('ID deve ser um número válido');
    });

    it('lança erro se não encontrar', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(doacoesService.updateDoacaoService(1,data,1))
        .rejects.toThrow('Doação não encontrada');
    });

    it('lança erro se ong_id diferente', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:1, ong_id:2 });
      await expect(doacoesService.updateDoacaoService(1,data,1))
        .rejects.toThrow('Você não tem permissão');
    });

    it('atualiza com sucesso', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:1, ong_id:1 });
      prisma.produtos.update.mockResolvedValue({ id_produto:1 });
      const ret = await doacoesService.updateDoacaoService(1,data,1);
      expect(prisma.produtos.update).toHaveBeenCalledWith(expect.objectContaining({
        where:{ id_produto:1 },
        data: expect.objectContaining({ titulo:'T', quantidade:2 })
      }));
      expect(ret).toEqual({ id_produto:1 });
    });
  });

  describe('updateStatusDoacaoService', () => {
    it('erro id inválido', async () => {
      await expect(doacoesService.updateStatusDoacaoService('a','ATIVA',1))
        .rejects.toThrow('ID deve ser um número válido');
    });

    it('erro status inválido', async () => {
      await expect(doacoesService.updateStatusDoacaoService(1,'X',1))
        .rejects.toThrow('Status inválido');
    });

    it('erro não encontrado', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(doacoesService.updateStatusDoacaoService(1,'ATIVA',1))
        .rejects.toThrow('Doação não encontrada');
    });

    it('erro de permissão', async () => {
      prisma.produtos.findUnique.mockResolvedValue({
        id_produto:1, ong_id:2, status:'ATIVA', finalidade:'DOACAO'
      });
      await expect(doacoesService.updateStatusDoacaoService(1,'FINALIZADA',1))
        .rejects.toThrow('Você não tem permissão');
    });

    it('erro status não ATIVA', async () => {
      prisma.produtos.findUnique.mockResolvedValue({
        id_produto:1, ong_id:1, status:'FINALIZADA', finalidade:'DOACAO'
      });
      await expect(doacoesService.updateStatusDoacaoService(1,'ATIVA',1))
        .rejects.toThrow('Só é possível atualizar');
    });

    it('sucesso finalização', async () => {
      prisma.produtos.findUnique.mockResolvedValue({
        id_produto:1, ong_id:1, status:'ATIVA', finalidade:'DOACAO'
      });
      prisma.produtos.update.mockResolvedValue({ id_produto:1 });
      const res = await doacoesService.updateStatusDoacaoService(1,'FINALIZADA',1);
      expect(prisma.produtos.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status:'FINALIZADA', finalizado_em: expect.any(Date) })
      }));
      expect(res).toEqual({ id_produto:1 });
    });
  });

  describe('deleteDoacaoService', () => {
    it('erro id inválido', async () => {
      await expect(doacoesService.deleteDoacaoService('a',1))
        .rejects.toThrow('ID deve ser um número válido');
    });

    it('erro não encontrado', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(doacoesService.deleteDoacaoService(1,1))
        .rejects.toThrow('Doação não encontrada');
    });

    it('erro permissão', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:1, ong_id:2 });
      await expect(doacoesService.deleteDoacaoService(1,1))
        .rejects.toThrow('Você não tem permissão');
    });

    it('deleta com sucesso', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:1, ong_id:1 });
      prisma.produtos.delete.mockResolvedValue({});
      await expect(doacoesService.deleteDoacaoService(1,1))
        .resolves.toEqual({});
      expect(prisma.produtos.delete).toHaveBeenCalledWith({ where:{ id_produto:1 } });
    });
  });

  describe('finalizarDoacoesVencidas', () => {
    it('finaliza e retorna ids', async () => {
      const expiradas = [
        { id_produto:1, ong_id:2 },
        { id_produto:3, ong_id:4 }
      ];
      prisma.produtos.findMany.mockResolvedValue(expiradas);

      const spy = jest
        .spyOn(doacoesService, 'updateStatusDoacaoService')
        .mockResolvedValue({});

      const ids = await doacoesService.finalizarDoacoesVencidas();
      expect(spy).toHaveBeenCalledTimes(2);
      expect(ids).toEqual([1, 3]);
    });
  });

  describe('limparDoacoesExpiradas', () => {
    it('exclui e retorna totalExcluidas', async () => {
      prisma.produtos.deleteMany.mockResolvedValue({ count:5 });
      const out = await doacoesService.limparDoacoesExpiradas();
      expect(out).toEqual({ totalExcluidas:5 });
    });
  });
});
