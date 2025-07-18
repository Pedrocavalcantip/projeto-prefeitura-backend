const prisma = require('../config/database');

// Listar todas as realocações disponíveis (API pública para o marketplace)
exports.findAllRealocacoesService = async () => {
  return await prisma.produtos.findMany({
    where: {
      status: 'ATIVA',
      finalidade: 'REALOCACAO'
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      urgencia: true,
      quantidade: true,
      url_imagem: true,
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

// Buscar realocação específica por ID (API pública)
exports.findByIdRealocacaoService = async (id) => {
  const idNumerico = parseInt(id);
  
  // Validação extra no service
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const produto = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'REALOCACAO' 
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      urgencia: true,
      quantidade: true,
      url_imagem: true,
      criado_em: true,
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
  
  return produto;
};

// Listar realocações da ONG logada (com dados completos incluindo status)
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
      urgencia: true,
      quantidade: true,
      status: true,
      url_imagem: true,
      criado_em: true
    },
    orderBy: {
      criado_em: 'desc'
    }
  });
};

// Criar realocação (produto para realocação)
exports.createRealocacaoService = async (realocacaoData, ongId) => {
  return await prisma.produtos.create({
    data: {
      titulo: realocacaoData.titulo,
      descricao: realocacaoData.descricao,
      tipo_item: realocacaoData.tipo_item,
      url_imagem: realocacaoData.url_imagem,
      urgencia: realocacaoData.urgencia || 'MEDIA',
      quantidade: realocacaoData.quantidade || 1,
      status: 'ATIVA',
      finalidade: 'REALOCACAO',
      ong_id: ongId
    }
  });
};

// Atualizar realocação
exports.updateRealocacaoService = async (id, realocacaoData, ongId) => {
  const idNumerico = parseInt(id);
  
  // Validação do ID
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  // Verificar se a realocação existe e se pertence à ONG
  const realocacao = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'REALOCACAO' // Garantir que é uma realocação
    }
  });
  
  if (!realocacao) {
    throw new Error('Realocação não encontrada');
  }
  
  if (realocacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta realocação');
  }
  
  return await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: {
      titulo: realocacaoData.titulo,
      descricao: realocacaoData.descricao,
      tipo_item: realocacaoData.tipo_item,
      url_imagem: realocacaoData.url_imagem,
      urgencia: realocacaoData.urgencia,
      quantidade: realocacaoData.quantidade
    }
  });
};

// Atualizar status da realocação
exports.updateStatusRealocacaoService = async (id, newStatus, ongId) => {
  const idNumerico = parseInt(id);
  
  // Validação do ID
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  // Verificar propriedade
  const realocacao = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'REALOCACAO' // Garantir que é uma realocação
    }
  });
  
  if (!realocacao) {
    throw new Error('Realocação não encontrada');
  }
  
  if (realocacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta realocação');
  }
  
  return await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: { status: newStatus }
  });
};

// Deletar realocação
exports.deleteRealocacaoService = async (id, ongId) => {
  const idNumerico = parseInt(id);
  
  // Validação do ID
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  // Verificar propriedade
  const realocacao = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'REALOCACAO' // Garantir que é uma realocação
    }
  });
  
  if (!realocacao) {
    throw new Error('Realocação não encontrada');
  }
  
  if (realocacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para deletar esta realocação');
  }
  
  return await prisma.produtos.delete({
    where: { id_produto: idNumerico }
  });
};