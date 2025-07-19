//autentificacao de login, teste de credenciais validas/ invalidas 
const request = require('supertest');
const app = require('../../index'); 

describe( 'Autentificação - Login', () => {
    it('autenticação com credenciais válidas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({email:process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD});

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('auth', true);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
    });

    it('falha com credenciais inválidas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({email: 'ong@mail.com', password: 'senha_incorreta'});

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('auth', false);
        expect(response.body).toHaveProperty('erro');
    });

    it ('falha com email ou senha ausentes', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({email: '', password: ''});

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });
});