// Importa a nossa conexão com o banco que você já criou
const prisma = require('../config/database');

//Biblioteca para fazer a contagem do tempo
const { addDays } = require('date-fns');

// Função para buscar TODAS as doações no banco e fazer a filtragem
const findAllDoacoesService = async (filtros) => {
  const {
    tipo_item,
    titulo,
    urgencia,
    ordem,
    ong_id,
    ordenarPor,
    prestesAVencer
  } = filtros; // Coisas que iremos usar durante o processo

  const hoje = new Date();
  const limiteVencimento = addDays(hoje, 14); // produtos com prazo até 14 dias
  

  //
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

    //Aqui faz a ordenagem, tu podendo dar preferência para uma urgênciencia de alta até baixa
    orderBy: ordenarPor ? {
      [ordenarPor]: ordem === 'desc' ? 'desc' : 'asc' 
    } : undefined,
    // Aqui ocorre a checagem se o que você escolheu é igual ao da ong 
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

  // Somente os campos válidos conforme o schema
  const dadosValidados = {
    titulo: dadosParaEditar.titulo,
    descricao: dadosParaEditar.descricao,
    tipo_item: dadosParaEditar.tipo_item,
    urgencia: dadosParaEditar.urgencia,
    prazo_necessidade: dadosParaEditar.prazo_necessidade
  };

  const doacaoAtualizada = await prisma.produtos.update({
    where: { id_produto: Number(id) },
    data: dadosValidados,
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
