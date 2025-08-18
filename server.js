require ('./src/jobs/realocacoesJob'); 

const app = require('./index');
const port = process.env.PORT || 3004;

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});