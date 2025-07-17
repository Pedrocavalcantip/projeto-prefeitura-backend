const jwt = require('jsonwebtoken');

/**
 * Valida token JWT manualmente (para uso em rotas condicionais)
 * @param {string} authHeader - Header de autorização
 * @returns {object} - { valid: boolean, decoded?: object, error?: string }
 */
const validateToken = (authHeader) => {
  if (!authHeader) {
    return { valid: false, error: 'Token de autorização necessário.' };
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { valid: false, error: 'Formato do token inválido.' };
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: 'Token inválido.' };
  }
};

module.exports = {
  validateToken
};
