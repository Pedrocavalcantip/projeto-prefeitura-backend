const express = require('express');
const dotenv = require('dotenv');

// Importa o nosso router de DOAÇÕES
const doacoesRouter = require('./src/routes/doacoes.routes.js');

// Importa o nosso router de ONGs

const authRouter = require('./src/routes/auth.routes.js'); // Importação da rota de autenticação

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const realocacoesRoutes = require('./src/routes/realocacoes.routes');
app.use('/realocacoes', realocacoesRoutes);

app.get('/', (req, res) => {
    res.send('Servidor do Hub de Doações está no ar!');
});

// Usando o router de DOAÇÕES
app.use('/doacoes', doacoesRouter);


// Rotas de autenticação
app.use('/auth', authRouter);

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});