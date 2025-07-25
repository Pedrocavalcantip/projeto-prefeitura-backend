
module.exports = function parseNumbers(fields = []) {
  return (req, res, next) => {
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const v = parseInt(req.body[field], 10);
        // se não for número válido, deixa a string e deixa a validação do controller falhar
        if (!Number.isNaN(v)) req.body[field] = v;
      }
    }
    next();
  };
};
