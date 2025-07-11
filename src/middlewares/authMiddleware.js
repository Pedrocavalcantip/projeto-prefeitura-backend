const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) return res.status(401).json({ erro: 'Token não fornecido' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ erro: 'Token inválido' });

        req.email = decoded.email;
        req.id_ong = decoded.id_ong; 
        next();
    });
}

module.exports = verificarToken;