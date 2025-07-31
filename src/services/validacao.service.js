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

const niveisUrgencia = ['BAIXA', 'MEDIA', 'ALTA'];

const regexUrl = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
const regexEmail = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
const regexWhatsapp = /^\d{10,13}$/;

/**
 * Valida campos obrigatórios e formatos comuns
 */
function validarCamposComuns(dados, modo = 'criar') {
  const obrigatorios = ['titulo', 'descricao', 'tipo_item', 'url_imagem', 'whatsapp', 'email'];

  for (const campo of obrigatorios) {
    const valor = dados[campo];

    if (modo === 'criar' && (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === ''))) {
      throw { status: 400, message: `O campo '${campo}' é obrigatório e não pode estar vazio.` };
    }

    if (modo === 'atualizar' && campo in dados && (valor === null || (typeof valor === 'string' && valor.trim() === ''))) {
      throw { status: 400, message: `O campo '${campo}' não pode estar vazio ao ser atualizado.` };
    }
  }

  if ('tipo_item' in dados && !categoriasValidas.includes(dados.tipo_item)) {
    throw { status: 400, message: 'O campo tipo_item deve ser uma das categorias válidas.' };
  }

  if ('url_imagem' in dados && !regexUrl.test(dados.url_imagem)) {
    throw { status: 400, message: 'O campo url_imagem deve conter uma URL válida.' };
  }

  if ('email' in dados && !regexEmail.test(dados.email)) {
    throw { status: 400, message: 'O campo email deve conter um endereço válido.' };
  }

  if ('whatsapp' in dados && !regexWhatsapp.test(dados.whatsapp)) {
    throw { status: 400, message: 'O campo whatsapp deve conter apenas números (10 a 13 dígitos).' };
  }

  if (dados.quantidade !== undefined) {
    const quantidade = parseInt(dados.quantidade, 10);
    if (isNaN(quantidade) || quantidade <= 0) {
      throw { status: 400, message: 'A quantidade deve ser um número maior que zero.' };
    }
    dados.quantidade = quantidade;
  }
}


/**
 * Valida dados de doações (inclui urgência e prazo)
 */
function validarDoacao(dados) {
  validarCamposComuns(dados);

  if (dados.urgencia && !niveisUrgencia.includes(dados.urgencia)) {
    throw { status: 400, message: `O campo urgencia deve ser um dos seguintes: ${niveisUrgencia.join(', ')}` };
  }

  // Validação de dias_validade (caso venha do front)
  if (dados.dias_validade !== undefined) {
    const dias = parseInt(dados.dias_validade, 10);
    if (isNaN(dias) || dias <= 0) {
      throw { status: 400, message: 'O campo dias_validade deve ser um número inteiro maior que zero.' };
    }
    dados.dias_validade = dias;
  }

  // Validação de prazo_necessidade manual (caso venha uma data)
  if (dados.prazo_necessidade) {
    const data = dados.prazo_necessidade;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) && isNaN(Date.parse(data))) {
      throw { status: 400, message: 'O campo prazo_necessidade deve ser uma data válida no formato YYYY-MM-DD ou ISO.' };
    }
  }
}

/**
 * Valida dados de realocações (sem urgência nem prazo)
 */
function validarRealocacao(dados, modo = 'criar') {
  validarCamposComuns(dados, modo);
}

module.exports = {
  validarDoacao,
  validarRealocacao,
  validarCamposComuns
};
