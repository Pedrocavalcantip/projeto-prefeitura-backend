// verificacao em ordem : get publico e privado.
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index'); 

describe ('Doações -GET publico', () => {
    it('GET / deve retornar mensagem de status do servidor', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Servidor do Hub de Doações está no ar!');
    });
    
    it (' deve retornar lista de doacoes ativas (sem o token)', async () => {
        const response = await request(app).get('/doacoes');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.status === 'ATIVA')).toBe(true);
        }
    });

    it('GET /doacoes?titulo=Teste deve filtrar por título (sem token)', async () => {
        // Cria uma doação específica para garantir o filtro
        await request(app)
            .post('/doacoes')
            .send({
                titulo: 'TesteFiltroPublico',
                descricao: 'Doação para filtro público',
                tipo_item: 'Roupas e Calçados',
                quantidade: 1,
                prazo_necessidade: '2025-12-31',
                url_imagem: 'https://exemplo.com/imagem.jpg',
                urgencia: 'MEDIA',
                whatsapp: '11999999999',
                email: 'teste@exemplo.com'
            });
        const response = await request(app).get('/doacoes?titulo=TesteFiltroPublico');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.titulo.includes('TesteFiltroPublico'))).toBe(true);
        }
    });

    it('GET /doacoes?tipo_item=Roupas e Calçados deve filtrar por tipo_item (sem token)', async () => {
        const response = await request(app).get('/doacoes?tipo_item=Roupas e Calçados');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.tipo_item === 'Roupas e Calçados')).toBe(true);
        }
    });

    it('GET /doacoes?tipo_item=CategoriaInvalida deve retornar erro 400', async () => {
        const response = await request(app).get('/doacoes?tipo_item=CategoriaInvalida');
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('categorias válidas');
    });

    it('GET /doacoes?titulo=TesteFiltroPublico&tipo_item=Roupas e Calçados deve filtrar por ambos (sem token)', async () => {
        const response = await request(app).get('/doacoes?titulo=TesteFiltroPublico&tipo_item=Roupas e Calçados');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.titulo.includes('TesteFiltroPublico') && d.tipo_item === 'Roupas e Calçados')).toBe(true);
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
    let decoded;

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
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.ong_id === decoded.id_ong)).toBe(true);
        }
    });

    it ('GET /doacoes?minha=true sem token deve retornar erro 401', async () => {
        const response = await request(app)
            .get('/doacoes?minha=true');
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });
});

