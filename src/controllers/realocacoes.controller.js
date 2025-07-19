const realocacoesService = require('../services/realocacoes.service');

// Listar realocações: catálogo entre ONGs OU realocações da ONG logada
const findAll = async (req, res) => {
  try {
    const { minha } = req.query;
    const ongId = req.id_ong; // ← Vem do authMiddleware (sempre presente)

    // Se quer ver apenas suas próprias realocações
    if (minha === 'true') {
      const realocacoes = await realocacoesService.findRealocacoesDaOngService(ongId);
      return res.status(200).json(realocacoes);
    }

    // Catálogo geral para ONGs (sem filtro de ONG específica)
    const realocacoes = await realocacoesService.findAllRealocacoesService();
    res.status(200).json(realocacoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Buscar realocação específica (ONGs podem ver detalhes para contato)
const findById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    const realocacao = await realocacoesService.findByIdRealocacaoService(id);
    res.status(200).json(realocacao);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Criar nova realocação
const create = async (req, res) => {
  try {
    const newRealocacao = req.body;
    const ongId = req.id_ong;

    if (!newRealocacao.titulo || !newRealocacao.descricao || !newRealocacao.tipo_item) {
      return res.status(400).json({ message: 'Título, descrição e tipo de item não podem estar vazios.' });
    }

    if (
      newRealocacao.titulo.trim() === '' ||
      newRealocacao.descricao.trim() === '' ||
      newRealocacao.tipo_item.trim() === ''
    ) {
      return res.status(400).json({ message: 'Título, descrição e tipo de item não podem estar vazios.' });
    }

    if (newRealocacao.quantidade && (isNaN(newRealocacao.quantidade) || newRealocacao.quantidade <= 0)) {
      return res.status(400).json({ message: 'Quantidade deve ser um número maior que zero.' });
    }

    const realocacaoCriada = await realocacoesService.createRealocacaoService(newRealocacao, ongId);
    res.status(201).json(realocacaoCriada);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Atualizar realocação
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const realocacaoEditada = req.body;
    const ongId = req.id_ong;

    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    if (!realocacaoEditada.titulo || !realocacaoEditada.descricao || !realocacaoEditada.tipo_item) {
      return res.status(400).json({ message: 'Título, descrição e tipo de item são obrigatórios.' });
    }
    if (
      realocacaoEditada.titulo.trim() === '' ||
      realocacaoEditada.descricao.trim() === '' ||
      realocacaoEditada.tipo_item.trim() === ''
    ) {
      return res.status(400).json({ message: 'Título, descrição e tipo de item não podem estar vazios.' });
    }
    const realocacaoAtualizada = await realocacoesService.updateRealocacaoService(id, realocacaoEditada, ongId);
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

// Atualizar status da realocação
const updateStatus = async (req, res) => {
  try {
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

// Deletar realocação
const deleteRealocacao = async (req, res) => {
  try {
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

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateStatus,
  deleteRealocacao,
};
