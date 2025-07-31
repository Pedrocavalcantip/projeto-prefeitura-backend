module.exports = function parseNumbers(fields = []) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const asNumber = Number(req.body[field]);
        // Só faz o parse se for inteiro válido (não NaN, não float)
        if (
          typeof asNumber === 'number' &&
          !Number.isNaN(asNumber) &&
          Number.isInteger(asNumber)
        ) {
          req.body[field] = asNumber;
        }
      }
    }
    next();
  };
};


module.exports = function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const valor = req.params[paramName];
    const num = Number(valor);
    if (!valor || isNaN(num) || !Number.isInteger(num) || num <= 0) {
      return res.status(400).json({
        message: `${paramName} deve ser um número válido maior que zero`
      });
    }
    // Converta de string para number para evitar bugs no Prisma!
    req.params[paramName] = num;
    next();
  };
};
