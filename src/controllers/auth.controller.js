const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    // Usar o service para autenticar
    const apiResponse = await authService.loginNaApiPrefeitura(email, password);
    const ongDataFromApi = apiResponse.ngo;
    const userDataFromApi = apiResponse.user;
    
    console.log('📊 Dados da ONG recebidos:', ongDataFromApi);
    console.log('👤 Dados do usuário recebidos:', userDataFromApi);
    
    // Sincronizar com nosso banco
    const ong = await authService.sincronizarOng(ongDataFromApi, userDataFromApi);
    
    // Gerar token JWT
    const token = jwt.sign(
      { id_ong: ong.id_ong, email: ong.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Retornar apenas o necessário
    return res.json({ 
      auth: true, 
      token: token
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};