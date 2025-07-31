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

  jest.mock('../../src/services/realocacoes.service.js', () => ({
    finalizarRealocacoesAntigas: jest.fn(),
    limparRealocacoesExpiradas: jest.fn(),
    }));

    const {
    finalizarRealocacoesAntigas,
    limparRealocacoesExpiradas,
    } = require('../../src/services/realocacoes.service.js');
    const { realocacoesJobFn } = require('../../src/jobs/realocacoesJob.js');

    describe('Job de realocações agendado', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    it('deve chamar os serviços de finalizar e limpar realocações ao executar o job', async () => {
        await realocacoesJobFn();
        expect(finalizarRealocacoesAntigas).toHaveBeenCalledWith(true);
        expect(limparRealocacoesExpiradas).toHaveBeenCalledWith(true);
    });

    it('deve chamar console.error se ocorrer um erro no job', async () => {
        const error = new Error('Erro simulado');
        finalizarRealocacoesAntigas.mockImplementationOnce(() => { throw error; });
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await realocacoesJobFn();

        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Erro ao executar o job automático de realocações:', error);
        consoleErrorSpy.mockRestore();
    });
    });
});