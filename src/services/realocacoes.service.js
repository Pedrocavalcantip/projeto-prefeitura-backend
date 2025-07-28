const prisma = require('../config/database.js');
const { validarRealocacao, validarCamposComuns } = require('./validacao.service.js');
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
          logo_url: true
        }
      }
    },
    orderBy: {
      criado_em: 'asc'   // <--- CORRIGIDO aqui (era 'cresc')
    }
  });
};


// Buscar realocação específica por ID (Get /realocacoes/catalogo/:id)
exports.findCatalogoByIdService = async (id) => {
  const idNumerico = parseInt(id);

  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw new Error('ID deve ser um número válido maior que zero');
  }

  const produto = await prisma.produtos.findFirst({
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
      criado_em: 'desc'   // <-- aqui estava ok, não precisa mudar
    }
  });
};

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
      finalizado_em: true
    },
    orderBy: {
      finalizado_em: 'desc'  // <-- aqui estava ok, não precisa mudar
    }
  });
};

// Criar realocação
exports.createRealocacaoService = async (realocacaoData, ongId) => {
  validarRealocacao(realocacaoData, 'criar');
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
      prazo_necessidade: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'ATIVA',
      finalidade: 'REALOCACAO',
      ong_id: ongId
      // Sem urgencia  para realocações
    }
  });

  return {
    ...nova
  };
};

// Atualizar realocação (PUT)
exports.updateRealocacaoService = async (id, data, ongId) => {
  const idNumerico = parseInt(id, 10);
  if (isNaN(idNumerico) || idNumerico <= 0) {
    throw { status: 400, message: 'ID deve ser um número válido maior que zero' };
  }

  const realocacao = await prisma.produtos.findUnique({ where: { id_produto: idNumerico } });
  if (!realocacao) throw { status: 404, message: 'Realocação não encontrada' };
  if (realocacao.ong_id !== ongId) throw { status: 403, message: 'Você não tem permissão para modificar esta realocação' };

  validarRealocacao(data);


  const atualizada = await prisma.produtos.update({
    where: { id_produto: idNumerico },
    data: {
      titulo: data.titulo,
      descricao: data.descricao,
      tipo_item: data.tipo_item,
      url_imagem: data.url_imagem,
      whatsapp: data.whatsapp,
      email: data.email,
      ...(data.quantidade !== undefined && { quantidade: parseInt(data.quantidade, 10) }),
    }
  });

  return atualizada;
};


// Finalizar realocação (PATCH)
exports.finalizarRealocacaoService = async (id, ongId) => {
  const idNum = parseInt(id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    throw { status: 400, message: 'ID deve ser um número válido maior que zero' };
  }

  const produto = await prisma.produtos.findUnique({ where: { id_produto: idNum } });
  if (!produto) throw { status: 404, message: 'Realocação não encontrada' };
  if (produto.ong_id !== ongId) throw { status: 403, message: 'Você não tem permissão para modificar esta realocação' };

  const atualizado = await prisma.produtos.update({
    where: { id_produto: idNum },
    data: {
      status: 'FINALIZADA',
      finalizado_em: new Date()
    }
  });

  return atualizado;
};


//Finalizar realocações ativas com mais de 60 dias
exports.finalizarRealocacoesAntigas = async () => {
  const hoje = new Date();

  const resultado = await prisma.produtos.updateMany({
    where: {
      status: 'ATIVA',
      finalidade: 'REALOCACAO',
      prazo_necessidade: { lt: hoje }
    },
    data: {
      status: 'FINALIZADA',
      finalizado_em: hoje
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