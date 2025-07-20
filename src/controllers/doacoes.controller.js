const doacoesService = require('../services/doacoes.service');
const { validateToken } = require('../utils/tokenUtils');

// Listar todas as doações OU doações da ONG (com query ?minha=true)
const findAll = async (req, res) => {
  try {
    const { minha, tipo_item } = req.query;

    // Validação de tipo_item (categorias padronizadas) no filtro público
    if (tipo_item !== undefined) {
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
      if (!categoriasValidas.includes(tipo_item)) {
        return res.status(400).json({ message: "tipo_item deve ser uma das categorias válidas." });
      }
    }

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
    // Se não tem query 'minha=true':
    const filtros = {
      titulo: req.query.titulo,
      tipo_item: req.query.tipo_item
    };

    // Caso padrão: marketplace público, com filtros opcionais
    const doacoes = await doacoesService.findAllDoacoesService(filtros);
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
    if (!categoriasValidas.includes(newDoacao.tipo_item)) {
      return res.status(400).json({ message: "tipo_item deve ser uma das categorias válidas." });
    }


    // Validação de todos os campos obrigatórios
    const obrigatorios = [
      { campo: 'titulo', valor: newDoacao.titulo },
      { campo: 'descricao', valor: newDoacao.descricao },
      { campo: 'tipo_item', valor: newDoacao.tipo_item },
      { campo: 'prazo_necessidade', valor: newDoacao.prazo_necessidade },
      { campo: 'url_imagem', valor: newDoacao.url_imagem },
      { campo: 'urgencia', valor: newDoacao.urgencia },
      { campo: 'whatsapp', valor: newDoacao.whatsapp },
      { campo: 'email', valor: newDoacao.email }
    ];

    for (const { campo, valor } of obrigatorios) {
      if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
        return res.status(400).json({ message: `Campo obrigatório '${campo}' está ausente ou vazio.` });
      }
    }

    // Validação de urgencia (enum)
    const urgenciasValidas = ['BAIXA', 'MEDIA', 'ALTA'];
    if (!urgenciasValidas.includes(newDoacao.urgencia)) {
      return res.status(400).json({ message: "Urgência deve ser BAIXA, MEDIA ou ALTA." });
    }

    // Validação de url_imagem (formato simples)
    const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
    if (!urlRegex.test(newDoacao.url_imagem)) {
      return res.status(400).json({ message: "url_imagem deve ser uma URL válida." });
    }

    // Validação de email (formato)
    const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newDoacao.email)) {
      return res.status(400).json({ message: "Email deve ser válido." });
    }

    // Validação de whatsapp (formato simples, só números, 10-13 dígitos)
    const whatsappRegex = /^\d{10,13}$/;
    if (!whatsappRegex.test(newDoacao.whatsapp)) {
      return res.status(400).json({ message: "Whatsapp deve conter apenas números (10 a 13 dígitos)." });
    }

    // Validação de quantidade (deve ser válida)
    if (isNaN(newDoacao.quantidade) || newDoacao.quantidade <= 0) {
      return res.status(400).json({ message: 'Quantidade deve ser um número maior que zero.' });
    }

    const doacaoCriada = await doacoesService.createDoacaoService(newDoacao, ongId);
    res.status(201).json(doacaoCriada);
  } catch (error) {
    console.log('Erro ao criar doação:', error);
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

    // Validação de corpo vazio
    if (!doacaoEditada || Object.keys(doacaoEditada).length === 0) {
      return res.status(400).json({ message: 'Corpo da requisição não pode estar vazio.' });
    }

    // Validação dos campos obrigatórios (exceto quantidade)
    const obrigatorios = [
      { campo: 'titulo', valor: doacaoEditada.titulo },
      { campo: 'descricao', valor: doacaoEditada.descricao },
      { campo: 'tipo_item', valor: doacaoEditada.tipo_item },
      { campo: 'prazo_necessidade', valor: doacaoEditada.prazo_necessidade },
      { campo: 'url_imagem', valor: doacaoEditada.url_imagem },
      { campo: 'urgencia', valor: doacaoEditada.urgencia },
      { campo: 'whatsapp', valor: doacaoEditada.whatsapp },
      { campo: 'email', valor: doacaoEditada.email }
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
    if (!categoriasValidas.includes(doacaoEditada.tipo_item)) {
      return res.status(400).json({ message: "tipo_item deve ser uma das categorias válidas." });
    }

    // Validação de urgencia (enum)
    const urgenciasValidas = ['BAIXA', 'MEDIA', 'ALTA'];
    if (!urgenciasValidas.includes(doacaoEditada.urgencia)) {
      return res.status(400).json({ message: "Urgência deve ser BAIXA, MEDIA ou ALTA." });
    }

    // Validação de url_imagem (formato simples)
    const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[\/#?]?.*$/;
    if (!urlRegex.test(doacaoEditada.url_imagem)) {
      return res.status(400).json({ message: "url_imagem deve ser uma URL válida." });
    }

    // Validação de email (formato)
    const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(doacaoEditada.email)) {
      return res.status(400).json({ message: "Email deve ser válido." });
    }

    // Validação de whatsapp (formato simples, só números, 10-13 dígitos)
    const whatsappRegex = /^\d{10,13}$/;
    if (!whatsappRegex.test(doacaoEditada.whatsapp)) {
      return res.status(400).json({ message: "Whatsapp deve conter apenas números (10 a 13 dígitos)." });
    }

    // Validação de quantidade (se enviada)
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
    const statusPermitidos = ['ATIVA', 'FINALIZADA'];
    if (!status || !statusPermitidos.includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use ATIVA ou FINALIZADA.' });
    }

    // Buscar doação atual para validação de regras de negócio
    const doacaoAtual = await doacoesService.findByIdDoacaoService(id);
    if (!doacaoAtual) {
      return res.status(404).json({ message: 'Doação não encontrada.' });
    }

    // Bloquear alteração para o mesmo status
    if (doacaoAtual.status === status) {
      return res.status(400).json({ message: `A doação já está com o status '${status}'.` });
    }

    // Bloquear alteração se já estiver FINALIZADA
    if (doacaoAtual.status === 'FINALIZADA') {
      return res.status(400).json({ message: 'Doação FINALIZADA não pode ser modificada.' });
    }

    try {
      const doacaoAtualizada = await doacoesService.updateStatusDoacaoService(id, status, ongId);
      res.status(200).json(doacaoAtualizada);
    } catch (serviceError) {
      // Se o erro for da regra de negócio do status ATIVA, retorna 400
      if (serviceError.message.includes('Só é possível atualizar o status se a doação estiver ATIVA')) {
        return res.status(400).json({ message: serviceError.message });
      }
      throw serviceError;
    }
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