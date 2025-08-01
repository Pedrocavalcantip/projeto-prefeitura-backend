const doacoesService = require('../services/doacoes.service.js');
const { validateToken } = require('../utils/tokenUtils.js');
const { getImageData } = require('../utils/imageUtils.js');



/**
 * @swagger
 * /doacoes:
 *   get:
 *     summary: Lista todas as doações públicas (somente ATIVAS)
 *     tags: [Doações]
 *     parameters:
 *       - in: query
 *         name: titulo
 *         schema:
 *           type: string
 *         description: Filtro pelo título da doação
 *       - in: query
 *         name: tipo_item
 *         schema:
 *           type: string
 *         description: Filtro pela categoria do item
 *     responses:
 *       200:
 *         description: Lista de doações ativas
 *       400:
 *         description: tipo_item inválido
 *       500:
 *         description: Erro interno
 */

// Listar todas as doações públicas (filtros opcionais)
exports.findAll = async (req, res) => {
  try {
    const { tipo_item, titulo } = req.query;
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
    const filtros = { titulo, tipo_item };
    const doacoes = await doacoesService.findAllDoacoesService(filtros);
    return res.status(200).json(doacoes);
  } catch (error) {
    console.error('findAll:', error);
    return res.status(500).json({ message: 'Erro interno ao listar doações.' });
  }
};

/**
 * @swagger
 * /doacoes/prestes-a-vencer:
 *   get:
 *     summary: Lista doações públicas com prazo de validade em até 14 dias
 *     tags: [Doações]
 *     responses:
 *       200:
 *         description: Lista retornada com sucesso
 *       500:
 *         description: Erro interno
 */

// Listar doações que vencem em até 14 dias
exports.findPrestesAVencer = async (req, res) => {
  try {
    const doacoes = await doacoesService.findDoacoesPrestesAVencerService();
    return res.status(200).json(doacoes);
  } catch (error) {
    console.error('findPrestesAVencer:', error);
    return res.status(500).json({ message: 'Erro interno ao listar doações prestes a vencer.' });
  }
};

/**
 * @swagger
 * /doacoes/{id}:
 *   get:
 *     summary: Busca uma doação pública por ID
 *     tags: [Doações]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da doação
 *     responses:
 *       200:
 *         description: Doação encontrada
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Doação não encontrada
 *       500:
 *         description: Erro interno
 */


// Buscar doação por ID
exports.findById = async (req, res) => {
  try {
    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }
    const doacao = await doacoesService.findByIdDoacaoService(idNum);
    return res.status(200).json(doacao);
  } catch (error) {
    console.error('findById:', error);
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno ao buscar doação.' });
  }
};
/**
 * @swagger
 * /doacoes/minhas/ativas:
 *   get:
 *     summary: Lista doações ATIVAS da ONG logada
 *     tags: [Doações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista retornada
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno
 */

// Listar as doações da ONG logada (filtro por status)
// GET /doacoes/minhas/ativas
exports.findMinhasAtivas = async (req, res) => {
  try {
    const tokenInfo = validateToken(req.headers.authorization);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;
    const lista = await doacoesService.findMinhasDoacoesAtivasService(ongId);
    return res.status(200).json(lista);
  } catch (error) {
    return res.status(500).json({ message: 'Erro interno ao listar doações ativas.' });
  }
};

/**
 * @swagger
 * /doacoes/minhas/finalizadas:
 *   get:
 *     summary: Lista doações FINALIZADAS da ONG logada
 *     tags: [Doações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista retornada
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno
 */

// GET /doacoes/minhas/finalizadas
exports.findMinhasFinalizadas = async (req, res) => {
  try {
    const tokenInfo = validateToken(req.headers.authorization);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;
    const lista = await doacoesService.findMinhasDoacoesFinalizadasService(ongId);
    return res.status(200).json(lista);
  } catch (error) {
    console.error('findMinhasFinalizadas:', error);
    return res.status(500).json({ message: 'Erro interno ao listar doações finalizadas.' });
  }
};

/**
 * @swagger
 * /doacoes:
 *   post:
 *     summary: Cria uma nova doação
 *     tags: [Doações]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               tipo_item:
 *                 type: string
 *               urgencia:
 *                 type: string
 *               quantidade:
 *                 type: integer
 *               email:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               prazo_necessidade:
 *                 type: string
 *                 format: date
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Doação criada
 *       400:
 *         description: Dados inválidos ou imagem ausente
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno
 */


// Criar nova doação (com upload ou url_imagem)
exports.create = async (req, res) => {
  try {
    const tokenInfo = validateToken(req.headers.authorization);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;

    const imgData = getImageData(req);
    if (!imgData) {
      return res.status(400).json({ message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    }

    const doacaoData = { ...req.body, url_imagem: imgData.url };
    const criada = await doacoesService.createDoacaoService(doacaoData, ongId);
    return res.status(201).json(criada);
  } catch (error) {
    console.error('create:', error);
    // Erros de validação de campos obrigatórios ou formatos
    if (
      error.message.includes('válidas') ||
      error.message.includes('válido') ||
      error.message.includes('deve conter apenas') ||
      error.message.includes('obrigatório') ||
      error.message.includes('inválido') ||
      error.message.includes('não pode ser vazio') ||
      error.message.includes('maior que zero.') ||
      error.message.includes('O campo urgencia deve') ||
      error.message.includes('ONG não encontrada.') ||
      error.message.includes('O campo url_imagem deve conter uma URL válida.') ||
      error.message.includes('prazo_necessidade')
    ) {
      return res.status(400).json({ message: error.message });
    }
    // Erro de permissão
    if (error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    // Erro de não encontrado
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    // Qualquer outro erro
    return res.status(500).json({ message: 'Erro interno ao criar doação.' });
  }
};

/**
 * @swagger
 * /doacoes/{id}:
 *   put:
 *     summary: Atualiza uma doação existente (se ainda ATIVA)
 *     tags: [Doações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               tipo_item:
 *                 type: string
 *               urgencia:
 *                 type: string
 *               quantidade:
 *                 type: integer
 *               email:
 *                 type: string
 *               whatsapp:
 *                 type: string
 *               prazo_necessidade:
 *                 type: string
 *                 format: date
 *               foto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Doação atualizada
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Doação não encontrada
 *       500:
 *         description: Erro interno
 */

// Atualizar doação (pode receber novo upload ou manter url existente)
exports.update = async (req, res) => {
  try {
    const tokenInfo = validateToken(req.headers.authorization);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;

    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    const doacaoAtual = await doacoesService.findByIdDoacaoService(idNum);
    if (doacaoAtual.status === 'FINALIZADA') {
      return res.status(400).json({ message: 'Doação FINALIZADA não pode ser modificada.' });
    }

    const imgData = getImageData(req);
    if (!imgData) {
      return res.status(400).json({ message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    }

    const doacaoData = { ...req.body, url_imagem: imgData.url };
    const atualizada = await doacoesService.updateDoacaoService(idNum, doacaoData, ongId);
    return res.status(200).json(atualizada);
  } catch (error) {
    console.error('update:', error);

    // Erros de validação de campos obrigatórios ou formatos
    if (
        error.message.includes('válidas') ||
        error.message.includes('válido') ||
        error.message.includes('deve conter apenas') ||
        error.message.includes('obrigatório') ||
        error.message.includes('inválido') ||
        error.message.includes('não pode ser vazio') ||
        error.message.includes('maior que zero.') ||
        error.message.includes('O campo urgencia deve') ||
        error.message.includes('O campo url_imagem deve conter uma URL válida.')
    ) {
        return res.status(400).json({ message: error.message });
    }

    // Erro de permissão
    if (error.message.includes('permissão')) {
        return res.status(403).json({ message: error.message });
    }

    // Erro de não encontrado
    if (error.message.includes('não encontrada')) {
        return res.status(404).json({ message: error.message });
    }

    // Qualquer outro erro
    return res.status(500).json({ message: 'Erro interno ao atualizar doação.' });
  }
};

/**
 * @swagger
 * /doacoes/{id}/status:
 *   patch:
 *     summary: Atualiza o status de uma doação (ATIVA ⇄ FINALIZADA)
 *     tags: [Doações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ATIVA, FINALIZADA]
 *     responses:
 *       200:
 *         description: Status atualizado
 *       400:
 *         description: Status inválido ou doação já finalizada
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Doação não encontrada
 *       500:
 *         description: Erro interno
 */

// Atualizar apenas status da doação
exports.updateStatus = async (req, res) => {
  try {
    const tokenInfo = validateToken(req.headers.authorization);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;

    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    const { status } = req.body;
    const statusPermitidos = ['ATIVA', 'FINALIZADA'];
    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use ATIVA ou FINALIZADA.' });
    }

    const doacaoAtual = await doacoesService.findByIdDoacaoService(idNum);
    console.log('ong_id da doação:', doacaoAtual.ong_id, 'ongId do token:', ongId);

    if (doacaoAtual.ong_id !== ongId) {
      return res.status(403).json({ message: 'Você não tem permissão para modificar esta doação.' });
    }

    if (doacaoAtual.status === status) {
      return res.status(400).json({ message: `A doação já está com o status '${status}'.` });
    }
    if (doacaoAtual.status === 'FINALIZADA') {
      return res.status(400).json({ message: 'Só é possível atualizar o status se a doação estiver ATIVA.' });
    }

    const atualizada = await doacoesService.updateStatusDoacaoService(idNum, status, ongId);
    return res.status(200).json(atualizada);
  } catch (error) {
    console.error('updateStatus:', error);
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno ao atualizar status.' });
  }
};

/**
 * @swagger
 * /doacoes/{id}:
 *   delete:
 *     summary: Deleta uma doação da ONG logada
 *     tags: [Doações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleção realizada com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Doação não encontrada
 *       500:
 *         description: Erro interno
 */

// Deletar doação
exports.deleteDoacao = async (req, res) => {
  try {
    const tokenInfo = validateToken(req.headers.authorization);
    console.log('Token info:', tokenInfo);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;

    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    await doacoesService.deleteDoacaoService(idNum, ongId);
    return res.status(204).send();
  } catch (error) {
    console.error('deleteDoacao:', error);
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erro interno ao deletar doação.' });
  }
};



//clean up
// Finalizar doações expiradas
exports.finalizarExpiradas = async (req, res) => {
  try {
    const ids = await doacoesService.finalizarDoacoesExpiradas();
    return res.status(200).json({
      message: 'Doações expiradas finalizadas com sucesso.',
      idsFinalizadas: ids
    });
  } catch (error) {
    console.error('Erro em finalizarExpiradas:', error);
    return res
      .status(500)
      .json({ message: 'Erro interno ao finalizar doações expiradas.' });
  }
};

// Limpar doações finalizadas há mais de 30 dias  
exports.limparExpiradas = async (req, res) => {
  try {
    const resultado = await doacoesService.limparDoacoesExpiradas();
    return res.status(200).json({
      message: 'Limpeza de doações expiradas realizada com sucesso.',
      detalhes: resultado
    });
  } catch (error) {
    console.error('Erro em limparExpiradas:', error);
    return res
      .status(500)
      .json({ message: 'Erro interno ao limpar doações expiradas.' });
  }
};

