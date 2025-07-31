const cron = require('node-cron');
const { finalizarRealocacoesAntigas, limparRealocacoesExpiradas } = require('../services/realocacoes.service.js');

console.log('⏰ Agendador de realocações iniciado!');

// Função exportada para ser testada diretamente
async function realocacoesJobFn() {
  try {
    console.log('🔔 Job agendado: Finalizando realocações antigas...');
    await finalizarRealocacoesAntigas(true);

    console.log('🧹 Job agendado: Limpando realocações expiradas...');
    await limparRealocacoesExpiradas(true);

    console.log('🏁 Limpeza automática de realocações finalizada!');
  } catch (error) {
    console.error('❌ Erro ao executar o job automático de realocações:', error);
  }
}

// Executa diariamente às 03:00 da manhã (horário do servidor)
cron.schedule('0 3 * * *', realocacoesJobFn);

module.exports = { realocacoesJobFn };