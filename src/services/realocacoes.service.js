const prisma = require('../config/database');

// Listar todas as realocações disponíveis (API restrita para ONGs autenticadas)
exports.findAllRealocacoesService = async (filtros = {}) => {
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
      ong: {
        select: {
          nome: true,
          whatsapp: true,
          logo_url: true
        }
      }
    },
    orderBy: {
      criado_em: 'desc'
    }
  });
};


// Buscar realocação específica por ID (API restrita para ONGs autenticadas)
exports.findByIdRealocacaoService = async (id) => {
  const idNumerico = parseInt(id);

  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const produto = await prisma.produtos.findUnique({
    where: {
      id_produto: idNumerico,
      finalidade: 'REALOCACAO'
    },
    include: {
      ong: {
        select: {
          nome: true,
          whatsapp: true,
          logo_url: true,
          instagram: true,
          facebook: true,
          site: true
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

// Listar realocações da ONG logada
// src/services/realocacoes.service.js
exports.findRealocacoesDaOngService = async (ongId) => {
  return await prisma.produtos.findMany({
    where: {
      ong_id: ongId,
      finalidade: 'REALOCACAO'
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      quantidade: true,
      status: true,
      url_imagem: true,
      criado_em: true,
      ong_id: true 
    },
    orderBy: {
      criado_em: 'desc'
    }
  });
};

// Criar realocação
exports.createRealocacaoService = async (realocacaoData, ongId) => {
  const nova = await prisma.produtos.create({
    data: {
      titulo: realocacaoData.titulo,
      descricao: realocacaoData.descricao,
      tipo_item: realocacaoData.tipo_item,
      url_imagem: realocacaoData.url_imagem,
      quantidade: realocacaoData.quantidade || 1,
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
  const idNumerico = parseInt(id);
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const realocacao = await prisma.produtos.findUnique({
    where: { id_produto: idNumerico, finalidade: 'REALOCACAO' }
  });

  if (!realocacao) throw new Error('Realocação não encontrada');
  if (realocacao.ong_id !== ongId) throw new Error('Você não tem permissão para modificar esta realocação');

  const atualizada = await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: {
      titulo: realocacaoData.titulo,
      descricao: realocacaoData.descricao,
      tipo_item: realocacaoData.tipo_item,
      url_imagem: realocacaoData.url_imagem,
      quantidade: realocacaoData.quantidade
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

  const realocacao = await prisma.produtos.findUnique({
    where: { id_produto: idNumerico, finalidade: 'REALOCACAO' }
  });

  if (!realocacao) throw new Error('Realocação não encontrada');
  if (realocacao.ong_id !== ongId) throw new Error('Você não tem permissão para modificar esta realocação');

  const atualizada = await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: { status: newStatus }
  });

  return {
    ...atualizada
  };
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
