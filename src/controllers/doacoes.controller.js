const doacoesService = require('../services/doacoes.service.js');

// Controlador para buscar todas as doações
const findAll = async (req, res) => {
  try {
    const doacoes = await doacoesService.findAllDoacoesService();
    res.status(200).json(doacoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para buscar uma doação pelo ID
const findById = async (req, res) => {
  try {
    const { id } = req.params;
    const doacao = await doacoesService.findByIdDoacaoService(id);

    if (!doacao) {
      return res.status(404).json({ message: 'Doação não encontrada.' });
    }

    res.status(200).json(doacao);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para criar uma nova doação
const create = async (req, res) => {
  try {
    const newDoacao = req.body;
    const ongId = req.id_ong; // vem do token

    if (!newDoacao.titulo || !newDoacao.descricao || !newDoacao.tipo_item) {
      return res.status(400).json({ message: 'Dados incompletos. Envie todos os campos obrigatórios.' });
    }

    const doacaoCriada = await doacoesService.createDoacaoService(newDoacao, ongId);
    res.status(201).json(doacaoCriada);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controlador para atualizar uma doação
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const doacaoEditada = req.body;
    const ongId = req.id_ong; // vem do token

    const doacaoAtualizada = await doacoesService.updateDoacaoService(id, doacaoEditada, ongId);
    res.status(200).json(doacaoAtualizada);
  } catch (error) {
    if (error.message.includes('não encontrada') || error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Controlador para deletar uma doação
const deleteDoacao = async (req, res) => {
  try {
    const { id } = req.params;
    const ongId = req.id_ong; // vem do token

    await doacoesService.deleteDoacaoService(id, ongId);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('não encontrada') || error.message.includes('permissão')) {
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
  deleteDoacao,
};
