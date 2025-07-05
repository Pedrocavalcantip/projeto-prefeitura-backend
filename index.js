const express = require('express');
const dotenv = require('dotenv');

// Importa o nosso router de ONGs
const doacoesRouter = require('./src/routes/doacoes.routes.js');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Rota de teste principal
app.get('/', (req, res) => {
    res.send('Servidor do Hub de Doações está no ar!');
});

// Usando o router de ONGs
app.use('/doacoes', doacoesRouter);

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});
