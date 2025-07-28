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
function validarCamposComuns(dados) {
  const obrigatorios = ['titulo', 'descricao', 'tipo_item', 'url_imagem', 'whatsapp', 'email'];

  for (const campo of obrigatorios) {
    const valor = dados[campo];
    if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
      throw new Error(`O campo '${campo}' é obrigatório e não pode estar vazio.`);
    }
  }

  if (!categoriasValidas.includes(dados.tipo_item)) {
    throw new Error('O campo tipo_item deve ser uma das categorias válidas.');
  }

  if (!regexUrl.test(dados.url_imagem)) {
    throw new Error('O campo url_imagem deve conter uma URL válida.');
  }

  if (!regexEmail.test(dados.email)) {
    throw new Error('O campo email deve conter um endereço válido.');
  }

  if (!regexWhatsapp.test(dados.whatsapp)) {
    throw new Error('O campo whatsapp deve conter apenas números (10 a 13 dígitos).');
  }

  // Validação de quantidade
  if (dados.quantidade !== undefined) {
    const quantidade = parseInt(dados.quantidade, 10);
    if (isNaN(quantidade) || quantidade <= 0) {
      throw new Error('A quantidade deve ser um número maior que zero.');
    }
    dados.quantidade = quantidade;
  } else {
    dados.quantidade = 1; // valor padrão
  }
}

/**
 * Valida dados de doações (inclui urgência e prazo)
 */
function validarDoacao(dados) {
  validarCamposComuns(dados);

  if (dados.urgencia && !niveisUrgencia.includes(dados.urgencia)) {
    throw new Error(`O campo urgencia deve ser um dos seguintes: ${niveisUrgencia.join(', ')}`);
  }

  // Validação de dias_validade (caso venha do front)
  if (dados.dias_validade !== undefined) {
    const dias = parseInt(dados.dias_validade, 10);
    if (isNaN(dias) || dias <= 0) {
      throw new Error('O campo dias_validade deve ser um número inteiro maior que zero.');
    }
    dados.dias_validade = dias;
  }

  // Validação de prazo_necessidade manual (caso venha uma data)
  if (dados.prazo_necessidade) {
    const data = dados.prazo_necessidade;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data) && isNaN(Date.parse(data))) {
      throw new Error('O campo prazo_necessidade deve ser uma data válida no formato YYYY-MM-DD ou ISO.');
    }
    // NOVA VALIDAÇÃO: não permitir datas no passado
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera hora para comparar só a data
    const dataPrazo = new Date(data);
    if (dataPrazo < hoje) {
      throw new Error('O campo prazo_necessidade não pode ser uma data no passado.');
    }
  }
}

/**
 * Valida dados de realocações (sem urgência nem prazo)
 */
function validarRealocacao(dados) {
  validarCamposComuns(dados);
}

module.exports = {
  validarDoacao,
  validarRealocacao
};
