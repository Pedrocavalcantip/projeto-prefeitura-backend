// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');

dotenv.config();

// Jobs agendados
require('./src/jobs/doacoes.job.js');
require('./src/jobs/realocacoesJob.js');

const authRouter = require('./src/routes/auth.routes.js');
const doacoesRouter = require('./src/routes/doacoes.routes.js');
const realocacoesRoutes = require('./src/routes/realocacoes.routes.js');
const uploadRoutes = require('./src/routes/upload.routes.js');

const app = express();


// E esta linha junto com app.use():


// Configura CORS
app.use(cors({ origin: 'http://localhost:8004' }));

app.use(express.json());

// Carrega a documentação Swagger
require('./src/config/swagger')(app); // ← agora sim, depois do app criado

// Endpoints
app.use('/auth', authRouter);               // POST /auth/login
app.use('/doacoes', doacoesRouter);         // CRUD de doações
app.use('/realocacoes', realocacoesRoutes); // CRUD de realocações
app.use('/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.send('Servidor do Hub de Doações está no ar!');
});

// Tratamento de erros do multer e genéricos
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(500).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = app;
