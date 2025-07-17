const prisma = require('../config/database');

// Listar todas as realocações
exports.findAllRealocacoesService = async () => {
  return await prisma.realocacoes_produto.findMany({
    select: {
      id_realocacao: true,
      observacoes: true,
      data_post: true,
      quantidade_realocada: true,
      produto: {
        select: {
          id_produto: true,
          titulo: true,
          tipo_item: true,
          urgencia: true
        }
      },
      ong_origem: {
        select: {
          nome: true,
          whatsapp: true,
          logo_url: true
        }
      }
    },
    orderBy: {
      data_post: 'desc'
    }
  });
};

// Buscar realocação por ID
exports.findByIdRealocacaoService = async (id) => {
  const realocacao = await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: parseInt(id) },
    select: {
      id_realocacao: true,
      observacoes: true,
      data_post: true,
      quantidade_realocada: true,
      produto: {
        select: {
          id_produto: true,
          titulo: true,
          descricao: true,
          tipo_item: true,
          urgencia: true,
          quantidade: true
        }
      },
      ong_origem: {
        select: {
          nome: true,
          whatsapp: true,
          instagram: true,
          facebook: true,
          site: true
        }
      }
    }
  });
  
  if (!realocacao) {
    throw new Error('Realocação não encontrada');
  }
  
  return realocacao;
};

// Criar realocação
exports.createRealocacaoService = async (realocacaoData, ongId) => {
  const produtoId = parseInt(realocacaoData.produto_id);
  const quantidadeRealocada = parseInt(realocacaoData.quantidade_realocada);

  // 1. Buscar o produto e fazer todas as validações antes da transação
  const produto = await prisma.produtos.findUnique({
    where: { id_produto: produtoId }
  });

  if (!produto) {
    throw new Error('Produto não encontrado');
  }

  // [NOVA REGRA] Garante que o produto é para realocação
  if (produto.finalidade !== 'REALOCACAO') {
    throw new Error('Este produto é destinado para doação direta e não pode ser realocado.');
  }

  if (quantidadeRealocada <= 0) {
    throw new Error('A quantidade realocada deve ser maior que zero.');
  }

  if (quantidadeRealocada > produto.quantidade) {
    throw new Error('Quantidade solicitada maior que o estoque disponível.');
  }

  // 2. Executar a criação e a atualização do estoque em uma transação atômica
  const [realocacao] = await prisma.$transaction([
    prisma.realocacoes_produto.create({
      data: {
        produto_id: produtoId,
        observacoes: realocacaoData.observacoes,
        quantidade_realocada: quantidadeRealocada,
        ong_origem_id: ongId
      }
    }),
    prisma.produtos.update({
      where: { id_produto: produtoId },
      data: {
        quantidade: {
          decrement: quantidadeRealocada
        }
      }
    })
  ]);

  return realocacao;
};

// Atualizar realocação com verificação de propriedade
exports.updateRealocacaoService = async (id, realocacaoData, ongId) => {
  const realocacaoId = parseInt(id);

  // 1. Buscar a realocação e o produto associado para validação
  const realocacaoExistente = await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: realocacaoId },
    include: { produto: true }
  });

  if (!realocacaoExistente) {
    throw new Error('Realocação não encontrada');
  }

  if (realocacaoExistente.ong_origem_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta realocação');
  }

  // Objeto para armazenar os dados que serão atualizados
  const dadosParaAtualizar = {
    observacoes: realocacaoData.observacoes,
  };

  // --- LÓGICA DE ATUALIZAÇÃO DE QUANTIDADE (SÓ EXECUTA SE A QUANTIDADE FOR ENVIADA) ---
  if (realocacaoData.quantidade_realocada !== undefined) {
    const novaQuantidade = parseInt(realocacaoData.quantidade_realocada);

    if (isNaN(novaQuantidade) || novaQuantidade <= 0) {
      throw new Error('A quantidade realocada deve ser um número maior que zero.');
    }

    const diferencaQuantidade = novaQuantidade - realocacaoExistente.quantidade_realocada;

    if (diferencaQuantidade > realocacaoExistente.produto.quantidade) {
      throw new Error('Ajuste de quantidade excede o estoque disponível.');
    }

    // Adiciona a quantidade aos dados a serem atualizados
    dadosParaAtualizar.quantidade_realocada = novaQuantidade;

    // Executa a atualização da realocação e do estoque em uma transação
    const [realocacaoAtualizada] = await prisma.$transaction([
      prisma.realocacoes_produto.update({
        where: { id_realocacao: realocacaoId },
        data: dadosParaAtualizar
      }),
      prisma.produtos.update({
        where: { id_produto: realocacaoExistente.produto_id },
        data: {
          quantidade: {
            decrement: diferencaQuantidade
          }
        }
      })
    ]);
    return realocacaoAtualizada;

  } else {
    // --- ATUALIZAÇÃO SIMPLES (APENAS OBSERVAÇÕES) ---
    // Se não houver quantidade, atualiza apenas os outros campos sem transação
    return await prisma.realocacoes_produto.update({
      where: { id_realocacao: realocacaoId },
      data: {
        observacoes: realocacaoData.observacoes
      }
    });
  }
};

// Deletar realocação com verificação de propriedade
exports.deleteRealocacaoService = async (id, ongId) => {
  const realocacaoId = parseInt(id);

  // 1. Buscar a realocação para verificar propriedade e obter dados necessários
  const realocacao = await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: realocacaoId }
  });

  if (!realocacao) {
    throw new Error('Realocação não encontrada');
  }

  if (realocacao.ong_origem_id !== ongId) {
    throw new Error('Você não tem permissão para deletar esta realocação');
  }

  // 2. Executar a deleção e a restauração do estoque em uma transação atômica
  await prisma.$transaction([
    // Primeiro, deleta a realocação
    prisma.realocacoes_produto.delete({
      where: { id_realocacao: realocacaoId }
    }),
    // Depois, restaura a quantidade no produto
    prisma.produtos.update({
      where: { id_produto: realocacao.produto_id },
      data: {
        quantidade: {
          increment: realocacao.quantidade_realocada
        }
      }
    })
  ]);

  // Retorna um sucesso, já que o objeto foi deletado
  return { message: 'Realocação deletada com sucesso.' };
};