// verificacao em ordem : get publico e privado.

const request = require('suepertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');

describe ('Doações -GET publico', () => {
    it (' deve retornar lista de doacoes ativass (sem o token)', async () => {
        const response = await request(app).get('/doacoes');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.doacoes)).toBe(true);

        if (response.body.doacoes.length > 0) {
            expect(response.body.every(d => dstatus === 'ATIVA')).toBe(true);
        }
    });

    it('GET /doacoes/:id deve retornar detalhes da doação (sem token)', async () => {
    // Primeiro, pega uma doação existente
    const lista = await request(app).get('/doacoes');
    if (lista.body.length === 0) return; // Nenhuma doação para testar
    const id = lista.body[0].id_produto;

    const response = await request(app).get(`/doacoes/${id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id_produto', id);
  });

  it('GET /doacoes/:id com ID inválido deve retornar erro 400', async () => {
    const response = await request(app).get('/doacoes/abc');
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});

// Verificação de doações privadas (ONG)
describe('Doações - GET privado', () => {
    let token;

    beforeAll(async () => {

        const login = await request(app)
            .post('/auth/login')
            .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;
        decoded = jwt.decode(token);
    });

    it('GET /doacoes?minha=true deve retornar doações da ONG (com token)', async () => {
        const response = await request(app)
            .get('/doacoes?minha=true')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.doacoes)).toBe(true);

        if (response.body.doacoes.length > 0) {
            expect(response.body.doacoes.every(d => d.ong_id === login.body.id_ong)).toBe(true);
        }
    });

    it ('GET /doacoes?minha=true sem token deve retornar erro 401', async () => {
        const response = await request(app)
            .get('/doacoes?minha=true');
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });
});