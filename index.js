// index.js
const express           = require('express');
const dotenv            = require('dotenv');

dotenv.config();

require('./src/jobs/doacoes.job.js');
require('./src/jobs/realocacoesJob.js');


const authRouter        = require('./src/routes/auth.routes.js');
const doacoesRouter     = require('./src/routes/doacoes.routes.js');
const realocacoesRoutes = require('./src/routes/realocacoes.routes.js');
const multer = require('multer');

const app = express();
app.use(express.json());

// endpoints

app.use('/auth',    authRouter);        // POST /auth/login
app.use('/doacoes', doacoesRouter);     // CRUD de doações
app.use('/realocacoes', realocacoesRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do Hub de Doações está no ar!');
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erro do multer (ex: tamanho, formato)
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    // Outros erros
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = app;
