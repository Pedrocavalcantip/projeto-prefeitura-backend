const prisma = require('../config/database');

// Listar todas as doações públicas (apenas doações ativas)
exports.findAllDoacoesService = async (filtros = {}) => {
  const { titulo, tipo_item, ordenarPorUrgencia } = filtros;

  return await prisma.produtos.findMany({
    where: {
      status: 'ATIVA',
      finalidade: 'DOACAO',
      ...(titulo && {
        titulo: {
          contains: titulo,
          mode: 'insensitive'
        }
      }),
      ...(tipo_item && {
        tipo_item: {
          equals: tipo_item,
          mode: 'insensitive'
        }
      })
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      urgencia: true,
      quantidade: true,
      status: true,             // ← Adicionado para o teste verificar
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
    orderBy: ordenarPorUrgencia
      ? {
          // Prisma usa enum: ALTA, MEDIA, BAIXA → ordenação correta exige enum customizado ou mapeamento no front
          urgencia: ordenarPorUrgencia === 'asc' ? 'asc' : 'desc'
        }
      : {
          criado_em: 'desc'
        }
  });
};


// Nova função: Listar doações da ONG logada (com dados completos)
exports.findDoacoesDaOngService = async (ongId) => {
  return await prisma.produtos.findMany({
    where: {
      ong_id: ongId,
      finalidade: 'DOACAO'
    },
    select: {
      id_produto: true,
      titulo: true,
      descricao: true,
      tipo_item: true,
      urgencia: true,
      quantidade: true,      // ← Só a ONG dona vê
      status: true,          // ← Só a ONG dona vê
      ong_id: true,          // ← Adicionado para o teste verificar
      url_imagem: true,
      prazo_necessidade: true,
      criado_em: true
    },
    orderBy: {
      criado_em: 'desc'
    }
  });
};

// Buscar doação específica (visualização pública)
exports.findByIdDoacaoService = async (id) => {
  const idNumerico = parseInt(id);
  
  // Validação extra no service
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const produto = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'DOACAO' // Garantir que é uma doação
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
  // Converter data para ISO DateTime se fornecida
  let prazoNecessidade = null;
  if (doacaoData.prazo_necessidade) {
    // Se a data está em formato YYYY-MM-DD, converter para DateTime
    const dataString = doacaoData.prazo_necessidade;
    if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      prazoNecessidade = new Date(dataString + 'T23:59:59.000Z').toISOString();
    } else {
      prazoNecessidade = new Date(dataString).toISOString();
    }
  }
  
  return await prisma.produtos.create({
    data: {
      titulo: doacaoData.titulo,
      descricao: doacaoData.descricao,
      tipo_item: doacaoData.tipo_item,
      prazo_necessidade: prazoNecessidade,
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
  const idNumerico = parseInt(id);
  
  // Validação do ID
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  // Verificar se a doação existe e se pertence à ONG
  const doacao = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'DOACAO' // Garantir que é uma doação
    }
  });
  
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  
  if (doacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para atualizar esta doação');
  }
  
  return await prisma.produtos.update({
    where: { id_produto: idNumerico },
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
  const idNumerico = parseInt(id);
  
  // Validação do ID
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }
  // Validação do status
  // Só permitir as duas transições possíveis:
  if (!['ATIVA', 'FINALIZADA'].includes(newStatus)) {
    throw new Error('Status inválido. Use apenas ATIVA ou FINALIZADA');
  }

  // Verificar propriedade
  const doacao = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'DOACAO' // Garantir que é uma doação
    }
  });
  
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  
  if (doacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta doação');
  }
  
  return await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: { status: newStatus }
  });
};

// Deletar doação com verificação de propriedade
exports.deleteDoacaoService = async (id, ongId) => {
  const idNumerico = parseInt(id);
  
  // Validação do ID
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  // Verificar propriedade
  const doacao = await prisma.produtos.findUnique({
    where: { 
      id_produto: idNumerico,
      finalidade: 'DOACAO' // Garantir que é uma doação
    }
  });
  
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  
  if (doacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para deletar esta doação');
  }
  
  return await prisma.produtos.delete({
    where: { id_produto: idNumerico }
  });
};
