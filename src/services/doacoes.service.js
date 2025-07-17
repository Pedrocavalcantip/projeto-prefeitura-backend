const prisma = require('../config/database');

// Listar todas as doações públicas (apenas doações ativas)
exports.findAllDoacoesService = async () => {
  return await prisma.produtos.findMany({
    where: {
      status: 'ATIVA',
      finalidade: 'DOACAO'
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      urgencia: true,
      quantidade: true,
      url_imagem: true,
      prazo_necessidade: true,
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

// Buscar doação específica
exports.findByIdDoacaoService = async (id) => {
  const produto = await prisma.produtos.findUnique({
    where: { id_produto: parseInt(id) },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      urgencia: true,
      quantidade: true,
      status: true,
      finalidade: true,
      url_imagem: true,
      prazo_necessidade: true,
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
    throw new Error('Doação não encontrada');
  }
  
  return produto;
};

// Criar doação
exports.createDoacaoService = async (doacaoData, ongId) => {
  return await prisma.produtos.create({
    data: {
      titulo: doacaoData.titulo,
      descricao: doacaoData.descricao,
      tipo_item: doacaoData.tipo_item,
      prazo_necessidade: doacaoData.prazo_necessidade,
      url_imagem: doacaoData.url_imagem,
      urgencia: doacaoData.urgencia || 'MEDIA',
      quantidade: doacaoData.quantidade || 1,
      status: 'ATIVA',
      finalidade: 'DOACAO',
      ong_id: ongId
    }
  });
};

// Atualizar doação com verificação de propriedade
exports.updateDoacaoService = async (id, doacaoData, ongId) => {
  // Verificar se a doação existe e se pertence à ONG
  const doacao = await prisma.produtos.findUnique({
    where: { id_produto: parseInt(id) }
  });
  
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  
  if (doacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta doação');
  }
  
  return await prisma.produtos.update({
    where: { id_produto: parseInt(id) },
    data: {
      titulo: doacaoData.titulo,
      descricao: doacaoData.descricao,
      tipo_item: doacaoData.tipo_item,
      prazo_necessidade: doacaoData.prazo_necessidade,
      url_imagem: doacaoData.url_imagem,
      urgencia: doacaoData.urgencia,
      quantidade: doacaoData.quantidade
    }
  });
};

// Nova função: Atualizar apenas o status
exports.updateStatusDoacaoService = async (id, newStatus, ongId) => {
  // Verificar propriedade
  const doacao = await prisma.produtos.findUnique({
    where: { id_produto: parseInt(id) }
  });
  
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  
  if (doacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta doação');
  }
  
  return await prisma.produtos.update({
    where: { id_produto: parseInt(id) },
    data: { status: newStatus }
  });
};

// Deletar doação com verificação de propriedade
exports.deleteDoacaoService = async (id, ongId) => {
  // Verificar propriedade
  const doacao = await prisma.produtos.findUnique({
    where: { id_produto: parseInt(id) }
  });
  
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  
  if (doacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para deletar esta doação');
  }
  
  return await prisma.produtos.delete({
    where: { id_produto: parseInt(id) }
  });
};
