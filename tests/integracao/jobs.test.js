
jest.mock('../../src/services/doacoes.service.js', () => ({
  finalizarDoacoesVencidas: jest.fn(),
  limparDoacoesExpiradas: jest.fn(),
}));

const { finalizarDoacoesVencidas, limparDoacoesExpiradas } = require('../../src/services/doacoes.service.js');
// Importa a função do job diretamente
const { jobFn } = require('../../src/jobs/doacoes.job.js');

describe('Job de doações agendado', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar os serviços de finalizar e limpar doações ao executar o job', async () => {
    await jobFn();
    expect(finalizarDoacoesVencidas).toHaveBeenCalledWith(true);
    expect(limparDoacoesExpiradas).toHaveBeenCalledWith(true);
  });

  it('deve chamar console.error se ocorrer um erro no job', async () => {
    const error = new Error('Erro simulado');
    finalizarDoacoesVencidas.mockImplementationOnce(() => { throw error; });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await jobFn();

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Erro ao executar o job automático de doações:', error);
    consoleErrorSpy.mockRestore();
  });
});