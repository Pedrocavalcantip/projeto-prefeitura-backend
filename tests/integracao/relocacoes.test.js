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

// 2. Acesso protegido

describe('Acesso protegido', () => {

  it('GET /realocacoes sem token retorna 401', async () => {
    const response = await request(app).get('/realocacoes');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });

  it('GET /realocacoes/:id sem token retorna 401', async () => {
    const response = await request(app).get('/realocacoes/1');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
  it('GET /realocacoes com token sem id_ong retorna 401', async () => {
    const tokenSemOng = jwt.sign({ email: 'fake@user.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const response = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${tokenSemOng}`);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('ONG');
  });

  it('GET /realocacoes com token de voluntário retorna 401', async () => {
    const tokenVoluntario = jwt.sign({ id_voluntario: 123, email: 'voluntario@teste.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const response = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${tokenVoluntario}`);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('ONG');
  });
});

// 3. Listagem

describe('Listagem', () => {

  it('GET /realocacoes retorna apenas realocações ativas', async () => {
    const response = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.status === 'ATIVA')).toBe(true);
    }
  });

  it('GET /realocacoes?minha=true retorna apenas da ONG logada', async () => {
    const response = await request(app)
      .get('/realocacoes?minha=true')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.ong_id === decoded.id_ong)).toBe(true);
    }
  });

  it('GET /realocacoes?titulo=camisa retorna títulos compatíveis', async () => {
    const response = await request(app)
      .get('/realocacoes?titulo=camisa')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.titulo.toLowerCase().includes('camisa'))).toBe(true);
    }
  });

  it('GET /realocacoes?tipo_item=roupa retorna itens compatíveis', async () => {
    const response = await request(app)
      .get('/realocacoes?tipo_item=roupa')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.tipo_item.toLowerCase().includes('roupa'))).toBe(true);
    }
  });
});

// 4. Detalhe

describe('Detalhe', () => {

  it('GET /realocacoes/:id retorna detalhes', async () => {
    const lista = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${token}`);
    if (lista.body.length === 0) return;
    const id = lista.body[0].id_produto;
    const response = await request(app)
      .get(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('id_produto', id);
    expect(response.body.status).toBe('ATIVA');
  });

  it('GET /realocacoes/:id com ID inválido retorna 400', async () => {
    const response = await request(app)
      .get('/realocacoes/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('número válido');
  });

  it('GET /realocacoes/:id inexistente retorna 404', async () => {
    const response = await request(app)
      .get('/realocacoes/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });
});

// 5. Criação

describe('Criação', () => {
  
  it('POST /realocacoes com token válido cria', async () => {
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
    expect(response.body).toHaveProperty('id_produto');
    expect(response.body.titulo).toBe(novaRealocacao.titulo);
  });
  it('POST /realocacoes sem token retorna 401', async () => {
    const response = await request(app)
      .post('/realocacoes')
      .send({ titulo: 'Sem token', descricao: 'Erro esperado', tipo_item: 'Alimento' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
  it('POST /realocacoes com dados inválidos retorna 400', async () => {
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: '', descricao: '', tipo_item: '' });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('não podem estar vazios');
  });
});

// 6. Atualização

describe('Atualização', () => {
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
      .send({ titulo: 'Realocação de teste PUT', descricao: 'Teste PUT', tipo_item: 'Alimento', quantidade: 3 });
    realocacaoId = response.body.id_produto;
  });
  it('PUT /realocacoes/:id pela ONG dona atualiza', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Atualizada', descricao: 'Atualizada desc', tipo_item: 'Roupas', quantidade: 5 });
    expect(response.statusCode).toBe(200);
    expect(response.body.titulo).toBe('Atualizada');
  });
  it('PUT /realocacoes/:id por outra ONG retorna 403', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${tokenOutraOng}`)
      .send({ titulo: 'Teste', descricao: 'Teste', tipo_item: 'Teste' });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toContain('permissão');
  });
  it('PUT /realocacoes/:id inexistente retorna 404', async () => {
    const response = await request(app)
      .put('/realocacoes/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Teste', descricao: 'Teste', tipo_item: 'Teste' });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });
  it('PUT /realocacoes/:id com dados inválidos retorna 400', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: '', descricao: '', tipo_item: '' });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('obrigatórios');
  });
});

// 7. Atualização de status

describe('Atualização de status', () => {
  let realocacaoId;
  let tokenOutraOng;
  beforeAll(async () => {
    tokenOutraOng = jwt.sign(
      { id_ong: 999, email: 'outra@ong.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const nova = { titulo: 'Status PATCH', descricao: 'Para testar PATCH', tipo_item: 'Higiene', quantidade: 1 };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(nova);
    realocacaoId = response.body.id_produto;
  });
  it('PATCH /realocacoes/:id/status pela ONG dona atualiza', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'FINALIZADA' });
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('FINALIZADA');
  });
  it('PATCH /realocacoes/:id/status por outra ONG retorna 403', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .set('Authorization', `Bearer ${tokenOutraOng}`)
      .send({ status: 'ATIVA' });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toContain('permissão');
  });
  it('PATCH /realocacoes/:id/status inexistente retorna 404', async () => {
    const response = await request(app)
      .patch('/realocacoes/99999/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'FINALIZADA' });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });
  it('PATCH /realocacoes/:id/status com status inválido retorna 400', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INVALIDO' });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('inválido');
  });
  it('PATCH /realocacoes/:id/status sem token retorna 401', async () => {
    const response = await request(app)
      .patch(`/realocacoes/${realocacaoId}/status`)
      .send({ status: 'ATIVA' });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
});

// 8. Exclusão

describe('Exclusão', () => {
  let realocacaoId;
  let tokenOutraOng;
  beforeAll(async () => {
    tokenOutraOng = jwt.sign(
      { id_ong: 999, email: 'outra@ong.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const nova = { titulo: 'Para deletar', descricao: 'Descrição', tipo_item: 'Alimento', quantidade: 1 };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(nova);
    realocacaoId = response.body.id_produto;
  });
  it('DELETE /realocacoes/:id pela ONG dona deleta', async () => {
    const response = await request(app)
      .delete(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(204);
  });
  it('DELETE /realocacoes/:id por outra ONG retorna 403', async () => {
    const nova = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Realocação de outra ONG', descricao: 'Teste 403', tipo_item: 'Brinquedos', quantidade: 1 });
    const response = await request(app)
      .delete(`/realocacoes/${nova.body.id_produto}`)
      .set('Authorization', `Bearer ${tokenOutraOng}`);
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toContain('permissão');
  });
  it('DELETE /realocacoes/:id inexistente retorna 404', async () => {
    const response = await request(app)
      .delete('/realocacoes/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });
  it('DELETE /realocacoes/:id sem token retorna 401', async () => {
    const response = await request(app)
      .delete(`/realocacoes/${realocacaoId}`);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
});
