// Mock para axios usado na integração com a API da prefeitura
module.exports = {
  post: jest.fn((url, body) => {
    if (url === 'https://bora-impactar-dev.setd.rdmapps.com.br/api/login') {
      // Simula credenciais válidas
      if (body.email_ong === 'ong1@gmail.com' && body.password === '123456') {
        return Promise.resolve({
          data: {
            ong: {
              name: 'ONG Teste',
              logo_photo_url: ''
            },
            user: { email_ong: body.email_ong, name: 'Usuário Teste' },
            token: 'mocked-token',
            id_ong: 1,
            email_ong: body.email_ong
          }
        });
      } else {
        // Simula credenciais inválidas
        return Promise.reject(new Error('Request failed with status code 401'));
      }
    }
    // Outros endpoints podem ser simulados aqui
    return Promise.resolve({ data: {} });
  }),
  get: jest.fn(() => Promise.resolve({ data: {} })),
  // Adicione outros métodos se necessário
};
