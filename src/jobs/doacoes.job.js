const cron = require('node-cron');
const { finalizarDoacoesVencidas, limparDoacoesExpiradas } = require('../services/doacoes.service.js');

console.log('⏳ Agendador de doações iniciado!');

// Função exportada para ser testada diretamente
async function jobFn() {
  try {
    console.log('🔔 Job agendado: Finalizando doações vencidas...');
    await finalizarDoacoesVencidas(true);

    console.log('🧹 Job agendado: Limpando doações antigas...');
    await limparDoacoesExpiradas(true);

    console.log('🏁 Limpeza automática de doações finalizada!');
  } catch (error) {
    console.error('❌ Erro ao executar o job automático de doações:', error);
  }
}

// Executa diariamente às 00:00 da manhã (horário do servidor)
cron.schedule('0 0 * * *', jobFn);

module.exports = { jobFn };