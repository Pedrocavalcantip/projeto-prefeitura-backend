const express = require('express');
const router = express.Router();

const { login } = require('../controllers/auth.controller.js'); // Importa o controlador de login
const verificarToken = require('../middlewares/authMiddleware.js'); // Importa o middleware de proteção

// Rota pública de login
router.post('/login', login);

// Rota protegida (exemplo)
router.get('/protegida', verificarToken, (req, res) => {
    res.json({ mensagem: `Você acessou uma rota protegida! Email: ${req.email}` });
});

module.exports = router;
