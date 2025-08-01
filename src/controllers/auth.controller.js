const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service.js');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza autenticação da ONG na API externa e gera token JWT
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_ong
 *               - password
 *             properties:
 *               email_ong:
 *                 type: string
 *                 description: E-mail cadastrado da ONG
 *                 example: ong1@gmail.com
 *               password:
 *                 type: string
 *                 description: Senha da ONG
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login realizado com sucesso, retorna JWT.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auth:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT gerado para autenticação
 *       400:
 *         description: Email ou senha não enviados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email e senha são obrigatórios
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auth:
 *                   type: boolean
 *                   example: false
 *                 erro:
 *                   type: string
 *                   example: Credenciais inválidas
 *       500:
 *         description: Erro interno ao realizar login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: string
 *                   example: Erro interno no servidor.
 */

exports.login = async (req, res) => {
  const { email_ong, password } = req.body;
  if (!email_ong || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  try {
    const apiResponse = await authService.loginNaApiPrefeitura(email_ong, password);
    console.log('🔍 Resposta completa da prefeitura:', apiResponse);

    const { ngo: ongDataFromApi, user: userDataFromApi } = apiResponse;

    console.log('📊 Dados da ONG recebidos:', ongDataFromApi);
    console.log('👤 Dados do usuário recebidos:', userDataFromApi);

    // 🔁 Ajuste aqui: mapeia email → email_ong
    const userData = { email_ong: userDataFromApi.email };

    const ong = await authService.sincronizarOng(ongDataFromApi, userData);

    const token = jwt.sign(
      { id_ong: ong.id_ong, email_ong: ong.email_ong },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ auth: true, token });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    if (error.message.includes('401') || error.message.includes('Credenciais inválidas')) {
      return res.status(401).json({ auth: false, erro: 'Credenciais inválidas' });
    }
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};
