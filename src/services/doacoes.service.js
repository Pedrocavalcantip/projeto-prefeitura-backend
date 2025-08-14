const prisma = require('../config/database');
const { validarDoacao } = require('./validacao.service');
// Listar todas as doações públicas (apenas doações ativas)

exports.findAllDoacoesService = async (filtros = {}) => {
  const { titulo, tipo_item } = filtros;

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
      status: true,
      url_imagem: true,
      prazo_necessidade: true,
      criado_em: true,
      whatsapp: true,
      email: true,
      ong: {
        select: {
          nome: true,
          logo_url: true,
        }
      }
    },
    orderBy: [
      { urgencia: 'desc' },            
      { prazo_necessidade: 'asc' }     
    ]
  });
};


exports.findDoacoesPrestesAVencerService = async () => {
  return await prisma.produtos.findMany({
    where: {
      status: 'ATIVA',
      finalidade: 'DOACAO',
      prazo_necessidade: {
        lte: new Date(new Date().setDate(new Date().getDate() + 15)) // Vence em até 15 dias
      }
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
      prazo_necessidade: true,
      criado_em: true,
      whatsapp: true,
      email: true,
      ong: {
        select: {
          nome: true,
          logo_url: true
        }
      }
    },
    orderBy: {
      prazo_necessidade: 'asc' // Os que vencem primeiro aparecem primeiro
    }
  });
};

// Seleciona doações ATIVAS da ONG
exports.findMinhasDoacoesAtivasService = async (ongId) => {
  return await prisma.produtos.findMany({
    where: {
      ong_id:    ongId,
      finalidade:'DOACAO',
      status:    'ATIVA'
    },
    select: {
      id_produto:       true,
      titulo:           true,
      descricao:        true,
      tipo_item:        true,
      urgencia:         true,
      quantidade:       true,
      status:           true,
      url_imagem:       true,
      prazo_necessidade:true,
      criado_em:        true,
      whatsapp: true,
      email: true,
      ong: {
        select: {
          nome:     true,
          logo_url: true,
        }
      }
    },
    orderBy: {
      criado_em: 'desc'
    }
  });
};

// Seleciona doações FINALIZADAS da ONG
exports.findMinhasDoacoesFinalizadasService = async (ongId) => {
  return await prisma.produtos.findMany({
    where: {
      ong_id:    ongId,
      finalidade:'DOACAO',
      status:    'FINALIZADA'
    },
    select: {
      id_produto:       true,
      titulo:           true,
      descricao:        true,
      tipo_item:        true,
      urgencia:         true,
      quantidade:       true,
      status:           true,
      url_imagem:       true,
      criado_em:        true,
      finalizado_em:    true, 
      whatsapp:         true,
      email:            true,
      ong: {
        select: {
          nome:     true,
          logo_url: true,
        }
      }
    },
    orderBy: {
      finalizado_em: 'desc'
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
      id_produto: true, //importante para o filtro frontend
      status: true,     //apenas para o teste
      titulo: true,
      descricao: true,
      tipo_item: true,
      urgencia: true,
      quantidade: true,
      url_imagem: true,
      prazo_necessidade: true,
      criado_em: true,
      whatsapp: true,
      email: true,
      ong_id: true, 
      ong: {
        select: {
          nome: true,
          logo_url: true,
        }
      }
    }
  });
  
  if (!produto) {
    throw new Error('Doação não encontrada');
  }
  
  return produto;
};

exports.createDoacaoService = async (doacaoData, ongId) => {
  const ong = await prisma.ongs.findUnique({ where: { id_ong: ongId } });
  if (!ong) {
    throw new Error('ONG não encontrada.');
  }
  validarDoacao(doacaoData);

  let prazoNecessidade = null;

  if (doacaoData.dias_validade) {
    // Se vier dias_validade, calcula a data futura
    const diasValidade = parseInt(doacaoData.dias_validade, 10);
    if (diasValidade > 0) {
      const dataFinal = new Date();
      dataFinal.setDate(dataFinal.getDate() + diasValidade);
      dataFinal.setHours(23, 59, 59, 999); // fim do dia
      prazoNecessidade = dataFinal.toISOString().slice(0, 10); // só a data
    }
  } else if (doacaoData.prazo_necessidade) {
    // Se vier prazo_necessidade, usa direto
    prazoNecessidade = new Date(doacaoData.prazo_necessidade);
  }

  const quantidade = parseInt(doacaoData.quantidade || '1', 10);

  return await prisma.produtos.create({
    data: {
      titulo:            doacaoData.titulo,
      descricao:         doacaoData.descricao,
      tipo_item:         doacaoData.tipo_item,
      criado_em:         new Date(),
      prazo_necessidade: prazoNecessidade,
      url_imagem:        doacaoData.url_imagem,
      urgencia:          doacaoData.urgencia || 'MEDIA',
      quantidade,
      status:            'ATIVA',
      finalidade:        'DOACAO',
      email:             doacaoData.email,
      whatsapp:          doacaoData.whatsapp,
      ong_id:            ongId
    }
  });
};

// Atualizar doação com verificação de propriedade
exports.updateDoacaoService = async (id, doacaoData, ongId) => {
  validarDoacao(doacaoData);

  const idNumerico = parseInt(id, 10);
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const doacao = await prisma.produtos.findUnique({
    where: { id_produto: idNumerico }
  });
  if (!doacao) {
    throw new Error('Doação não encontrada');
  }
  if (doacao.ong_id !== ongId) {
    throw new Error('Você não tem permissão para modificar esta doação');
  }

  let prazoNecessidade;

  if (doacaoData.dias_validade && parseInt(doacaoData.dias_validade, 10) > 0) {
    const diasValidade = parseInt(doacaoData.dias_validade, 10);
    const dataFinal = new Date();
    dataFinal.setDate(dataFinal.getDate() + diasValidade);
    dataFinal.setHours(23, 59, 59, 999);
    prazoNecessidade = dataFinal.toISOString(); // <-- ISO completo
  } else if (doacaoData.prazo_necessidade) {
    prazoNecessidade = new Date(doacaoData.prazo_necessidade).toISOString(); // <-- ISO completo
  } else {
    prazoNecessidade = doacao.prazo_necessidade;
  }

  // Converte quantidade se vier definida
  const quantidade = doacaoData.quantidade !== undefined
    ? parseInt(doacaoData.quantidade, 10)
    : undefined;

  return await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: {
      titulo:            doacaoData.titulo,
      descricao:         doacaoData.descricao,
      tipo_item:         doacaoData.tipo_item,
      prazo_necessidade: prazoNecessidade,
      url_imagem:        doacaoData.url_imagem,
      urgencia:          doacaoData.urgencia,
      ...(quantidade !== undefined && { quantidade }),
      email:             doacaoData.email,
      whatsapp:          doacaoData.whatsapp
    }
  });
};

// Atualizar apenas o status
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
  // Só permite atualizar se status atual for ATIVA
  if (doacao.status !== 'ATIVA') {
    throw new Error('Só é possível atualizar o status se a doação estiver ATIVA');
  }
  
  return await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: { status: newStatus,
      ...(newStatus === 'FINALIZADA' && { finalizado_em: new Date() })
    }
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

//clean up
// Limpar doações expiradas (em massa)
function getDataSeisMesesAtras() {
  const data = new Date();
  data.setMonth(data.getMonth() - 6);
  return data;
}

// Finaliza doações vencidas individualmente
exports.finalizarDoacoesVencidas = async (log = false) => {
  const expiradas = await prisma.produtos.findMany({
    where: {
      status: 'ATIVA',
      finalidade: 'DOACAO',
      prazo_necessidade: { lt: new Date() }
    }
  });

  const ids = [];
  for (const doacao of expiradas) {
    // chamar o service exportado, não um identificador local
    await exports.updateStatusDoacaoService(
      doacao.id_produto,
      'FINALIZADA',
      doacao.ong_id
    );
    ids.push(doacao.id_produto);
  }

  if (log) {
    console.log(`✅ ${ids.length} doações finalizadas (individuais):`, ids);
  }
  return ids;
};

// Finaliza e exclui em massa doações expiradas e antigas
exports.limparDoacoesExpiradas = async (log = false) => {
  const seisMesesAtras = getDataSeisMesesAtras();

  // 2) Exclui doações criadas há mais de 6 meses
  const resultadoExcluir = await prisma.produtos.deleteMany({
    where: {
      finalidade: 'DOACAO',
      status: 'FINALIZADA',
      finalizado_em: { lt: seisMesesAtras }
    }
  });

  if (log) {
    console.log(`🗑️ ${resultadoExcluir.count} doações excluídas (antigas)`);
  }

  return {
    totalExcluidas: resultadoExcluir.count
  };
};

