const cron = require('node-cron');
const { finalizarRealocacoesAntigas } = require('../services/realocacoes.service');

// Agendar para rodar todo dia à meia-noite
cron.schedule('0 0 * * *', async () => {
  try {
    const resultado = await finalizarRealocacoesAntigas();
    console.log(`[CRON] Realocações antigas finalizadas automaticamente. Total atualizadas: ${resultado.count}`);
  } catch (error) {
    console.error('[CRON] Erro ao finalizar realocações antigas:', error);
  }
});