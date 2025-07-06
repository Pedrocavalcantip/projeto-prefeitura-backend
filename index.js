const express = require('express');
const dotenv = require('dotenv');

// Importa o nosso router de DOAÇÕES
const doacoesRouter = require('./src/routes/doacoes.routes.js');


const authRouter = require('./src/routes/auth.routes.js'); // Importação da rota de autenticação

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Servidor do Hub de Doações está no ar!');
});


// Usando o router de DOAÇÕES
app.use('/doacoes', doacoesRouter);

// Rotas
app.use('/auth', authRouter); // Adicionando as rotas de autenticação


app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});
