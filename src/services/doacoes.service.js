// Importa a nossa conexão com o banco que você já criou
const prisma = require('../config/database');

// Função para buscar TODAS as doações no banco
const findAllDoacoesService = async () => {
    const doacoes = await prisma.produtos.findMany();
    return doacoes;
};

// Função para buscar UMA doação pelo seu ID
const findByIdDoacaoService = async (id) => {
    const doacao = await prisma.produtos.findUnique({ where: { id_produto: Number(id) } });
    return doacao;
};

// Função para CRIAR uma nova doação
const createDoacaoService = async (dadosDaNovaDoacao) => {
    const doacaoCriada = await prisma.produtos.create({ data: dadosDaNovaDoacao });
    return doacaoCriada;
};

// Função para ATUALIZAR uma doação
const updateDoacaoService = async (id, dadosParaEditar) => {
    const doacaoAtualizada = await prisma.produtos.update({
        where: { id_produto: Number(id) },
        data: dadosParaEditar,
    });
    return doacaoAtualizada;
};

// Função para APAGAR uma doação
const deleteDoacaoService = async (id) => {
    await prisma.produtos.delete({ where: { id_produto: Number(id) } });
};

// Exportamos todas as funções para que o próximo arquivo (o Controller) possa usá-las
module.exports = {
    findAllDoacoesService,
    findByIdDoacaoService,
    createDoacaoService,
    updateDoacaoService,
    deleteDoacaoService,
};