// Importa os serviços que criamos no passo anterior
const doacoesService = require('../services/doacoes.service.js');

// Cada função aqui é um "gerente" para uma rota específica.

const findAll = async (req, res) => {
    try {
        // Pede para o serviço buscar todas as doações
        const doacoes = await doacoesService.findAllDoacoesService();
        // Se der certo, envia a lista de doações como resposta
        res.status(200).json(doacoes);
    } catch (error) {
        // Se der errado, envia uma mensagem de erro
        res.status(500).json({ message: error.message });
    }
};

const findById = async (req, res) => {
    try {
        // Pega o 'id' que vem nos parâmetros da URL (ex: /doacoes/1)
        const { id } = req.params;
        const doacao = await doacoesService.findByIdDoacaoService(id);

        // Se o serviço não encontrar a doação, retorna um erro 404
        if (!doacao) {
            return res.status(404).json({ message: 'Doação não encontrada.' });
        }
        res.status(200).json(doacao);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const create = async (req, res) => {
    try {
        // Pega os dados que o usuário envia no corpo da requisição
        const newDoacao = req.body;

        // Validação simples para garantir que campos essenciais foram enviados
        if (!newDoacao.nome_ong || !newDoacao.descricao || !newDoacao.tipo_item) {
            return res.status(400).json({ message: 'Dados incompletos. Envie todos os campos obrigatórios.' });
        }
        // Pede para o serviço criar a nova doação
        const doacaoCriada = await doacoesService.createDoacaoService(newDoacao);
        
        // Retorna o status 201 (Created) e a doação que foi criada no banco
        res.status(201).json(doacaoCriada);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const doacaoEditada = req.body;
        const doacaoAtualizada = await doacoesService.updateDoacaoService(id, doacaoEditada);
        res.status(200).json(doacaoAtualizada);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteDoacao = async (req, res) => {
    try {
        const { id } = req.params;
        await doacoesService.deleteDoacaoService(id);
        // Retorna o status 204 (No Content), pois não há conteúdo para enviar de volta
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Exporta todas as funções "gerente"
module.exports = {
    findAll,
    findById,
    create,
    update,
    deleteDoacao,
};