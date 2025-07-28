//autentificacao de login, teste de credenciais validas/ invalidas 
const request = require('supertest');
const app = require('../../index'); 
const jwt = require('jsonwebtoken');


//testa se o usuario consegue se autenticar e receber um token
describe( 'Autentificação - /auth/login', () => {
    it('autenticação com credenciais válidas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({email_ong:process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD});

        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('auth', true);
        expect(response.body).toHaveProperty('token');
        expect(typeof response.body.token).toBe('string');
    });

    it('falha com credenciais inválidas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({email_ong: 'ong@mail.com', password: 'senha_incorreta'});

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('auth', false);
        expect(response.body).toHaveProperty('erro');
    });

    it ('falha com email ou senha ausentes', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({email_ong: '', password: ''});

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });
});

describe ('Autentificação - /auth/protegida', () => {
    it('retorna 200 se enviar o token correto, junto com o email_ong', async () => {
        const email = process.env.TEST_EMAIL;
        const token = jwt.sign(
              { id_ong: 1, email_ong: email },
              process.env.JWT_SECRET,
              { expiresIn: '8h' }
        );

        const res = await request(app)
            .get('/auth/protegida')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('mensagem');
        expect(res.body.mensagem).toContain(email);
    });

    it ('retorna 401 se não enviar o token', async () => {
        const res = await request(app)
            .get('/auth/protegida');

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token não fornecido');
    });

    it ('retorna 401 se enviar o token no formato errado', async () => {
        const res = await request(app)
            .get('/auth/protegida')
            .set('Authorization', 'Bearer token_invalido');

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message', 'Token inválido');
    });

    it('retorna 401 se enviar um token expirado', async () => {
    const email = process.env.TEST_EMAIL;
    // Token expirado (expira em 1 segundo no passado)
    const token = jwt.sign(
        { id_ong: 1, email_ong: email },
        process.env.JWT_SECRET,
        { expiresIn: -1 }
    );

    const res = await request(app)
        .get('/auth/protegida')
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token inválido');
    });

    it('retorna 401 se enviar o token em formato inválido', async () => {
    const email = process.env.TEST_EMAIL;
    const token = jwt.sign(
        { id_ong: 1, email_ong: email },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    const res = await request(app)
        .get('/auth/protegida')
        .set('Authorization', `${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Formato do token inválido');
    });
});
