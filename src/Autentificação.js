const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const verificarToken = require('../middlewares/authMiddleware');

// Rota pública para fazer login
router.post('/login', login);

// Exemplo de rota protegida (precisa do token)
router.get('/protegida', verificarToken, (req, res) => {
    res.json({ mensagem: `Você acessou uma rota protegida! Email: ${req.email}` });
});

module.exports = router;
