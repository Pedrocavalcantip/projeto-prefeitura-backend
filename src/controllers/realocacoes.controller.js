const realocacoesService = require('../services/realocacoes.service');

// Listar todas as realocações (API pública - marketplace) OU realocações da ONG (com query ?minha=true)
const findAll = async (req, res) => {
  try {
    const { minha } = req.query;
    
    // Se tem query 'minha=true' e token de autorização
    if (minha === 'true') {
      // Verificar se tem token (middleware não é obrigatório nesta rota)
      if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Token de autorização necessário para listar suas realocações.' });
      }
      
      // Simular verificação do middleware manualmente
      const jwt = require('jsonwebtoken');
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const ongId = decoded.id_ong;
        
        const realocacoes = await realocacoesService.findRealocacoesDaOngService(ongId);
        return res.status(200).json(realocacoes);
      } catch (error) {
        return res.status(401).json({ message: 'Token inválido.' });
      }
    }
    
    // Caso padrão: marketplace público
    const realocacoes = await realocacoesService.findAllRealocacoesService();
    res.status(200).json(realocacoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Buscar realocação por ID (API pública)
const findById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validação se ID é numérico
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

// Listar realocações da ONG logada (API privada)
const findMy = async (req, res) => {
  try {
    const ongId = req.id_ong;
    const realocacoes = await realocacoesService.findRealocacoesDaOngService(ongId);
    res.status(200).json(realocacoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Criar nova realocação
const create = async (req, res) => {
  try {
    const newRealocacao = req.body;
    const ongId = req.id_ong;

    // Validação básica
    if (!newRealocacao.titulo || !newRealocacao.descricao || !newRealocacao.tipo_item) {
      return res.status(400).json({ message: 'Dados incompletos. Título, descrição e tipo de item são obrigatórios.' });
    }

    // Validação adicional de campos vazios ou apenas espaços
    if (newRealocacao.titulo.trim() === '' || newRealocacao.descricao.trim() === '' || newRealocacao.tipo_item.trim() === '') {
      return res.status(400).json({ message: 'Título, descrição e tipo de item não podem estar vazios.' });
    }

    // Validação de quantidade (se fornecida, deve ser válida)
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

    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    const realocacaoAtualizada = await realocacoesService.updateRealocacaoService(id, realocacaoEditada, ongId);
    res.status(200).json(realocacaoAtualizada);
  } catch (error) {
    if (error.message.includes('não encontrada') || error.message.includes('permissão')) {
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

    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    // Validação básica do status
    if (!status || !['ATIVA', 'FINALIZADA'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use ATIVA ou FINALIZADA.' });
    }

    const realocacaoAtualizada = await realocacoesService.updateStatusRealocacaoService(id, status, ongId);
    res.status(200).json(realocacaoAtualizada);
  } catch (error) {
    if (error.message.includes('não encontrada') || error.message.includes('permissão')) {
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

    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    await realocacoesService.deleteRealocacaoService(id, ongId);
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
  updateStatus,
  deleteRealocacao,
};