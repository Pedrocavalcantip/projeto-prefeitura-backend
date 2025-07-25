const cron = require('node-cron');
const {
  finalizarRealocacoesAntigas,
  limparRealocacoesExpiradas
} = require('../services/realocacoes.service.js');

console.log('⏰ Agendador de realocações iniciado!');

// 1) Finaliza realocações ATIVAS com mais de 60 dias, todo dia às 03:00
cron.schedule('0 3 * * *', async () => {
  try {
    console.log('🔔 [Job] Finalizando realocações antigas (60+ dias)…');
    const resultado = await finalizarRealocacoesAntigas(true);
    console.log(`   → Finalizadas: ${resultado.count || resultado.length}`);
    console.log('🏁 Finalização de realocações concluída.');
  } catch (err) {
    console.error('❌ Erro no job de finalização de realocações:', err);
  }
});

// 2) Exclui realocações FINALIZADAS há mais de 6 meses, todo dia às 04:00
cron.schedule('0 4 * * *', async () => {
  try {
    console.log('🔔 [Job] Excluindo realocações finalizadas há +6 meses…');
    const { totalExcluidas } = await limparRealocacoesExpiradas(true);
    console.log(`   → Excluídas: ${totalExcluidas}`);
    console.log('🏁 Exclusão de realocações concluída.');
  } catch (err) {
    console.error('❌ Erro no job de exclusão de realocações:', err);
  }
});

module.exports = cron;
