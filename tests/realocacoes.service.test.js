jest.mock('../src/config/database', () => require('../__mocks__/prisma'));
const prisma = require('../src/config/database');

const {
  createRealocacaoService,
  updateRealocacaoService,
  deleteRealocacaoService,
  updateStatusRealocacaoService,
  findAllRealocacoesService,
  findByIdRealocacaoService,
  findRealocacoesDaOngService
} = require('../src/services/realocacoes.service');

describe('Realocacoes Service - Testes Unitários', () => {
  afterEach(() => jest.clearAllMocks());

  // CREATE
  test('createRealocacaoService deve criar uma nova realocação', async () => {
    const data = { titulo: 'Mesa', tipo_item: 'mobilia' };
    prisma.produtos.create.mockResolvedValue({ id_produto: 1, ...data });

    const resultado = await createRealocacaoService(data, 42);

    expect(prisma.produtos.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        titulo: 'Mesa',
        tipo_item: 'mobilia',
        finalidade: 'REALOCACAO',
        ong_id: 42
      })
    });
    expect(resultado.id_produto).toBe(1);
  });

  // UPDATE - sucesso
  test('updateRealocacaoService deve atualizar se ONG for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 42 });
    prisma.produtos.update.mockResolvedValue({ titulo: 'Atualizado' });

    const resultado = await updateRealocacaoService(1, { titulo: 'Atualizado' }, 42);
    expect(resultado.titulo).toBe('Atualizado');
  });

  // UPDATE - erro de permissão
  test('updateRealocacaoService deve lançar erro se ONG não for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 99 });

    await expect(updateRealocacaoService(1, {}, 42))
      .rejects.toThrow('Você não tem permissão para modificar esta realocação');
  });

  // UPDATE - não encontrada
  test('updateRealocacaoService deve lançar erro se não encontrada', async () => {
    prisma.produtos.findUnique.mockResolvedValue(null);

    await expect(updateRealocacaoService(1, {}, 42))
      .rejects.toThrow('Realocação não encontrada');
  });

  // DELETE - sucesso
  test('deleteRealocacaoService deve deletar se ONG for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 42 });
    prisma.produtos.delete.mockResolvedValue({});

    await deleteRealocacaoService(1, 42);
    expect(prisma.produtos.delete).toHaveBeenCalledWith({ where: { id_produto: 1 } });
  });

  // DELETE - erro de permissão
  test('deleteRealocacaoService deve lançar erro se ONG não for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 99 });

    await expect(deleteRealocacaoService(1, 42))
      .rejects.toThrow('Você não tem permissão para deletar esta realocação');
  });

  // STATUS - sucesso
  test('updateStatusRealocacaoService deve atualizar status se ONG for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 42 });
    prisma.produtos.update.mockResolvedValue({ status: 'INATIVA' });

    const resultado = await updateStatusRealocacaoService(1, 'INATIVA', 42);
    expect(resultado.status).toBe('INATIVA');
  });

  // STATUS - erro de permissão
  test('updateStatusRealocacaoService deve lançar erro se ONG não for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 99 });

    await expect(updateStatusRealocacaoService(1, 'INATIVA', 42))
      .rejects.toThrow('Você não tem permissão para modificar esta realocação');
  });

  // FIND BY ID - sucesso
  test('findByIdRealocacaoService deve retornar realocação por ID', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 5, titulo: 'Cadeira' });

    const resultado = await findByIdRealocacaoService(5);
    expect(resultado.titulo).toBe('Cadeira');
  });

  // FIND BY ID - erro ID inválido
  test('findByIdRealocacaoService deve lançar erro se ID for inválido', async () => {
    await expect(findByIdRealocacaoService('abc'))
      .rejects.toThrow('ID deve ser um número válido maior que zero');
  });

  // FIND BY ID - não encontrada
  test('findByIdRealocacaoService deve lançar erro se não existir', async () => {
    prisma.produtos.findUnique.mockResolvedValue(null);

    await expect(findByIdRealocacaoService(99))
      .rejects.toThrow('Realocação não encontrada');
  });

  // FIND ALL - sem filtro
  test('findAllRealocacoesService deve retornar realocações ativas', async () => {
    prisma.produtos.findMany.mockResolvedValue([{ id_produto: 1 }, { id_produto: 2 }]);

    const resultado = await findAllRealocacoesService();
    expect(resultado).toHaveLength(2);
  });

  // FIND ALL - com filtros
  test('findAllRealocacoesService deve aplicar filtros de titulo e tipo_item', async () => {
    prisma.produtos.findMany.mockResolvedValue([{ id_produto: 1 }]);

    const resultado = await findAllRealocacoesService({ titulo: 'cadeira', tipo_item: 'mobilia' });

    expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        titulo: expect.any(Object),
        tipo_item: expect.any(Object)
      })
    }));
    expect(resultado).toHaveLength(1);
  });

  // FIND BY ONG
  test('findRealocacoesDaOngService deve retornar realocações da ONG', async () => {
    prisma.produtos.findMany.mockResolvedValue([{ id_produto: 1, ong_id: 42 }]);

    const resultado = await findRealocacoesDaOngService(42);
    expect(resultado[0].ong_id).toBe(42);
  });
});
