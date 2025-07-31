

jest.mock('../../src/config/database.js', () => ({
  produtos: {
    findMany:   jest.fn(),
    findFirst:  jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    updateMany: jest.fn(),
    delete:     jest.fn(),
    deleteMany: jest.fn(),
  },
}));
jest.mock('../../src/services/validacao.service.js', () => ({
  validarRealocacao: jest.fn(),
}));

const prisma = require('../../src/config/database.js');
const { validarRealocacao } = require('../../src/services/validacao.service.js');
const service = require('../../src/services/realocacoes.service.js');

describe('realocacoes.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findCatalogoService', () => {
    it('deve retornar lista sem filtros', async () => {
      const fake = [{ id: 1 }, { id: 2 }];
      prisma.produtos.findMany.mockResolvedValue(fake);

      const ret = await service.findCatalogoService();
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: 'ATIVA',
          finalidade: 'REALOCACAO',
        }),
        orderBy: { criado_em: 'asc' }
      }));
      expect(ret).toBe(fake);
    });

    it('deve aplicar filtros de titulo e tipo_item', async () => {
      prisma.produtos.findMany.mockResolvedValue([]);
      await service.findCatalogoService({ titulo: 'x', tipo_item: 'y' });
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          titulo: { contains: 'x', mode: 'insensitive' },
          tipo_item: { contains: 'y', mode: 'insensitive' }
        })
      }));
    });
  });

  describe('findCatalogoByIdService', () => {
    it('deve retornar produto existente', async () => {
      const prod = { id_produto: 10, titulo: 'A' };
      prisma.produtos.findFirst.mockResolvedValue(prod);
      const ret = await service.findCatalogoByIdService(10);
      expect(prisma.produtos.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { id_produto: 10, status: 'ATIVA', finalidade: 'REALOCACAO' }
      }));
      expect(ret).toEqual(prod);
    });

    it('deve lançar 404 se não encontrar', async () => {
      prisma.produtos.findFirst.mockResolvedValue(null);
      await expect(service.findCatalogoByIdService(999))
        .rejects.toEqual({ status: 404, message: 'Realocação não encontrada' });
    });
  });

  describe('findMinhasRealocacoesAtivasService', () => {
    it('deve retornar lista da ONG', async () => {
      const fake = [{}, {}];
      prisma.produtos.findMany.mockResolvedValue(fake);
      const ret = await service.findMinhasRealocacoesAtivasService(5);
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { ong_id: 5, finalidade: 'REALOCACAO', status: 'ATIVA' },
        orderBy: { criado_em: 'desc' }
      }));
      expect(ret).toBe(fake);
    });
  });

  describe('findMinhasRealocacoesFinalizadasService', () => {
    it('deve retornar finalizadas da ONG', async () => {
      const fake = [{}, {}];
      prisma.produtos.findMany.mockResolvedValue(fake);
      const ret = await service.findMinhasRealocacoesFinalizadasService(7);
      expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { ong_id: 7, finalidade: 'REALOCACAO', status: 'FINALIZADA' },
        orderBy: { finalizado_em: 'desc' }
      }));
      expect(ret).toBe(fake);
    });
  });

  describe('createRealocacaoService', () => {
    const dados = {
      titulo: 'T',
      descricao: 'D',
      tipo_item: 'X',
      url_imagem: 'http://img',
      quantidade: '3',
      whatsapp: '11999999999',
      email: 'a@b.com'
    };

    it('deve chamar validarRealocacao e criar', async () => {
      const created = { id_produto: 20, ...dados };
      prisma.produtos.create.mockResolvedValue(created);

      const ret = await service.createRealocacaoService(dados, 42);

      expect(validarRealocacao).toHaveBeenCalledWith(dados, 'criar');
      expect(prisma.produtos.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          titulo: 'T',
          descricao: 'D',
          tipo_item: 'X',
          url_imagem: 'http://img',
          quantidade: 3,
          whatsapp: '11999999999',
          email: 'a@b.com',
          status: 'ATIVA',
          finalidade: 'REALOCACAO',
          ong_id: 42,
          prazo_necessidade: expect.any(Date)
        })
      }));
      expect(ret).toEqual(created);
    });

    it('deve propagar erro de validação', async () => {
      validarRealocacao.mockImplementation(() => { throw { status:400, message:'err' }; });
      await expect(service.createRealocacaoService(dados, 1))
        .rejects.toEqual({ status:400, message:'err' });
      expect(prisma.produtos.create).not.toHaveBeenCalled();
    });
  });

  describe('updateRealocacaoService', () => {
    const existing = { id_produto: 5, ong_id: 100 };
    const updateData = { titulo:'N', descricao:'D', tipo_item:'T', url_imagem:'u', whatsapp:'w', email:'e', quantidade:'2' };

    it('deve lançar 404 se não existir', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(service.updateRealocacaoService(5, updateData, 100))
        .rejects.toEqual({ status:404, message:'Realocação não encontrada' });
    });

    it('deve lançar 403 se ong_id não bater', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ ...existing, ong_id: 999 });
      await expect(service.updateRealocacaoService(5, updateData, 100))
        .rejects.toEqual({ status:403, message:'Você não tem permissão para modificar esta realocação' });
    });

    it('deve chamar validarRealocacao e atualizar todos os campos corretamente', async () => {
      // 1) força o validador a não lançar
      validarRealocacao.mockImplementation(() => {});

      // 2) registro existente no banco
      const existing = { id_produto: 5, ong_id: 10 };
      prisma.produtos.findUnique.mockResolvedValue(existing);

      // 3) dados de atualização vindos do frontend
      const updateData = {
        titulo:     'Título Novo',
        descricao:  'Descrição Nova',
        tipo_item:  'Outros',
        url_imagem: 'https://exemplo.com/nova.jpg',
        whatsapp:   '11911112222',
        email:      'novo@ong.com',
        quantidade: '4'   // string, o service vai converter
      };

      // 4) o prisma retorna este objeto atualizado
      const expectedUpdated = {
        ...existing,
        titulo:     'Título Novo',
        descricao:  'Descrição Nova',
        tipo_item:  'Outros',
        url_imagem: 'https://exemplo.com/nova.jpg',
        whatsapp:   '11911112222',
        email:      'novo@ong.com',
        quantidade: 4   // convertido para número
      };
      prisma.produtos.update.mockResolvedValue(expectedUpdated);

      // 5) chama o método
      const result = await service.updateRealocacaoService(5, updateData, existing.ong_id);

      // 6) asserts
      expect(validarRealocacao).toHaveBeenCalledWith(updateData);
      expect(prisma.produtos.update).toHaveBeenCalledWith({
        where: { id_produto: 5 },
        data: {
          titulo:     'Título Novo',
          descricao:  'Descrição Nova',
          tipo_item:  'Outros',
          url_imagem: 'https://exemplo.com/nova.jpg',
          whatsapp:   '11911112222',
          email:      'novo@ong.com',
          quantidade: 4
        }
      });
      expect(result).toEqual(expectedUpdated);
    });

  });

  describe('finalizarRealocacaoService', () => {
    const existing = { id_produto: 7, ong_id: 50 };

    it('404 se não existir', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(service.finalizarRealocacaoService(7, 50))
        .rejects.toEqual({ status:404, message:'Realocação não encontrada' });
    });

    it('403 se ong_id não bater', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ ...existing, ong_id: 999 });
      await expect(service.finalizarRealocacaoService(7, 50))
        .rejects.toEqual({ status:403, message:'Você não tem permissão para modificar esta realocação' });
    });

    it('deve finalizar realocação definindo status e finalizado_em corretamente', async () => {
      // 1) cenários
      const existing = { id_produto: 7, ong_id: 50 };
      prisma.produtos.findUnique.mockResolvedValue(existing);

      // 2) fixa a hora atual
      const fakeNow = new Date('2025-07-31T12:00:00Z');
      jest.useFakeTimers('modern').setSystemTime(fakeNow);

      // 3) mock da atualização no Prisma
      const updated = { ...existing, status: 'FINALIZADA', finalizado_em: fakeNow };
      prisma.produtos.update.mockResolvedValue(updated);

      // 4) chama o service
      const result = await service.finalizarRealocacaoService(7, 50);

      // 5) verifica chamada ao Prisma com o objeto exato
      expect(prisma.produtos.update).toHaveBeenCalledWith({
        where: { id_produto: 7 },
        data: {
          status: 'FINALIZADA',
          finalizado_em: fakeNow
        }
      });

      // 6) retorno também deve bater
      expect(result).toEqual(updated);

      // 7) limpa fake timers
      jest.useRealTimers();
    });
  });


  describe('finalizarRealocacoesAntigas', () => {
    it('deve chamar updateMany e retornar resultado', async () => {
      const result = { count: 3 };
      prisma.produtos.updateMany.mockResolvedValue(result);

      const ret = await service.finalizarRealocacoesAntigas();
      expect(prisma.produtos.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: 'ATIVA',
          finalidade: 'REALOCACAO',
          prazo_necessidade: { lt: expect.any(Date) }
        }),
        data: { status:'FINALIZADA', finalizado_em: expect.any(Date) }
      }));
      expect(ret).toBe(result);
    });
  });

  describe('deleteRealocacaoService', () => {
    const existing = { id_produto: 9, ong_id: 20 };

    it('404 se não existir', async () => {
      prisma.produtos.findUnique.mockResolvedValue(null);
      await expect(service.deleteRealocacaoService(9, 20))
        .rejects.toEqual({ status:404, message:'Realocação não encontrada' });
    });

    it('403 se ong_id não bater', async () => {
      prisma.produtos.findUnique.mockResolvedValue({ ...existing, ong_id: 999 });
      await expect(service.deleteRealocacaoService(9, 20))
        .rejects.toEqual({ status:403, message:'Você não tem permissão para deletar esta realocação' });
    });

    it('deve deletar com sucesso', async () => {
      prisma.produtos.findUnique.mockResolvedValue(existing);
      prisma.produtos.delete.mockResolvedValue({ deleted: true });

      const ret = await service.deleteRealocacaoService(9, 20);
      expect(prisma.produtos.delete).toHaveBeenCalledWith({ where: { id_produto: 9 } });
      expect(ret).toEqual({ deleted: true });
    });
  });

describe('limparRealocacoesExpiradas', () => {
  it('deve chamar deleteMany e retornar totalExcluidas', async () => {
    prisma.produtos.deleteMany.mockResolvedValue({ count: 7 });

    const ret = await service.limparRealocacoesExpiradas(true);
    expect(prisma.produtos.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        finalidade: 'REALOCACAO',
        status: 'FINALIZADA',
        finalizado_em: { lt: expect.any(Date) }
      })
    }));
    expect(ret).toEqual({ totalExcluidas: 7 });
  });

  it('deve logar a mensagem quando log=true', async () => {
    // 1) prepara
    prisma.produtos.deleteMany.mockResolvedValue({ count: 7 });
    console.log = jest.fn();

    // 2) executa passando log=true
    const ret = await service.limparRealocacoesExpiradas(true);

    // 3) verifica o deleteMany
    expect(prisma.produtos.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        finalidade: 'REALOCACAO',
        status: 'FINALIZADA',
        finalizado_em: { lt: expect.any(Date) }
      })
    }));

    // 4) verifica o console.log
    expect(console.log).toHaveBeenCalledWith(
      '🗑️ 7 realocações excluídas (finalizadas há +6 meses)'
    );

    // 5) e retorna o total certo
    expect(ret).toEqual({ totalExcluidas: 7 });
  });
});
}); 
