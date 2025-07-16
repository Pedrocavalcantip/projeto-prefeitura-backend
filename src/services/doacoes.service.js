const prisma = require('../config/database');
const { addDays } = require('date-fns');

// Buscar todas as doações com filtros
const findAllDoacoesService = async (filtros) => {
  const {
    tipo_item,
    titulo,
    urgencia,
    ordem,
    ong_id,
    ordenarPor,
    prestesAVencer
  } = filtros;

  const hoje = new Date();
  const limiteVencimento = addDays(hoje, 14);

  return await prisma.produtos.findMany({
    include: {
      ong: {
        select: {
          id_ong: true,
          nome: true,
          email: true,
          whatsapp: true,
          instagram: true,
          facebook: true,
          site: true,
          logo_url: true
        }
      }
    },
    orderBy: ordenarPor ? {
      [ordenarPor]: ordem === 'desc' ? 'desc' : 'asc'
    } : undefined,
    where: {
      ...(tipo_item && { tipo_item }),
      ...(urgencia && { urgencia }),
      ...(ong_id && { ong_id: Number(ong_id) }),
      ...(titulo && {
        titulo: {
          contains: titulo,
          mode: 'insensitive'
        }
      }),
      ...(prestesAVencer && {
        prazo_necessidade: {
          lte: limiteVencimento
        }
      })
    }
  });
};

// Buscar uma doação pelo ID
const findByIdDoacaoService = async (id) => {
  return await prisma.produtos.findUnique({
    where: { id_produto: Number(id) },
    include: { ong: true },
  });
};

// Criar nova doação
const createDoacaoService = async (dadosDaNovaDoacao, ongId) => {
  const dadosComOng = {
    ...dadosDaNovaDoacao,
    ong_id: ongId,
  };
  return await prisma.produtos.create({ data: dadosComOng });
};

// Atualizar doação
const updateDoacaoService = async (id, dadosParaEditar, ongId) => {
  const doacaoExistente = await prisma.produtos.findUnique({
    where: { id_produto: Number(id) }
  });

  if (!doacaoExistente) {
    throw new Error('Doação não encontrada');
  }

  if (doacaoExistente.ong_id !== ongId) {
    throw new Error('Você não tem permissão para editar esta doação');
  }

  // Remove campos que não devem ser atualizados
  const { id_produto, criado_em, ...dadosValidados } = dadosParaEditar;

  const doacaoAtualizada = await prisma.produtos.update({
    where: { id_produto: Number(id) },
    data: dadosValidados,
  });

  return doacaoAtualizada;
};

// Deletar doação
const deleteDoacaoService = async (id, ongId) => {
  const doacaoExistente = await prisma.produtos.findUnique({
    where: { id_produto: Number(id) }
  });

  if (!doacaoExistente) {
    throw new Error('Doação não encontrada');
  }

  if (doacaoExistente.ong_id !== ongId) {
    throw new Error('Você não tem permissão para deletar esta doação');
  }

  await prisma.produtos.delete({ where: { id_produto: Number(id) } });
};

module.exports = {
  findAllDoacoesService,
  findByIdDoacaoService,
  createDoacaoService,
  updateDoacaoService,
  deleteDoacaoService,
};
