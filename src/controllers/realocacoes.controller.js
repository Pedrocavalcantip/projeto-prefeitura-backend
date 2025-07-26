const realocacoesService = require('../services/realocacoes.service.js');
const { getImageData } = require('../utils/imageUtils.js');

// Buscar catálogo geral de realocações (Get /realocacoes/catalogo)
const findCatalogo = async (req, res) => {
  try {
    if (!req.id_ong) {
      return res.status(401).json({ message: 'Apenas ONGs podem acessar esta rota.' });
    }
    const ongId = req.id_ong;

    // Catálogo geral para ONGs, com filtros opcionais
    const filtros = {
      titulo: req.query.titulo,
      tipo_item: req.query.tipo_item
    };

    const realocacoes = await realocacoesService.findCatalogoService(filtros);
    res.status(200).json(realocacoes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Buscar realocação específica (GET /realocacoes/catalogo/:id)
const findCatalogoById = async (req, res) => {
  try {
    if (!req.id_ong) {
      return res.status(401).json({ message: 'Apenas ONGs podem acessar esta rota.' });
    }
    const { id } = req.params;

    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    const realocacao = await realocacoesService.findCatalogoByIdService(id);
    res.status(200).json(realocacao);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /realocacoes/minhas/ativas
const findMinhasAtivas = async (req, res) => {
  try {
    const ongId = req.id_ong;
    const lista = await realocacoesService.findMinhasRealocacoesAtivasService(ongId);
    return res.status(200).json(lista);
  } catch (err) {
    console.error('findMinhasAtivas:', err);
    return res.status(500).json({ message: 'Erro interno ao listar realocações ativas.' });
  }
};

// GET /realocacoes/minhas/finalizadas
const findMinhasFinalizadas = async (req, res) => {
  try {
    const ongId = req.id_ong;
    const lista = await realocacoesService.findMinhasRealocacoesFinalizadasService(ongId);
    return res.status(200).json(lista);
  } catch (err) {
    console.error('findMinhasFinalizadas:', err);
    return res.status(500).json({ message: 'Erro interno ao listar realocações finalizadas.' });
  }
};

// Criar nova realocação (POST /realocacoes)
const create = async (req, res) => {
  try {
    const ongId = req.id_ong;

    const imgData = getImageData(req);
    if (!imgData) {
      return res.status(400).json({ message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    }

    const dados = { ...req.body, url_imagem: imgData.url };
    const validacao = validarDadosRealocacao(dados);
    if (!validacao.valido) {
      return res.status(400).json({ message: validacao.mensagem });
    }

    const criada = await realocacoesService.createRealocacaoService(dados, ongId);
    return res.status(201).json(criada);
  } catch (error) {
    console.error('Erro ao criar realocação:', error);
    return res.status(500).json({ message: 'Erro interno ao criar realocação.' });
  }
};

/// Atualizar realocação (PUT /realocacoes/:id)
const update = async (req, res) => {
  try {
    const ongId = req.id_ong;
    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ message: 'ID inválido.' });
    }

    const imgData = getImageData(req);
    if (!imgData) {
      return res.status(400).json({ message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    }

    const dados = { ...req.body, url_imagem: imgData.url };
    const validacao = validarDadosRealocacao(dados);
    if (!validacao.valido) {
      return res.status(400).json({ message: validacao.mensagem });
    }

    const atualizada = await realocacoesService.updateRealocacaoService(idNum, dados, ongId);
    return res.status(200).json(atualizada);
  } catch (error) {
    console.error('Erro ao atualizar realocação:', error);
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno ao atualizar realocação.' });
  }
};

// Atualizar status da realocação
const updateStatus = async (req, res) => {
  try {
    if (!req.id_ong) {
      return res.status(401).json({ message: 'Apenas ONGs podem acessar esta rota.' });
    }
    const { id } = req.params;
    const { status } = req.body;
    const ongId = req.id_ong;

    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    if (!status || !['ATIVA', 'FINALIZADA'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use ATIVA ou FINALIZADA.' });
    }

    const realocacaoAtualizada = await realocacoesService.updateStatusRealocacaoService(id, status, ongId);
    res.status(200).json(realocacaoAtualizada);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Finalizar realocações antigas
const finalizarRealocacoesAntigas = async (req, res) => {
  try {
      const ids = await realocacoesService.finalizarRealocacoesAntigas();
      return res.status(200).json({
        message: 'Realocações antigas finalizadas com sucesso.',
        idsFinalizadas: ids
      });
    } catch (error) {
      console.error('Erro em finalizarRealocacoesAntigas:', error);
      return res
        .status(500)
        .json({ message: 'Erro interno ao finalizar realocações antigas.' });
    }
  };

// Deletar realocação
const deleteRealocacao = async (req, res) => {
  try {
    if (!req.id_ong) {
      return res.status(401).json({ message: 'Apenas ONGs podem acessar esta rota.' });
    }
    const { id } = req.params;
    const ongId = req.id_ong;

    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    await realocacoesService.deleteRealocacaoService(id, ongId);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const limparRealocacoesExpiradas = async (req, res) => {
   {
    try {
      const resultado = await realocacoesService.limparRealocacoesExpiradas(true);
      return res.status(200).json({
        message: 'Limpeza de realocações expiradas realizada com sucesso.',
        detalhes: resultado
      });
    } catch (error) {
      console.error('Erro em limparRealocacoesExpiradas:', error);
      return res
        .status(500)
        .json({ message: 'Erro interno ao limpar realocações expiradas.' });
    }
  };
}


module.exports = {
  findCatalogo,
  findCatalogoById,
  findMinhasAtivas,
  findMinhasFinalizadas,
  create,
  update,
  updateStatus,
  finalizarRealocacoesAntigas,
  deleteRealocacao,
  limparRealocacoesExpiradas
};
