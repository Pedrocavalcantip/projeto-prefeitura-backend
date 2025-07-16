// Mock do módulo de conexão com o banco de dados (Prisma)
jest.mock('../../src/config/database', () => require('../../__mocks__/prisma'));
const prisma = require('../../src/config/database');

// Importa as funções que serão testadas
const {
  createDoacaoService,
  updateDoacaoService,
  deleteDoacaoService
} = require('../../src/services/doacoes.service');

// Início da suíte de testes de unidade
describe('Doacoes Service - Testes Unitários: create, update, delete', () => {
  // Limpa os mocks após cada teste para evitar interferência entre eles
  afterEach(() => jest.clearAllMocks());

  // TESTE: Criação de doação
  test('createDoacaoService deve criar uma nova doação', async () => {
    const novaDoacao = { titulo: 'Arroz', descricao: 'Pacote de 5kg', tipo_item: 'alimento' };

    // Simula retorno do Prisma
    prisma.produtos.create.mockResolvedValue({ id_produto: 1, ...novaDoacao, ong_id: 42 });

    // Executa a função e verifica se ela retorna o esperado
    const resultado = await createDoacaoService(novaDoacao, 42);
    expect(prisma.produtos.create).toHaveBeenCalledWith({
      data: { ...novaDoacao, ong_id: 42 }
    });
    expect(resultado.id_produto).toBe(1);
  });

  // TESTE: Atualização de doação com sucesso
  test('updateDoacaoService deve atualizar uma doação da própria ONG', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 42 });
    prisma.produtos.update.mockResolvedValue({ id_produto: 1, titulo: 'Atualizado' });

    const dados = { titulo: 'Atualizado', descricao: 'desc', tipo_item: 'alimento', urgencia: 'baixa', prazo_necessidade: new Date() };
    const resultado = await updateDoacaoService(1, dados, 42);

    expect(prisma.produtos.update).toHaveBeenCalled();
    expect(resultado.titulo).toBe('Atualizado');
  });

  // TESTE: Atualização sem permissão
  test('updateDoacaoService deve lançar erro se a doação for de outra ONG', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 10 });

    await expect(updateDoacaoService(1, {}, 99))
      .rejects.toThrow('Você não tem permissão para editar esta doação');
  });

  // TESTE: Exclusão com sucesso
  test('deleteDoacaoService deve deletar uma doação da ONG', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 42 });
    prisma.produtos.delete.mockResolvedValue({});

    await deleteDoacaoService(1, 42);

    expect(prisma.produtos.delete).toHaveBeenCalledWith({ where: { id_produto: 1 } });
  });

  // TESTE: Exclusão de doação inexistente
  test('deleteDoacaoService deve lançar erro se a doação não existir', async () => {
    prisma.produtos.findUnique.mockResolvedValue(null);

    await expect(deleteDoacaoService(999, 1))
      .rejects.toThrow('Doação não encontrada');
  });

  // TESTE: Exclusão de doação por ONG não autorizada
  test('deleteDoacaoService deve lançar erro se ONG não for dona da doação', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 10 });

    await expect(deleteDoacaoService(1, 99))
      .rejects.toThrow('Você não tem permissão para deletar esta doação');
  });
});
