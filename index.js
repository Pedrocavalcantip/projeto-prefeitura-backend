const express = require('express');
const dotenv = require('dotenv');

const doacoesRouter = require('./src/routes/doacoes.routes.js');
const authRouter = require('./src/routes/auth.routes.js');
const realocacoesRoutes = require('./src/routes/realocacoes.routes');

dotenv.config();

const app = express();
app.use(express.json());

app.use('/realocacoes', realocacoesRoutes);
app.use('/doacoes', doacoesRouter);
app.use('/auth', authRouter);

app.get('/', (req, res) => {
    res.send('Servidor do Hub de Doações está no ar!');
});

module.exports = app;