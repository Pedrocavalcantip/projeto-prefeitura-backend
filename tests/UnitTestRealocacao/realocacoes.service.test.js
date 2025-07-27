// tests/UnitTestRealocacao/realocacoes.service.test.js
const {
  findCatalogoService,
  findCatalogoByIdService,
  findMinhasRealocacoesAtivasService,
  findMinhasRealocacoesFinalizadasService,
  createRealocacaoService,
  updateRealocacaoService,
  updateStatusRealocacaoService,
  finalizarRealocacoesAntigas,
  deleteRealocacaoService,
  limparRealocacoesExpiradas
} = require('../../src/services/realocacoes.service.js');

jest.mock('../../src/config/database.js', () => ({
  produtos: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  }
}));

jest.mock('../../src/services/validacao.service.js', () => ({
  validarRealocacao: jest.fn()
}));

const prisma = require('../../src/config/database.js');
const { validarRealocacao } = require('../../src/services/validacao.service.js');

describe('🔧 realocacoes.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findCatalogoService', () => {
    it('→ should call prisma.findMany with no filters', async () => {
      const fake = [{ id_produto: 1 }];
      prisma.produtos.findMany.mockResolvedValue(fake);
      const result = await findCatalogoService();
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ATIVA', finalidade: 'REALOCACAO' },
          orderBy: { criado_em: 'cresc' }
        })
      );
      expect(result).toBe(fake);
    });

    it('→ should apply titulo and tipo_item filters', async () => {
      const fake = [];
      prisma.produtos.findMany.mockResolvedValue(fake);
      await findCatalogoService({ titulo: 'foo', tipo_item: 'bar' });
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            titulo: expect.objectContaining({ contains: 'foo' }),
            tipo_item: expect.objectContaining({ contains: 'bar' })
          })
        })
      );
    });
  });

  describe('findCatalogoByIdService', () => {
    it('→ throws on invalid id', async () => {
      await expect(findCatalogoByIdService('abc')).rejects.toThrow(
        'ID deve ser um número válido maior que zero'
      );
    });

    it('→ throws when not found', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(findCatalogoByIdService('5')).rejects.toThrow('Realocação não encontrada');
    });

    it('→ returns produto when found', async () => {
      const prod = { id_produto: 5, titulo: 'T' };
      prisma.produtos.findUnique.mockResolvedValue(prod);
      const res = await findCatalogoByIdService('5');
      expect(prisma.produtos.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_produto: 5, status: 'ATIVA', finalidade: 'REALOCACAO' }
        })
      );
      expect(res).toEqual(prod);
    });
  });

  describe('findMinhasRealocacoesAtivasService', () => {
    it('→ calls prisma.findMany with ong_id and ATIVA', async () => {
      const fake = [{ id_produto: 10 }];
      prisma.produtos.findMany.mockResolvedValue(fake);
      const res = await findMinhasRealocacoesAtivasService(42);
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ong_id: 42, finalidade: 'REALOCACAO', status: 'ATIVA' },
          orderBy: { criado_em: 'desc' }
        })
      );
      expect(res).toBe(fake);
    });
  });

  describe('findMinhasRealocacoesFinalizadasService', () => {
    it('→ calls prisma.findMany with ong_id and FINALIZADA', async () => {
      const fake = [{ id_produto: 11 }];
      prisma.produtos.findMany.mockResolvedValue(fake);
      const res = await findMinhasRealocacoesFinalizadasService(24);
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ong_id: 24, finalidade: 'REALOCACAO', status: 'FINALIZADA' },
          orderBy: { finalizado_em: 'desc' }
        })
      );
      expect(res).toBe(fake);
    });
  });

  describe('createRealocacaoService', () => {
    it('→ validates and creates with default quantidade = 1', async () => {
      const input = { titulo:'T', descricao:'D', tipo_item:'X', url_imagem:'u', whatsapp:'w', email:'e' };
      prisma.produtos.create.mockResolvedValue({ id_produto:20 });
      const out = await createRealocacaoService(input, 99);
      expect(validarRealocacao).toHaveBeenCalledWith(input);
      expect(prisma.produtos.create).toHaveBeenCalledWith({
        data: {
          ...input,
          quantidade: 1,
          status: 'ATIVA',
          finalidade: 'REALOCACAO',
          ong_id: 99
        }
      });
      expect(out).toEqual({ id_produto:20 });
    });

    it('→ converts quantidade string to number', async () => {
      const input = { titulo:'T', descricao:'D', tipo_item:'X', url_imagem:'u', quantidade:'5', whatsapp:'w', email:'e' };
      prisma.produtos.create.mockResolvedValue({ id_produto:21 });
      await createRealocacaoService(input, 5);
      expect(prisma.produtos.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantidade: 5 })
        })
      );
    });
  });

  describe('updateRealocacaoService', () => {
    const payload = { titulo:'T2', descricao:'D2', tipo_item:'Y', url_imagem:'u2', quantidade:'7', whatsapp:'w2', email:'e2' };

    it('→ throws on invalid id', async () => {
      await expect(updateRealocacaoService('abc', {}, 1)).rejects.toThrow(
        'ID deve ser um número válido maior que zero'
      );
    });

    it('→ throws when not found', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(updateRealocacaoService('5', payload, 1)).rejects.toThrow('Realocação não encontrada');
    });

    it('→ throws on permission mismatch', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:5, ong_id: 2 });
      await expect(updateRealocacaoService('5', payload, 1)).rejects.toThrow(
        'Você não tem permissão para modificar esta realocação'
      );
    });

    it('→ updates when everything is ok', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:5, ong_id: 42 });
      prisma.produtos.update.mockResolvedValue({ id_produto:5, ...payload, quantidade:7 });
      const res = await updateRealocacaoService('5', payload, 42);
      expect(prisma.produtos.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_produto: 5 },
          data: expect.objectContaining({ quantidade: 7, titulo:'T2' })
        })
      );
      expect(res).toEqual(expect.objectContaining({ id_produto:5 }));
    });
  });

  describe('updateStatusRealocacaoService', () => {
    it('→ throws on invalid id', async () => {
      await expect(updateStatusRealocacaoService('x','ATIVA',42)).rejects.toThrow(
        'ID deve ser um número válido maior que zero'
      );
    });

    it('→ throws on invalid status', async () => {
      await expect(updateStatusRealocacaoService('5','X',42)).rejects.toThrow(
        'Status deve ser ATIVA ou FINALIZADA'
      );
    });

    it('→ throws when not found', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(updateStatusRealocacaoService('5','ATIVA',42)).rejects.toThrow(
        'Realocação não encontrada'
      );
    });

    it('→ throws on permission mismatch', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:5, ong_id: 2, status: 'ATIVA' });
      await expect(updateStatusRealocacaoService('5','FINALIZADA',42)).rejects.toThrow(
        'Você não tem permissão para modificar esta realocação'
      );
    });

    it('→ throws when reactivating a finalized item', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:5, ong_id: 42, status: 'FINALIZADA' });
      await expect(updateStatusRealocacaoService('5','ATIVA',42)).rejects.toThrow(
        'Não é permitido reativar uma realocação finalizada.'
      );
    });

    it('→ updates status when ok', async () => {
      const now = new Date();
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:5, ong_id: 42, status: 'ATIVA' });
      prisma.produtos.update.mockResolvedValue({ id_produto:5, status:'FINALIZADA', finalizado_em: now });
      const res = await updateStatusRealocacaoService('5','FINALIZADA',42);
      expect(prisma.produtos.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_produto: 5 },
          data: expect.objectContaining({ status: 'FINALIZADA', finalizado_em: expect.any(Date) })
        })
      );
      expect(res).toEqual({ id_produto:5, status:'FINALIZADA', finalizado_em: now });
    });
  });

  describe('finalizarRealocacoesAntigas', () => {
    it('→ calls updateMany with 60-day cutoff', async () => {
      prisma.produtos.updateMany.mockResolvedValue({ count: 2 });
      const res = await finalizarRealocacoesAntigas();
      expect(prisma.produtos.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ATIVA',
            finalidade: 'REALOCACAO',
            criado_em: { lt: expect.any(Date) }
          }),
          data: expect.objectContaining({ status:'FINALIZADA', finalizado_em: expect.any(Date) })
        })
      );
      expect(res).toEqual({ count: 2 });
    });
  });

  describe('deleteRealocacaoService', () => {
    it('→ throws on invalid id', async () => {
      await expect(deleteRealocacaoService('x',42)).rejects.toThrow(
        'ID deve ser um número válido maior que zero'
      );
    });

    it('→ throws when not found', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(deleteRealocacaoService('5',42)).rejects.toThrow('Realocação não encontrada');
    });

    it('→ throws on permission mismatch', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:5, ong_id: 9 });
      await expect(deleteRealocacaoService('5',42)).rejects.toThrow(
        'Você não tem permissão para deletar esta realocação'
      );
    });

    it('→ deletes when ok', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ id_produto:5, ong_id: 42 });
      prisma.produtos.delete.mockResolvedValue({ id_produto:5 });
      const res = await deleteRealocacaoService('5',42);
      expect(prisma.produtos.delete).toHaveBeenCalledWith({ where: { id_produto: 5 } });
      expect(res).toEqual({ id_produto:5 });
    });
  });

  describe('limparRealocacoesExpiradas', () => {
    it('→ deletes old records and returns count', async () => {
      prisma.produtos.deleteMany.mockResolvedValue({ count: 3 });
      const res = await limparRealocacoesExpiradas();
      expect(prisma.produtos.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            finalidade: 'REALOCACAO',
            status: 'FINALIZADA',
            finalizado_em: { lt: expect.any(Date) }
          })
        })
      );
      expect(res).toEqual({ totalExcluidas: 3 });
    });

    it('→ logs when log=true', async () => {
      console.log = jest.fn();
      prisma.produtos.deleteMany.mockResolvedValue({ count: 5 });
      await limparRealocacoesExpiradas(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🗑️ 5 realocações excluídas')
      );
    });
  });
});
