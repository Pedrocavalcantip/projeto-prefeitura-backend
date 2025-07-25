const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const apiResponse = await authService.loginNaApiPrefeitura(email, password);
    console.log('🔍 Resposta completa da prefeitura:', apiResponse);

    // Ajuste aqui se a API retornar em apiResponse.data:
    const { ngo: ongDataFromApi, user: userDataFromApi } = apiResponse;

    console.log('📊 Dados da ONG recebidos:', ongDataFromApi);
    console.log('👤 Dados do usuário recebidos:', userDataFromApi);

    const ong = await authService.sincronizarOng(ongDataFromApi, userDataFromApi);

    const token = jwt.sign(
      { id_ong: ong.id_ong, email: ong.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ auth: true, token });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    if (error.message.includes('401') || error.message.includes('Falha na autenticação')) {
      return res.status(401).json({ auth: false, erro: 'Credenciais inválidas' });
    }
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};
