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
  // Verificar se o produto existe
  const produto = await prisma.produtos.findUnique({
    where: { id_produto: parseInt(realocacaoData.produto_id) }
  });
  
  if (!produto) {
    throw new Error('Produto não encontrado');
  }
  
  // Verificar quantidade disponível
  if (realocacaoData.quantidade_realocada > produto.quantidade) {
    throw new Error('Quantidade solicitada maior que disponível');
  }
  
  // Criar a realocação
  const realocacao = await prisma.realocacoes_produto.create({
    data: {
      produto_id: parseInt(realocacaoData.produto_id),
      observacoes: realocacaoData.observacoes,
      quantidade_realocada: parseInt(realocacaoData.quantidade_realocada),
      ong_origem_id: ongId
    }
  });
  
  // Atualizar a quantidade do produto
  await prisma.produtos.update({
    where: { id_produto: parseInt(realocacaoData.produto_id) },
    data: { 
      quantidade: { 
        decrement: parseInt(realocacaoData.quantidade_realocada) 
      }
    }
  });
  
  return realocacao;
};

// Atualizar realocação com verificação de propriedade
exports.updateRealocacaoService = async (id, realocacaoData, ongId) => {
  // Verificar propriedade
  const realocacao = await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: parseInt(id) }
  });
  
  if (!realocacao) {
    throw new Error('Realocação não encontrada');
  }
  
  if (realocacao.ong_origem_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta realocação');
  }
  
  return await prisma.realocacoes_produto.update({
    where: { id_realocacao: parseInt(id) },
    data: {
      observacoes: realocacaoData.observacoes,
      quantidade_realocada: parseInt(realocacaoData.quantidade_realocada)
    }
  });
};

// Deletar realocação com verificação de propriedade
exports.deleteRealocacaoService = async (id, ongId) => {
  // Verificar propriedade
  const realocacao = await prisma.realocacoes_produto.findUnique({
    where: { id_realocacao: parseInt(id) }
  });
  
  if (!realocacao) {
    throw new Error('Realocação não encontrada');
  }
  
  if (realocacao.ong_origem_id !== ongId) {
    throw new Error('Você não tem permissão para deletar esta realocação');
  }
  
  // Restaurar a quantidade no produto antes de deletar
  await prisma.produtos.update({
    where: { id_produto: realocacao.produto_id },
    data: { 
      quantidade: { 
        increment: realocacao.quantidade_realocada 
      }
    }
  });
  
  return await prisma.realocacoes_produto.delete({
    where: { id_realocacao: parseInt(id) }
  });
};