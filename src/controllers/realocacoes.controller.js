const realocacoesService = require('../services/realocacoes.service');

// Listar realocações: catálogo entre ONGs OU realocações da ONG logada
const findAll = async (req, res) => {
  try {
    if (!req.id_ong) {
      return res.status(401).json({ message: 'Apenas ONGs podem acessar esta rota.' });
    }
    const { minha } = req.query;
    const ongId = req.id_ong;

    // Se quer ver apenas suas próprias realocações
    if (minha === 'true') {
      const realocacoes = await realocacoesService.findRealocacoesDaOngService(ongId);
      return res.status(200).json(realocacoes);
    }

    // Catálogo geral para ONGs, com filtros opcionais
    const filtros = {
      titulo: req.query.titulo,
      tipo_item: req.query.tipo_item
    };
    const realocacoes = await realocacoesService.findAllRealocacoesService(filtros);
    res.status(200).json(realocacoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Buscar realocação específica (ONGs podem ver detalhes para contato)
const findById = async (req, res) => {
  try {
    if (!req.id_ong) {
      return res.status(401).json({ message: 'Apenas ONGs podem acessar esta rota.' });
    }
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

    // Validação de todos os campos obrigatórios
    const obrigatorios = [
      { campo: 'titulo', valor: newRealocacao.titulo },
      { campo: 'descricao', valor: newRealocacao.descricao },
      { campo: 'tipo_item', valor: newRealocacao.tipo_item },
      { campo: 'url_imagem', valor: newRealocacao.url_imagem },
      { campo: 'whatsapp', valor: newRealocacao.whatsapp },
      { campo: 'email', valor: newRealocacao.email }
    ];

    for (const { campo, valor } of obrigatorios) {
      if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
        return res.status(400).json({ message: `Campo obrigatório '${campo}' está ausente ou vazio.` });
      }
    }

    // Validação de tipo_item (categorias padronizadas)
    const categoriasValidas = [
      'Eletrodomésticos e Móveis',
      'Utensílios Gerais',
      'Roupas e Calçados',
      'Saúde e Higiene',
      'Materiais Educativos e Culturais',
      'Itens de Inclusão e Mobilidade',
      'Eletrônicos',
      'Itens Pet',
      'Outros'
    ];
    if (!categoriasValidas.includes(newRealocacao.tipo_item)) {
      return res.status(400).json({ message: "tipo_item deve ser uma das categorias válidas." });
    }

    // Validação de url_imagem (formato simples)
    const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    if (!urlRegex.test(newRealocacao.url_imagem)) {
      return res.status(400).json({ message: "url_imagem deve ser uma URL válida." });
    }

    // Validação de email (formato)
    const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newRealocacao.email)) {
      return res.status(400).json({ message: "Email deve ser válido." });
    }

    // Validação de whatsapp (formato simples, só números, 10-13 dígitos)
    const whatsappRegex = /^\d{10,13}$/;
    if (!whatsappRegex.test(newRealocacao.whatsapp)) {
      return res.status(400).json({ message: "Whatsapp deve conter apenas números (10 a 13 dígitos)." });
    }

    // Validação de quantidade (deve ser válida)
    if (isNaN(newRealocacao.quantidade) || newRealocacao.quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser um número maior que zero.' });
    }

    const realocacaoCriada = await realocacoesService.createRealocacaoService(newRealocacao, ongId);
    res.status(201).json(realocacaoCriada);
  } catch (error) {
    console.log('Erro ao criar realocação:', error);
    res.status(500).json({ message: error.message });
  }
};

/// Atualizar realocação
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const realocacaoEditada = req.body;
    const ongId = req.id_ong;

    // Validação se ID é numérico
    if (isNaN(id) || parseInt(id) <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    // Validação de corpo vazio
    if (!realocacaoEditada || Object.keys(realocacaoEditada).length === 0) {
      return res.status(400).json({ message: 'Corpo da requisição não pode estar vazio.' });
    }

    // Validação dos campos obrigatórios (exceto quantidade)
    const obrigatorios = [
      { campo: 'titulo', valor: realocacaoEditada.titulo },
      { campo: 'descricao', valor: realocacaoEditada.descricao },
      { campo: 'tipo_item', valor: realocacaoEditada.tipo_item },
      { campo: 'url_imagem', valor: realocacaoEditada.url_imagem },
      { campo: 'whatsapp', valor: realocacaoEditada.whatsapp },
      { campo: 'email', valor: realocacaoEditada.email }
    ];
    for (const { campo, valor } of obrigatorios) {
      if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
        return res.status(400).json({ message: `Campo obrigatório '${campo}' está ausente ou vazio.` });
      }
    }

    // Validação de tipo_item (categorias padronizadas)
    const categoriasValidas = [
      'Eletrodomésticos e Móveis',
      'Utensílios Gerais',
      'Roupas e Calçados',
      'Saúde e Higiene',
      'Materiais Educativos e Culturais',
      'Itens de Inclusão e Mobilidade',
      'Eletrônicos',
      'Itens Pet',
      'Outros'
    ];
    if (!categoriasValidas.includes(realocacaoEditada.tipo_item)) {
      return res.status(400).json({ message: "tipo_item deve ser uma das categorias válidas." });
    }

    // Validação de url_imagem (formato simples)
    const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[\/#?]?.*$/;
    if (!urlRegex.test(realocacaoEditada.url_imagem)) {
      return res.status(400).json({ message: "url_imagem deve ser uma URL válida." });
    }

    // Validação de email (formato)
    const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(realocacaoEditada.email)) {
      return res.status(400).json({ message: "Email deve ser válido." });
    }

    // Validação de whatsapp (formato simples, só números, 10-13 dígitos)
    const whatsappRegex = /^\d{10,13}$/;
    if (!whatsappRegex.test(realocacaoEditada.whatsapp)) {
      return res.status(400).json({ message: "Whatsapp deve conter apenas números (10 a 13 dígitos)." });
    }

    // Validação de quantidade (se enviada)
    if (realocacaoEditada.quantidade !== undefined && (isNaN(realocacaoEditada.quantidade) || realocacaoEditada.quantidade <= 0)) {
      return res.status(400).json({ message: 'Quantidade deve ser um número maior que zero.' });
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

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateStatus,
  deleteRealocacao,
};
