const prisma = require('../config/database.js');
const { validarRealocacao } = require('./validacao.service.js');
// Listar todas as realocações disponíveis (Get /realocacoes/catalogo)
exports.findCatalogoService = async (filtros = {}) => {
  const { titulo, tipo_item } = filtros;

  return await prisma.produtos.findMany({
    where: {
      status: 'ATIVA',
      finalidade: 'REALOCACAO',
      ...(titulo && {
        titulo: {
          contains: titulo,
          mode: 'insensitive'
        }
      }),
      ...(tipo_item && {
        tipo_item: {
          contains: tipo_item,
          mode: 'insensitive'
        }
      })
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      quantidade: true,
      url_imagem: true,
      status: true,
      criado_em: true,
      prazo_necessidade: true,
      ong: {
        select: {
          nome: true,
          whatsapp: true,
          logo_url: true
        }
      }
    },
    orderBy: {
      criado_em: 'cresc'
    }
  });
};

// Buscar realocação específica por ID (Get /realocacoes/catalogo/:id)
exports.findCatalogoByIdService = async (id) => {
  const idNumerico = parseInt(id);

  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const produto = await prisma.produtos.findUnique({
    where: {
      id_produto: idNumerico,
      status: 'ATIVA',
      finalidade: 'REALOCACAO'
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      quantidade: true,
      url_imagem: true,
      prazo_necessidade: true,
      ong: {
        select: {
          nome: true,
          logo_url: true,
        }
      }
    }
  });

  if (!produto) {
    throw new Error('Realocação não encontrada');
  }

  return {
    ...produto
  };
};

// Realocações ATIVAS da ONG
exports.findMinhasRealocacoesAtivasService = async (ongId) => {
  return await prisma.produtos.findMany({
    where: {
      ong_id:    ongId,
      finalidade:'REALOCACAO',
      status:    'ATIVA'
    },
    select: {
      id_produto: true,
      titulo:     true,
      descricao:  true,
      tipo_item:  true,
      quantidade: true,
      status:     true,
      url_imagem: true,
      criado_em:  true
    },
    orderBy: {
      criado_em: 'desc'
    }
  });
};

// Realocações FINALIZADAS da ONG
exports.findMinhasRealocacoesFinalizadasService = async (ongId) => {
  return await prisma.produtos.findMany({
    where: {
      ong_id:    ongId,
      finalidade:'REALOCACAO',
      status:    'FINALIZADA'
    },
    select: {
      id_produto:    true,
      titulo:        true,
      descricao:     true,
      tipo_item:     true,
      quantidade:    true,
      status:        true,
      url_imagem:    true,
      criado_em:     true,
      finalizado_em: true    // precisa estar no schema
    },
    orderBy: {
      finalizado_em: 'desc'
    }
  });
};

// Criar realocação
exports.createRealocacaoService = async (realocacaoData, ongId) => {
  validarRealocacao(realocacaoData);
  // Converte quantidade para número (default 1)
  const quantidade = realocacaoData.quantidade
    ? parseInt(realocacaoData.quantidade, 10)
    : 1;

  const nova = await prisma.produtos.create({
    data: {
      titulo: realocacaoData.titulo,
      descricao: realocacaoData.descricao,
      tipo_item: realocacaoData.tipo_item,
      url_imagem: realocacaoData.url_imagem,
      quantidade,
      whatsapp: realocacaoData.whatsapp,
      email: realocacaoData.email,
      status: 'ATIVA',
      finalidade: 'REALOCACAO',
      ong_id: ongId
      // Sem urgencia e prazo_necessidade para realocações
    }
  });

  return {
    ...nova
  };
};

// Atualizar realocação
exports.updateRealocacaoService = async (id, realocacaoData, ongId) => {
  validarRealocacao(realocacaoData);

  const idNumerico = parseInt(id, 10);
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }


  const realocacao = await prisma.produtos.findUnique({
    where: { id_produto: idNumerico }
  });

  if (!realocacao) throw new Error('Realocação não encontrada');
  if (realocacao.ong_id !== ongId) throw new Error('Você não tem permissão para modificar esta realocação');


    // Converte quantidade se vier definida
  const quantidade = realocacaoData.quantidade !== undefined
    ? parseInt(realocacaoData.quantidade, 10)
    : undefined;
  const atualizada = await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: {
      titulo: realocacaoData.titulo,
      descricao: realocacaoData.descricao,
      tipo_item: realocacaoData.tipo_item,
      url_imagem: realocacaoData.url_imagem,
      ...(quantidade !== undefined && { quantidade }),
      whatsapp: realocacaoData.whatsapp,
      email: realocacaoData.email
      // Sem urgencia e prazo_necessidade para realocações
    }
  });

  return {
    ...atualizada
  };
};

// Atualizar status
exports.updateStatusRealocacaoService = async (id, newStatus, ongId) => {
  const idNumerico = parseInt(id);
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  // Validar status permitido
  const statusPermitidos = ['ATIVA', 'FINALIZADA'];
  if (!statusPermitidos.includes(newStatus)) {
    throw new Error('Status deve ser ATIVA ou FINALIZADA');
  }
  // Não permitir reativar realocação finalizada
  if (realocacao.status === 'FINALIZADA' && newStatus === 'ATIVA') {
    throw new Error('Não é permitido reativar uma realocação finalizada.');
  }

  const realocacao = await prisma.produtos.findUnique({
    where: { id_produto: idNumerico, finalidade: 'REALOCACAO' }
  });

  if (!realocacao) throw new Error('Realocação não encontrada');
  if (realocacao.ong_id !== ongId) throw new Error('Você não tem permissão para modificar esta realocação');

  const atualizada = await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: { status: newStatus,
      finalizado_em: new Date()
    }
  });

  return {
    ...atualizada
  };
};

//Finalizar realocações ativas com mais de 60 dias
exports.finalizarRealocacoesAntigas = async () => {
  const sessentaDiasAtras = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const resultado = await prisma.produtos.updateMany({
    where: {
      status: 'ATIVA',
      finalidade: 'REALOCACAO',
      criado_em: { lt: sessentaDiasAtras }
    },
    data: {
      status: 'FINALIZADA',
      finalizado_em: new Date()
    }
  });

  return resultado;
};
// Deletar
exports.deleteRealocacaoService = async (id, ongId) => {
  const idNumerico = parseInt(id);
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const realocacao = await prisma.produtos.findUnique({
    where: { id_produto: idNumerico, finalidade: 'REALOCACAO' }
  });

  if (!realocacao) throw new Error('Realocação não encontrada');
  if (realocacao.ong_id !== ongId) throw new Error('Você não tem permissão para deletar esta realocação');

  return await prisma.produtos.delete({
    where: { id_produto: idNumerico }
  });
};

exports.limparRealocacoesExpiradas = async (log = false) => {
  const seisMesesAtras = getDataSeisMesesAtras();

  const resultadoExcluir = await prisma.produtos.deleteMany({
    where: {
      finalidade: 'REALOCACAO',
      status: 'FINALIZADA',
      finalizado_em: { lt: seisMesesAtras }
    }
  });

  if (log) {
    console.log(`🗑️ ${resultadoExcluir.count} realocações excluídas (finalizadas há +6 meses)`);
  }

  return {
    totalExcluidas: resultadoExcluir.count
  };
};

const getDataSeisMesesAtras = () => {
  const data = new Date();
  data.setMonth(data.getMonth() - 6);
  return data;
};