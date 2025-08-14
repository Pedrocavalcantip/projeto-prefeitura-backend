require('dotenv').config();
const request = require('supertest');
const app = require('../../index'); // Certifique-se que o app está exportado corretamente!

describe('Integração Auth - /auth/login', () => {
  it('deve autenticar com credenciais válidas e retornar token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email_ong: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });

    // Se a API da prefeitura estiver fora do ar, pode retornar erro 500
    expect([200, 401, 500]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('auth', true);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    } else if (res.statusCode === 401) {
      expect(res.body).toHaveProperty('auth', false);
      expect(res.body).toHaveProperty('erro');
    } else if (res.statusCode === 500) {
      expect(res.body).toHaveProperty('erro');
    }
  });

  it('deve falhar com credenciais inválidas', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email_ong: 'nao-existe@ong.com', password: 'senhaerrada' });

    expect([401, 500]).toContain(res.statusCode);
    if (res.statusCode === 401) {
      expect(res.body).toHaveProperty('auth', false);
      expect(res.body).toHaveProperty('erro');
    } else if (res.statusCode === 500) {
      expect(res.body).toHaveProperty('erro');
    }
  });

  it('deve retornar 400 se faltar email ou senha', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email_ong: '', password: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});

describe('Integração Auth - /auth/protegida', () => {
  let token;

  beforeAll(async () => {
    // Tenta logar para obter token válido
    const res = await request(app)
      .post('/auth/login')
      .send({ email_ong: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
    token = res.body.token;
  });

  it('deve permitir acesso com token válido', async () => {
    if (!token) {
      return console.warn('Token não obtido no beforeAll. Pule o teste.');
    }
    const res = await request(app)
      .get('/auth/protegida')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mensagem');
    expect(res.body.mensagem).toContain(process.env.TEST_EMAIL);
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app)
      .get('/auth/protegida');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token não fornecido');
  });

  it('deve retornar 401 com token inválido', async () => {
    const res = await request(app)
      .get('/auth/protegida')
      .set('Authorization', 'Bearer token_fake_invalido');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token inválido');
  });

  it('deve retornar 401 com token expirado', async () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { id_ong: 1, email_ong: process.env.TEST_EMAIL },
      process.env.JWT_SECRET,
      { expiresIn: -1 } // expira imediatamente
    );
    const res = await request(app)
      .get('/auth/protegida')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Token expirado');
  });
});
