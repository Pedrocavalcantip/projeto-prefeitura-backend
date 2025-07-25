// index.js
const express           = require('express');
const dotenv            = require('dotenv');

dotenv.config();

require('./src/jobs/doacoes.job');
require('./src/jobs/realocacoes.job');


const authRouter        = require('./src/routes/auth.routes');
const doacoesRouter     = require('./src/routes/doacoes.routes');
const realocacoesRoutes = require('./src/routes/realocacoes.routes');

const app = express();
app.use(express.json());

// endpoints

app.use('/auth',    authRouter);        // POST /auth/login
app.use('/doacoes', doacoesRouter);     // CRUD de doações
app.use('/realocacoes', realocacoesRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do Hub de Doações está no ar!');
});

module.exports = app;
