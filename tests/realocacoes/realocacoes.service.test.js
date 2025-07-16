// Faz o mock da conexão com o banco de dados usando Prisma
jest.mock('../../src/config/database', () => require('../../__mocks__/prisma'));
const prisma = require('../../src/config/database');

// Importa as funções que serão testadas
const {
  findAllService,
  findByIdService,
  createService,
  updateService,
  deleteService
} = require('../../src/services/realocacoes.service');

describe('Realocacoes Service - Testes Unitários: create, update, delete, list', () => {
  // Limpa os mocks após cada teste para evitar interferência
  afterEach(() => jest.clearAllMocks());

  // Testa se a criação de realocação funciona quando a ONG é a dona do produto
  test('createService deve criar uma nova realocação se o produto pertencer à ONG', async () => {
    prisma.produtos.findUnique.mockResolvedValue({
      id_produto: 1,
      ong_id: 42,
      ong: {
        nome: 'ONG A',
        email: 'a@ong.com',
        whatsapp: '123456',
        instagram: 'ong_a'
      }
    });
    prisma.realocacoes_produto.create.mockResolvedValue({ id_realocacao: 1 });

    const resultado = await createService({ id_produto: 1, observacoes: 'urgente' }, 42);
    expect(resultado.id_realocacao).toBe(1);
  });

  // Testa se a criação lança erro quando a ONG não é dona do produto
  test('createService deve lançar erro se o produto for de outra ONG', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 999 });

    await expect(createService({ id_produto: 1 }, 42))
      .rejects.toThrow('Você não tem permissão para realocar este produto.');
  });

  // Testa se a atualização funciona quando a ONG é dona
  test('updateService deve atualizar uma realocação se ONG for dona do produto', async () => {
    prisma.realocacoes_produto.findUnique.mockResolvedValue({
      id_realocacao: 1,
      produtos: { ong_id: 42 }
    });
    prisma.realocacoes_produto.update.mockResolvedValue({ id_realocacao: 1 });

    const resultado = await updateService(1, { observacoes: 'atualizado' }, 42);
    expect(resultado.id_realocacao).toBe(1);
  });

  // Testa se a atualização lança erro quando a ONG não é dona
  test('updateService deve lançar erro se ONG não for dona do produto', async () => {
    prisma.realocacoes_produto.findUnique.mockResolvedValue({
      id_realocacao: 1,
      produtos: { ong_id: 999 }
    });

    await expect(updateService(1, { observacoes: 'tentativa' }, 42))
      .rejects.toThrow('Você não tem permissão para editar esta realocação');
  });

  // Testa se a exclusão funciona quando a ONG é dona
  test('deleteService deve deletar se ONG for dona do produto', async () => {
    prisma.realocacoes_produto.findUnique.mockResolvedValue({
      id_realocacao: 1,
      produtos: { ong_id: 42 }
    });
    prisma.realocacoes_produto.delete.mockResolvedValue({});

    await deleteService(1, 42);
    expect(prisma.realocacoes_produto.delete).toHaveBeenCalledWith({ where: { id_realocacao: 1 } });
  });

  // Testa se a exclusão lança erro quando a ONG não é dona
  test('deleteService deve lançar erro se ONG não for dona', async () => {
    prisma.realocacoes_produto.findUnique.mockResolvedValue({
      id_realocacao: 1,
      produtos: { ong_id: 999 }
    });

    await expect(deleteService(1, 42))
      .rejects.toThrow('Você não tem permissão para excluir esta realocação');
  });

  // Testa se a listagem aplica filtros corretamente
  test('findAllService deve listar realocações com filtro aplicado', async () => {
    prisma.realocacoes_produto.findMany.mockResolvedValue([
      { id_realocacao: 1, produtos: { titulo: 'Fralda' } }
    ]);

    const resultado = await findAllService({ tipo_item: 'higiene' });

    expect(resultado).toHaveLength(1);
    expect(resultado[0].produtos.titulo).toBe('Fralda');
  });

  // Testa se busca por ID retorna os dados corretamente
  test('findByIdService deve retornar realocação pelo ID', async () => {
    prisma.realocacoes_produto.findUnique.mockResolvedValue({
      id_realocacao: 5,
      produtos: { titulo: 'Sabonete' }
    });

    const resultado = await findByIdService(5);
    expect(resultado.produtos.titulo).toBe('Sabonete');
  });
});
