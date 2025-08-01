// src/controllers/realocacoes.controller.js
const realocacoesService    = require('../services/realocacoes.service.js');
const { validarRealocacao } = require('../services/validacao.service.js');
const { validateToken }     = require('../utils/tokenUtils');
const { getImageData }      = require('../utils/imageUtils');

/**
 * @swagger
 * /realocacoes/catalogo:
 *   get:
 *     summary: Lista todas as realocações públicas (ATIVAS)
 *     tags: [Realocações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: titulo
 *         schema:
 *           type: string
 *         description: Filtro pelo título da realocação
 *       - in: query
 *         name: tipo_item
 *         schema:
 *           type: string
 *         description: Filtro pela categoria do item
 *     responses:
 *       200:
 *         description: Lista de realocações ativas
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno ao listar realocações
 */

// GET /realocacoes/catalogo
exports.findCatalogo = async (req, res) => {
  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }
  try {
    const filtros = { titulo: req.query.titulo, tipo_item: req.query.tipo_item };
    const lista = await realocacoesService.findCatalogoService(filtros);
    return res.status(200).json(lista);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /realocacoes/catalogo/{id}:
 *   get:
 *     summary: Busca detalhes de uma realocação pública pelo ID
 *     tags: [Realocações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da realocação
 *     responses:
 *       200:
 *         description: Realocação encontrada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Token inválido ou ausente
 *       404:
 *         description: Realocação não encontrada
 *       500:
 *         description: Erro interno ao buscar realocação
 */

// GET /realocacoes/catalogo/:id
exports.findCatalogoById = async (req, res) => {
  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }
  const { id } = req.params;
  if (isNaN(id) || parseInt(id, 10) <= 0) {
    return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
  }
  try {
    const realocacao = await realocacoesService.findCatalogoByIdService(id);
    return res.status(200).json(realocacao);
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @swagger
 * /realocacoes/minhas/ativas:
 *   get:
 *     summary: Lista realocações ATIVAS da ONG logada
 *     tags: [Realocações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de realocações ativas da ONG
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno ao listar realocações
 */

/**
 * @swagger
 * /realocacoes/minhas/finalizadas:
 *   get:
 *     summary: Lista realocações FINALIZADAS da ONG logada
 *     tags: [Realocações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de realocações finalizadas da ONG
 *       401:
 *         description: Token inválido ou ausente
 *       500:
 *         description: Erro interno ao listar realocações
 */

// GET /realocacoes/minhas/ativas
exports.findMinhasAtivas = async (req, res) => {
  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }
  try {
    const ongId = tokenInfo.decoded.id_ong;
    const lista = await realocacoesService.findMinhasRealocacoesAtivasService(ongId);
    return res.status(200).json(lista);
  } catch (err) {
    console.error('findMinhasAtivas:', err);
    return res.status(500).json({ message: 'Erro interno ao listar realocações ativas.' });
  }
};

/**
 * @swagger
 * /realocacoes:
 *   post:
 *     summary: Cria uma nova realocação de item
 *     tags: [Realocações]
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
 *         description: Realocação criada
 *       400:
 *         description: Dados inválidos ou imagem ausente
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno ao criar realocação
 */

// GET /realocacoes/minhas/finalizadas
exports.findMinhasFinalizadas = async (req, res) => {
  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }
  try {
    const ongId = tokenInfo.decoded.id_ong;
    const lista = await realocacoesService.findMinhasRealocacoesFinalizadasService(ongId);
    return res.status(200).json(lista);
  } catch (err) {
    console.error('findMinhasFinalizadas:', err);
    return res.status(500).json({ message: 'Erro interno ao listar realocações finalizadas.' });
  }
};

/**
 * @swagger
 * /realocacoes:
 *   post:
 *     summary: Cria uma nova realocação de item
 *     tags: [Realocações]
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
 *         description: Realocação criada
 *       400:
 *         description: Dados inválidos ou imagem ausente
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno ao criar realocação
 */

// PUT /realocacoes/:id
exports.create = async (req, res) => {
  try {
    // 1) autenticação
    const tokenInfo = validateToken(req.headers.authorization);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;

    // 2) imagem obrigatória
    const imgData = getImageData(req);
    if (!imgData) {
      return res
        .status(400)
        .json({ message: 'Informe a imagem: upload (foto) ou url_imagem no corpo.' });
    }

    // 3) monta dados e delega ao service
    const dados = { ...req.body, url_imagem: imgData.url };
    const criada = await realocacoesService.createRealocacaoService(dados, ongId);

    // 4) sucesso
    return res.status(201).json(criada);

  } catch (error) {
    console.error('createRealocacao:', error);

    // Erros de validação de campos obrigatórios ou formatos
    if (
      error.message?.includes('válidas') ||
      error.message?.includes('válido') ||
      error.message?.includes('deve conter apenas') ||
      error.message?.includes('obrigatório') ||
      error.message?.includes('inválido') ||
      error.message?.includes('não pode ser vazio') ||
      error.message?.includes('maior que zero') ||
      error.message?.includes('O campo urgencia deve') ||
      error.message?.includes('O campo url_imagem deve conter uma URL válida')
    ) {
      return res.status(400).json({ message: error.message });
    }

    // Erro de permissão
    if (error.message?.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }

    // Erro de não encontrado (quase não ocorre em create, mas cobre edge case relacional)
    if (error.message?.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }

    // Qualquer outro erro inesperado
    return res.status(500).json({ message: 'Erro interno ao criar realocação.' });
  }
};


/**
 * @swagger
 * /realocacoes/{id}:
 *   put:
 *     summary: Atualiza uma realocação existente (apenas se ATIVA)
 *     tags: [Realocações]
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
 *         description: Realocação atualizada
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Sem permissão para modificar
 *       404:
 *         description: Realocação não encontrada
 *       500:
 *         description: Erro interno ao atualizar realocação
 */

// PUT /realocacoes/:id
exports.update = async (req, res) => {
  try {
    // 1) autenticação
    const tokenInfo = validateToken(req.headers.authorization);
    if (!tokenInfo.valid) {
      return res.status(401).json({ message: tokenInfo.error });
    }
    const ongId = tokenInfo.decoded.id_ong;

    // 2) validação de ID numérico
    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
    }

    // 3) montagem dos dados (inclui url_imagem se houver upload)
    const imgData = getImageData(req);
    const dados   = { ...req.body };
    if (imgData) dados.url_imagem = imgData.url;

    // 4) chama o service
    const atualizada = await realocacoesService.updateRealocacaoService(idNum, dados, ongId);
    return res.status(200).json(atualizada);

  } catch (error) {
    console.error('updateRealocacao:', error);

    // Erros de validação de campos obrigatórios ou formatos
    if (
      error.message?.includes('válidas') ||
      error.message?.includes('válido') ||
      error.message?.includes('deve conter apenas') ||
      error.message?.includes('obrigatório') ||
      error.message?.includes('inválido') ||
      error.message?.includes('não pode ser vazio') ||
      error.message?.includes('maior que zero') ||
      error.message?.includes('O campo urgencia deve') ||
      error.message?.includes('O campo url_imagem deve conter uma URL válida')
    ) {
      return res.status(400).json({ message: error.message });
    }

    // Erro de permissão
    if (error.message?.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }

    // Erro de não encontrado
    if (error.message?.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }

    // Qualquer outro erro
    return res.status(500).json({ message: 'Erro interno ao atualizar realocação.' });
  }
};

/**
 * @swagger
 * /realocacoes/{id}/status:
 *   patch:
 *     summary: Finaliza uma realocação (ATIVA → FINALIZADA)
 *     tags: [Realocações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Status atualizado para FINALIZADA
 *       400:
 *         description: Status inválido ou já finalizada
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Realocação não encontrada
 *       500:
 *         description: Erro interno ao atualizar status
 */


// PATCH /realocacoes/:id/status
exports.updateStatus = async (req, res) => {
  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }

  const ongId = tokenInfo.decoded.id_ong;
  const idNum = parseInt(req.params.id, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
  }

  try {
    // chama direto o service que já faz find→404/403 e update→sucesso
    const finalizada = await realocacoesService.finalizarRealocacaoService(idNum, ongId);
    return res.status(200).json(finalizada);
  } catch (error) {
    // aqui pegamos o status e a message que o service “throw-ou”
    const status  = error.status  || 500;
    const message = error.message || 'Erro ao finalizar realocação';
    return res.status(status).json({ message });
  }
};

/**
 * @swagger
 * /realocacoes/{id}:
 *   delete:
 *     summary: Deleta uma realocação da ONG logada
 *     tags: [Realocações]
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
 *         description: Realocação não encontrada
 *       500:
 *         description: Erro interno ao deletar realocação
 */


// DELETE /realocacoes/:id
exports.deleteRealocacao = async (req, res, next) => {
  // If the client called DELETE /realocacoes/expiradas,
  // we skip this handler and fall through to your cleanup route.
  if (req.params.id === 'expiradas') {
    return next();
  }

  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }
  const { id } = req.params;
  if (isNaN(id) || parseInt(id, 10) <= 0) {
    return res.status(400).json({ message: 'ID deve ser um número válido maior que zero.' });
  }
  try {
    const ongId = tokenInfo.decoded.id_ong;
    await realocacoesService.deleteRealocacaoService(id, ongId);
    return res.status(204).send();
  } catch (error) {
    if (error.message.includes('não encontrada')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('permissão')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
  }
};



// PATCH /realocacoes/expiradas
exports.finalizarRealocacoesAntigas = async (req, res) => {
  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }
  try {
    const ids = await realocacoesService.finalizarRealocacoesAntigas();
    return res.status(200).json({
      message: 'Realocações antigas finalizadas com sucesso.',
      idsFinalizadas: ids
    });
  } catch (error) {
    console.error('Erro em finalizarRealocacoesAntigas:', error);
    return res.status(500).json({ message: 'Erro interno ao finalizar realocações antigas.' });
  }
};

// DELETE /realocacoes/expiradas
exports.limparRealocacoesExpiradas = async (req, res) => {
  const tokenInfo = validateToken(req.headers.authorization);
  if (!tokenInfo.valid) {
    return res.status(401).json({ message: tokenInfo.error });
  }
  try {
    const resultado = await realocacoesService.limparRealocacoesExpiradas(true);
    return res.status(200).json({
      message: 'Limpeza de realocações expiradas realizada com sucesso.',
      detalhes: resultado
    });
  } catch (error) {
    console.error('Erro em limparRealocacoesExpiradas:', error);
    return res.status(500).json({ message: 'Erro interno ao limpar realocações expiradas.' });
  }
};
