const prisma = require('../config/database');

// Buscar todas as realocações com dados do produto
const findAllService = async () => {
  return await prisma.realocacoes_produto.findMany({
    include: {
      produtos: {
        select: {
          id_produto: true,
          titulo: true,
          descricao: true,
          tipo_item: true
        }
      }
    }
  });
};

// Buscar uma realocação pelo ID
const findByIdService = async (id) => {
  return await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: Number(id) },
    include: {
      produtos: {
        select: {
          id_produto: true,
          titulo: true,
          descricao: true,
          tipo_item: true
        }
      }
    }
  });
};

// Criar nova realocação
const createService = async (dados, ongId) => {
  const { id_produto, observacoes } = dados;

  if (!id_produto) throw new Error('id_produto é obrigatório');

  const produto = await prisma.produtos.findUnique({
    where: { id_produto },
    include: { ong: true }
  });

  if (!produto) throw new Error("Produto não encontrado.");
  if (produto.ong_id !== ongId) throw new Error("Você não tem permissão para realocar este produto.");

  return await prisma.realocacoes_produto.create({
    data: {
      id_produto,
      observacoes,
      nome_ong_origem: produto.ong.nome,
      email_ong_origem: produto.ong.email,
      whatsapp_ong_origem: produto.ong.whatsapp,
      instagram_ong_origem: produto.ong.instagram
    }
  });
};

// Atualizar uma realocação
const updateService = async (id, dados, ongId) => {
  const existente = await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: Number(id) },
    include: { produtos: true }
  });

  if (!existente) throw new Error('Realocação não encontrada');
  if (existente.produtos.ong_id !== ongId) throw new Error('Você não tem permissão para editar esta realocação');

  return await prisma.realocacoes_produto.update({
    where: { id_realocacao: Number(id) },
    data: dados,
  });
};

// Deletar uma realocação
const deleteService = async (id, ongId) => {
  const existente = await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: Number(id) },
    include: { produtos: true }
  });

  if (!existente) throw new Error('Realocação não encontrada');
  if (existente.produtos.ong_id !== ongId) throw new Error('Você não tem permissão para excluir esta realocação');

  await prisma.realocacoes_produto.delete({
    where: { id_realocacao: Number(id) }
  });
};

module.exports = {
  findAllService,
  findByIdService,
  createService,
  updateService,
  deleteService,
};
