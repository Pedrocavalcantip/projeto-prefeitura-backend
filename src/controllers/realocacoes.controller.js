// src/controllers/realocacoes.controller.js
const realocacoesService    = require('../services/realocacoes.service.js');
const { validarRealocacao } = require('../services/validacao.service.js');
const { validateToken }     = require('../utils/tokenUtils');
const { getImageData }      = require('../utils/imageUtils');

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

    // 3) monta dados e delega ao service (que faz validação e throws com status)
    const dados = { ...req.body, url_imagem: imgData.url };
    const criada = await realocacoesService.createRealocacaoService(dados, ongId);

    // 4) sucesso
    return res.status(201).json(criada);

  } catch (error) {
    console.error('createRealocacao:', error);

    // se service lançou { status, message }, respeita esse HTTP code
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    // caso contrário (erro de validação sem status), retorna 400
    return res.status(400).json({ message: error.message });
  }
};



// PUT /realocacoes/:id
exports.update = async (req, res) => {
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

  // 3) prepara dados (inclui url_imagem se houver upload)
  const imgData = getImageData(req);
  const dados   = { ...req.body };
  if (imgData) dados.url_imagem = imgData.url;

  // 4) delega tudo ao service
  try {
    const atualizada = await realocacoesService.updateRealocacaoService(idNum, dados, ongId);
    return res.status(200).json(atualizada);
  } catch (error) {
  // se o service lançou { status, message }, devolve fielmente
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  // caso contrário, é validação client‐side → 400
  return res.status(400).json({ message: error.message });
};
};

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
