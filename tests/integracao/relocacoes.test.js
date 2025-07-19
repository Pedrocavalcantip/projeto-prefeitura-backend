// tests/integracao/relocacoes.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index');

let token;
let decoded;

beforeAll(async () => {
  const login = await request(app)
    .post('/auth/login')
    .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });

  token = login.body.token;
  decoded = jwt.decode(token);
});

describe('Realocações - GET sem token', () => {
  it('GET /realocacoes deve retornar 401 se não houver token', async () => {
    const response = await request(app).get('/realocacoes');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });

  it('GET /realocacoes/:id deve retornar 401 se não houver token', async () => {
    const response = await request(app).get('/realocacoes/1');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
});

describe('Realocações - GET com token', () => {
  it('GET /realocacoes deve retornar apenas realocações ativas', async () => {
    const response = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.status === 'ATIVA')).toBe(true);
    }
  });

  it('GET /realocacoes/:id com token deve retornar detalhes da realocação', async () => {
    const lista = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${token}`);

    if (lista.body.length === 0) return;

    const id = lista.body[0].id_realocacao;
    const response = await request(app)
      .get(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id_realocacao', id);
    expect(response.body.status).toBe('ATIVA');
  });

  it('GET /realocacoes/:id com ID inválido deve retornar 400', async () => {
    const response = await request(app)
      .get('/realocacoes/abc')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('número válido');
  });

  it('GET com ?titulo=camisa deve retornar títulos compatíveis', async () => {
    const response = await request(app)
      .get('/realocacoes?titulo=camisa')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.titulo.toLowerCase().includes('camisa'))).toBe(true);
    }
  });

  it('GET com ?tipo_item=roupa deve retornar itens compatíveis', async () => {
    const response = await request(app)
      .get('/realocacoes?tipo_item=roupa')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.tipo_item.toLowerCase().includes('roupa'))).toBe(true);
    }
  });

  it('GET com ?minha=true deve retornar apenas da ONG logada', async () => {
    const response = await request(app)
      .get('/realocacoes?minha=true')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.id_ong === decoded.id_ong)).toBe(true);
    }
  });
});

describe('Realocações - PUT (atualização)', () => {
  let realocacaoId;
  let tokenOutraOng;

  beforeAll(async () => {
    tokenOutraOng = jwt.sign(
      { id_ong: 999, email: 'outra@ong.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Realocação de teste PUT',
        descricao: 'Teste PUT',
        tipo_item: 'Alimento',
        quantidade: 3
      });

    realocacaoId = response.body.id_realocacao;
  });

  it('deve atualizar realocação com sucesso', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Atualizada',
        descricao: 'Atualizada desc',
        tipo_item: 'Roupas',
        quantidade: 5
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.titulo).toBe('Atualizada');
  });

  it('deve retornar 400 para dados inválidos', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: '', descricao: '', tipo_item: '' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('obrigatórios');
  });
});


describe('Realocações - POST (criação)', () => {
  let token;


  beforeAll(async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });


    token = login.body.token;
  });


  it('deve criar uma realocação com token válido', async () => {
    const novaRealocacao = {
      titulo: 'Realocação criada via teste',
      descricao: 'Descrição para teste de POST',
      tipo_item: 'Calçados',
      quantidade: 3
    };


    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);


    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id_realocacao');
    expect(response.body.titulo).toBe(novaRealocacao.titulo);
  });


  it('deve retornar 401 ao tentar criar sem token', async () => {
    const response = await request(app)
      .post('/realocacoes')
      .send({
        titulo: 'Sem token',
        descricao: 'Erro esperado',
        tipo_item: 'Alimento'
      });


    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });


  it('deve retornar 400 se dados estiverem incompletos ou inválidos', async () => {
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: '',
        descricao: '',
        tipo_item: ''
      });


    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('não podem estar vazios');
  });
});


describe('Realocações - PATCH (atualização de status)', () => {
  let token;
  let tokenOutraOng;
  let realocacaoId;


  beforeAll(async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });


    token = login.body.token;


    tokenOutraOng = jwt.sign(
      { id_ong: 999, email: 'outra@ong.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );


    const nova = {
      titulo: 'Status PATCH',
      descricao: 'Para testar PATCH',
      tipo_item: 'Higiene',
      quantidade: 1
    };


    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(nova);


    realocacaoId = response.body.id_realocacao;
  });


  it('deve atualizar status corretamente', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'FINALIZADA' });


    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('FINALIZADA');
  });


  it('deve retornar 401 sem token', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .send({ status: 'ATIVA' });


    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });


  it('deve retornar 403 ao alterar status de outra ONG', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .set('Authorization', `Bearer ${tokenOutraOng}`)
      .send({ status: 'ATIVA' });


    expect(response.statusCode).toBe(403);
    expect(response.body.message).toContain('permissão');
  });


  it('deve retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .patch('/realocacoes/99999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'FINALIZADA' });


    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });


  it('deve retornar 400 para status inválido', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INVALIDO' });


    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('inválido');
  });
});


describe('Realocações - DELETE', () => {
  let token;
  let tokenOutraOng;
  let realocacaoId;


  beforeAll(async () => {
    const login = await request(app)
      .post('/auth/login')
      .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });


    token = login.body.token;


    tokenOutraOng = jwt.sign(
      { id_ong: 999, email: 'outra@ong.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );


    const nova = {
      titulo: 'Para deletar',
      descricao: 'Descrição',
      tipo_item: 'Alimento',
      quantidade: 1
    };


    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(nova);


    realocacaoId = response.body.id_realocacao;
  });


  it('deve deletar realocação com sucesso', async () => {
    const response = await request(app)
      .delete(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`);


    expect(response.statusCode).toBe(204);
  });


  it('deve retornar 401 sem token', async () => {
    const response = await request(app)
      .delete(`/realocacoes/${realocacaoId}`);


    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });


  it('deve retornar 403 ao tentar deletar de outra ONG', async () => {
    const nova = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Realocação de outra ONG',
        descricao: 'Teste 403',
        tipo_item: 'Brinquedos',
        quantidade: 1
      });


    const response = await request(app)
      .delete(`/realocacoes/${nova.body.id_realocacao}`)
      .set('Authorization', `Bearer ${tokenOutraOng}`);


    expect(response.statusCode).toBe(403);
    expect(response.body.message).toContain('permissão');
  });


  it('deve retornar 404 para ID inexistente', async () => {
    const response = await request(app)
      .delete('/realocacoes/99999')
      .set('Authorization', `Bearer ${token}`);


    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });
});



