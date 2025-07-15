// Importa a nossa conexão com o banco que você já criou
const prisma = require('../config/database');

// Função para buscar TODAS as doações no banco
const { addDays, subDays } = require('date-fns');

const findAllDoacoesService = async (filtros) => {
  const {
    tipo_item,
    titulo,
    urgencia,
    ordem,
    ong_id,
    ordenarPor,
    prestesAVencer,
    lancadoRecentemente
  } = filtros;

  const hoje = new Date();
  const limiteVencimento = addDays(hoje, 15); // produtos com prazo até 15 dias
  const limiteCriacao = subDays(hoje, 15);    // criados nos últimos 15 dias

  return await prisma.produtos.findMany({
    include: {
      ong: {
        select: {
          id_ong: true,
          nome: true,
          email: true
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
      }),
      ...(lancadoRecentemente && {
        criado_em: {
          gte: limiteCriacao
        }
      })
    }
  });
};


// Função para buscar UMA doação pelo seu ID
const findByIdDoacaoService = async (id) => {
    const doacao = await prisma.produtos.findUnique({ 
        where: { id_produto: Number(id) },
        include: {
            ong: true,
        },
    });
    return doacao;
};

// Função para CRIAR uma nova doação
const createDoacaoService = async (dadosDaNovaDoacao, ongId) => {
    // Adicione o ong_id que veio do token aos dados da doação
    const dadosComOng = {
        ...dadosDaNovaDoacao,
        ong_id: ongId,
    };
    const doacaoCriada = await prisma.produtos.create({ data: dadosComOng });
    return doacaoCriada;
};

// Função para ATUALIZAR uma doação
const dadosLimpos = (dados) => {
    // Limpa os dados para evitar problemas de segurança
    return {
        titulo: dados.titulo,
        descricao: dados.descricao,
        tipo_item: dados.tipo_item,
        quantidade: dados.quantidade,
        data_post: new Date(),
        observacoes: dados.observacoes || null, // Se não tiver observações, deixa como null
    };
};
const updateDoacaoService = async (id, dadosParaEditar, ongId) => {
  // Primeiro, verifica se a doação pertence à ONG logada
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
  const { id_produto, criado_em, ...dadosLimpos } = dadosParaEditar;

  const doacaoAtualizada = await prisma.produtos.update({
    where: { id_produto: Number(id) },
    data: dadosLimpos,
  });

  return doacaoAtualizada;
};

// Função para APAGAR uma doação
const deleteDoacaoService = async (id, ongId) => {
    // Primeiro, verifica se a doação pertence à ONG logada
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

// Exportamos todas as funções para que o próximo arquivo (o Controller) possa usá-las
module.exports = {
    findAllDoacoesService,
    findByIdDoacaoService,
    createDoacaoService,
    updateDoacaoService,
    deleteDoacaoService,
};