
jest.mock('../src/config/database', () => require('../__mocks__/prisma'));
const prisma = require('../src/config/database');

const {
  findAllDoacoesService,
  findDoacoesDaOngService,
  findByIdDoacaoService,
  createDoacaoService,
  updateDoacaoService,
  updateStatusDoacaoService,
  deleteDoacaoService
} = require('../src/services/doacoes.service');

describe('Doacoes Service - Testes Unitários', () => {
  afterEach(() => jest.clearAllMocks());

  it('findAllDoacoesService deve retornar doações ativas com filtros', async () => {
    const mockDoacoes = [{ id_produto: 1, titulo: 'Produto A' }];
    prisma.produtos.findMany.mockResolvedValue(mockDoacoes);

    const result = await findAllDoacoesService({ titulo: 'a', tipo_item: 'alimento' });

    expect(prisma.produtos.findMany).toHaveBeenCalled();
    expect(result).toEqual(mockDoacoes);
  });

  it('findDoacoesDaOngService deve retornar doações da ONG', async () => {
    const mockDoacoes = [{ id_produto: 1, titulo: 'Produto ONG' }];
    prisma.produtos.findMany.mockResolvedValue(mockDoacoes);

    const result = await findDoacoesDaOngService(10);

    expect(prisma.produtos.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ong_id: 10, finalidade: 'DOACAO' } }));
    expect(result).toEqual(mockDoacoes);
  });

  it('findByIdDoacaoService deve retornar doação por ID', async () => {
    const mockProduto = { id_produto: 1, titulo: 'Produto X' };
    prisma.produtos.findUnique.mockResolvedValue(mockProduto);

    const result = await findByIdDoacaoService(1);

    expect(prisma.produtos.findUnique).toHaveBeenCalled();
    expect(result).toEqual(mockProduto);
  });

  it('findByIdDoacaoService deve lançar erro se ID inválido', async () => {
    await expect(findByIdDoacaoService('abc')).rejects.toThrow('ID deve ser um número válido maior que zero');
  });

  it('findByIdDoacaoService deve lançar erro se não encontrado', async () => {
    prisma.produtos.findUnique.mockResolvedValue(null);
    await expect(findByIdDoacaoService(99)).rejects.toThrow('Doação não encontrada');
  });

  it('createDoacaoService deve criar doação com todos os campos obrigatórios', async () => {
    const mock = { id_produto: 10 };
    prisma.produtos.create.mockResolvedValue(mock);

    const novaDoacao = {
      titulo: 'Doar',
      descricao: 'Descrição teste',
      tipo_item: 'Roupas e Calçados',
      quantidade: 2,
      prazo_necessidade: '2025-12-31',
      url_imagem: 'https://exemplo.com/imagem.jpg',
      urgencia: 'MEDIA',
      whatsapp: '11999999999',
      email: 'teste@exemplo.com'
    };
    const result = await createDoacaoService(novaDoacao, 1);

    const chamada = prisma.produtos.create.mock.calls[0][0].data;
    // Verifica todos os campos obrigatórios
    Object.entries(novaDoacao).forEach(([key, value]) => {
      if (chamada[key] !== undefined) {
        if (key === 'prazo_necessidade') {
          expect(chamada[key].startsWith(value)).toBe(true);
        } else {
          expect(chamada[key]).toBe(value);
        }
      }
    });
    expect(result).toEqual(mock);
  });

  it('updateDoacaoService deve atualizar se ONG for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ id_produto: 1, ong_id: 2 });
    prisma.produtos.update.mockResolvedValue({ titulo: 'Atualizado' });

    const result = await updateDoacaoService(1, { titulo: 'Atualizado' }, 2);

    expect(result.titulo).toBe('Atualizado');
  });

  it('updateDoacaoService deve lançar erro se ONG não for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ ong_id: 3 });
    await expect(updateDoacaoService(1, {}, 2)).rejects.toThrow('Você não tem permissão para modificar esta doação');
  });

  it('updateStatusDoacaoService deve atualizar status se ONG for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ ong_id: 1 });
    prisma.produtos.update.mockResolvedValue({ status: 'FINALIZADA' });

    const result = await updateStatusDoacaoService(1, 'FINALIZADA', 1);
    expect(result.status).toBe('FINALIZADA');
  });

  it('updateStatusDoacaoService deve lançar erro para status inválido', async () => {
    await expect(updateStatusDoacaoService(1, 'STATUS_INVALIDO', 1))
      .rejects.toThrow('Status inválido. Use apenas ATIVA ou FINALIZADA');
  });

  it('deleteDoacaoService deve deletar se ONG for dona', async () => {
    prisma.produtos.findUnique.mockResolvedValue({ ong_id: 1 });
    prisma.produtos.delete.mockResolvedValue({ id_produto: 1 });

    const result = await deleteDoacaoService(1, 1);
    expect(result.id_produto).toBe(1);
  });
});
