const doacoesService = require('../services/doacoes.service');
const { validateToken } = require('../utils/tokenUtils');

// Listar todas as doações OU doações da ONG (com query ?minha=true)
const findAll = async (req, res) => {
  try {
    const { minha } = req.query;
    
    // Se tem query 'minha=true' e token de autorização
    if (minha === 'true') {
      const tokenValidation = validateToken(req.headers.authorization);
      
      if (!tokenValidation.valid) {
        return res.status(401).json({ message: tokenValidation.error });
      }
      
      const ongId = tokenValidation.decoded.id_ong;
      const doacoes = await doacoesService.findDoacoesDaOngService(ongId);
      return res.status(200).json(doacoes);
    }
    
    // Caso padrão: marketplace público
    const doacoes = await doacoesService.findAllDoacoesService();
    res.status(200).json(doacoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Buscar doação por ID
const findById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }
    
    const doacao = await doacoesService.findByIdDoacaoService(id);
    res.status(200).json(doacao);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Criar nova doação
const create = async (req, res) => {
  try {
    const newDoacao = req.body;
    const ongId = req.id_ong;

    // Validação básica
    if (!newDoacao.titulo || !newDoacao.descricao || !newDoacao.tipo_item) {
      return res.status(400).json({ message: 'Dados incompletos. Título, descrição e tipo de item são obrigatórios.' });
    }

    // Validação adicional de campos vazios ou apenas espaços
    if (newDoacao.titulo.trim() === '' || newDoacao.descricao.trim() === '' || newDoacao.tipo_item.trim() === '') {
      return res.status(400).json({ message: 'Título, descrição e tipo de item não podem estar vazios.' });
    }

    // Validação de quantidade (se fornecida, deve ser válida)
    if (newDoacao.quantidade && (isNaN(newDoacao.quantidade) || newDoacao.quantidade <= 0)) {
      return res.status(400).json({ message: 'Quantidade deve ser um número maior que zero.' });
    }

    const doacaoCriada = await doacoesService.createDoacaoService(newDoacao, ongId);
    res.status(201).json(doacaoCriada);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Atualizar doação
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const doacaoEditada = req.body;
    const ongId = req.id_ong;

    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    // Validação de dados inválidos
    if (doacaoEditada.titulo !== undefined && doacaoEditada.titulo.trim() === '') {
      return res.status(400).json({ message: 'Título não pode estar vazio.' });
    }
    
    if (doacaoEditada.descricao !== undefined && doacaoEditada.descricao.trim() === '') {
      return res.status(400).json({ message: 'Descrição não pode estar vazia.' });
    }
    
    if (doacaoEditada.tipo_item !== undefined && doacaoEditada.tipo_item.trim() === '') {
      return res.status(400).json({ message: 'Tipo do item não pode estar vazio.' });
    }
    
    if (doacaoEditada.quantidade !== undefined && (isNaN(doacaoEditada.quantidade) || doacaoEditada.quantidade <= 0)) {
      return res.status(400).json({ message: 'Quantidade deve ser um número maior que zero.' });
    }

    const doacaoAtualizada = await doacoesService.updateDoacaoService(id, doacaoEditada, ongId);
    res.status(200).json(doacaoAtualizada);
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

// Nova função: Atualizar status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const ongId = req.id_ong;

    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    // Validação básica do status
    if (!status || !['ATIVA', 'FINALIZADA'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use ATIVA ou FINALIZADA.' });
    }

    const doacaoAtualizada = await doacoesService.updateStatusDoacaoService(id, status, ongId);
    res.status(200).json(doacaoAtualizada);
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

// Deletar doação
const deleteDoacao = async (req, res) => {
  try {
    const { id } = req.params;
    const ongId = req.id_ong;

    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    await doacoesService.deleteDoacaoService(id, ongId);
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
  deleteDoacao,
};