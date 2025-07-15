const service = require('../services/realocacoes.service');

// Buscar todas as realocações
const findAll = async (req, res) => {
  try {
    const filtros = req.query;
    const lista = await service.findAllService(filtros);
    res.status(200).json(lista);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
};

// Buscar realocação por ID
const findById = async (req, res) => {
  try {
    const realocacao = await service.findByIdService(req.params.id);
    if (!realocacao) return res.status(404).json({ erro: 'Realocação não encontrada' });
    res.status(200).json(realocacao);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
};

// Criar nova realocação
const create = async (req, res) => {
  try {
    const ongId = req.id_ong;
    const nova = await service.createService(req.body, ongId);
    res.status(201).json(nova);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
};

// Atualizar realocação existente
const update = async (req, res) => {
  try {
    const ongId = req.id_ong;
    const atualizada = await service.updateService(req.params.id, req.body, ongId);
    res.status(200).json(atualizada);
  } catch (e) {
    if (e.message.includes('permissão')) {
      return res.status(403).json({ erro: e.message });
    }
    res.status(500).json({ erro: e.message });
  }
};

// Deletar uma realocação
const deleteRealocacao = async (req, res) => {
  try {
    const ongId = req.id_ong;
    await service.deleteService(req.params.id, ongId);
    res.status(204).send();
  } catch (e) {
    if (e.message.includes('permissão')) {
      return res.status(403).json({ erro: e.message });
    }
    res.status(500).json({ erro: e.message });
  }
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteRealocacao,
};
