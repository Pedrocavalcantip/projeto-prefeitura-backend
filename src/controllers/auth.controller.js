const axios = require('axios');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    console.log('Iniciando a requisição para a API externa...');
    const { email, password } = req.body;

    try {
        const response = await axios.post('https://bora-impactar-dev.setd.rdmapps.com.br/api/login',
            { email, password },
            {
                headers: { 'Content-Type': 'application/json' },
                validateStatus: () => true // Para capturar mesmo status 4xx
            }
        );

        console.log('Status da API externa:', response.status);
        console.log('Resposta da API externa:', response.data);

        // ✅ Correção: Verificar se a resposta tem o campo "user"
        if (response.status === 200 && response.data.user) {
            const token = jwt.sign({ email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            return res.json({
                auth: true,
                token: token,
                dadosAPI: response.data
            });
        } else {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

    } catch (error) {
    console.error('Erro no catch:', error.message);
    console.error('Erro completo:', error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
}
};