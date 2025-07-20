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

// GET portfólio público de realocações (catálogo entre ONGs)
describe('GET /realocacoes - portfólio público', () => {
  it('Retorna apenas realocações ativas (200)', async () => {
    const response = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.status === 'ATIVA')).toBe(true);
    }
  });
  it('Filtra por título (200)', async () => {
    const response = await request(app)
      .get('/realocacoes?titulo=camisa')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.titulo.toLowerCase().includes('camisa'))).toBe(true);
    }
  });
  it('Filtra por tipo_item (200)', async () => {
    const response = await request(app)
      .get('/realocacoes?tipo_item=roupa')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.tipo_item.toLowerCase().includes('roupa'))).toBe(true);
    }
  });

  // Casos de erro do GET portfólio público
  it('Sem token retorna 401', async () => {
    const response = await request(app).get('/realocacoes');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
  it('Com token sem id_ong retorna 401', async () => {
    const tokenSemOng = jwt.sign({ email: 'fake@user.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const response = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${tokenSemOng}`);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('ONG');
  });
  it('Com token de voluntário retorna 401', async () => {
    const tokenVoluntario = jwt.sign({ id_voluntario: 123, email: 'voluntario@teste.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const response = await request(app)
      .get('/realocacoes')
      .set('Authorization', `Bearer ${tokenVoluntario}`);
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('ONG');
  });
});

// GET privado (realocações da ONG logada)
describe('GET /realocacoes?minha=true - privado da ONG logada', () => {
  it('Retorna apenas realocações da ONG logada (200)', async () => {
    const response = await request(app)
      .get('/realocacoes?minha=true')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    if (response.body.length > 0) {
      expect(response.body.every(r => r.ong_id === decoded.id_ong)).toBe(true);
    }
  });

  // Erro de autenticação
  it('Sem token retorna 401', async () => {
    const response = await request(app).get('/realocacoes?minha=true');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
});

// GET detalhe de realocação
describe('GET /realocacoes/:id - detalhe da realocação', () => {
  it('Retorna detalhes da realocação (200)', async () => {
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

  // Casos de erro do GET detalhe
  it('Sem token no detalhe retorna 401', async () => {
    const response = await request(app).get('/realocacoes/1');
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
  });
  it('ID não numérico retorna 400', async () => {
    const response = await request(app)
      .get('/realocacoes/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('número válido');
  });
  it('ID inexistente retorna 404', async () => {
    const response = await request(app)
      .get('/realocacoes/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });
});

// 5. Criação

describe('Criação', () => {
  const camposObrigatorios = [
    'titulo',
    'descricao',
    'tipo_item',
    'url_imagem',
    'whatsapp',
    'email'
  ];

  it('POST /realocacoes com campo obrigatório nulo retorna 400', async () => {
    for (const campo of camposObrigatorios) {
      const novaRealocacao = {
        titulo: 'Teste',
        descricao: 'Teste',
        tipo_item: 'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com',
        quantidade: 1
      };
      novaRealocacao[campo] = null;
      const response = await request(app)
        .post('/realocacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(novaRealocacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain(`Campo obrigatório '${campo}' está ausente ou vazio.`);
    }
  });

  it('POST /realocacoes com campo obrigatório undefined retorna 400', async () => {
    for (const campo of camposObrigatorios) {
      const novaRealocacao = {
        titulo: 'Teste',
        descricao: 'Teste',
        tipo_item: 'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com',
        quantidade: 1
      };
      delete novaRealocacao[campo];
      const response = await request(app)
        .post('/realocacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(novaRealocacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain(`Campo obrigatório '${campo}' está ausente ou vazio.`);
    }
  });

  it('POST /realocacoes com campo obrigatório vazio retorna 400', async () => {
    for (const campo of camposObrigatorios) {
      const novaRealocacao = {
        titulo: 'Teste',
        descricao: 'Teste',
        tipo_item: 'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com',
        quantidade: 1
      };
      novaRealocacao[campo] = '';
      const response = await request(app)
        .post('/realocacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(novaRealocacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain(`Campo obrigatório '${campo}' está ausente ou vazio.`);
    }
  });

  it('POST /realocacoes com tipo_item inválido retorna 400', async () => {
    const novaRealocacao = {
      titulo: 'Teste',
      descricao: 'Teste',
      tipo_item: 'Invalido',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'a@a.com',
      quantidade: 1
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('tipo_item');
  });

  it('POST /realocacoes com url_imagem inválida retorna 400', async () => {
    const novaRealocacao = {
      titulo: 'Teste',
      descricao: 'Teste',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'imagem_invalida',
      whatsapp: '11999999999',
      email: 'a@a.com',
      quantidade: 1
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('url_imagem');
  });

  it('POST /realocacoes com email inválido retorna 400', async () => {
    const novaRealocacao = {
      titulo: 'Teste',
      descricao: 'Teste',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'emailinvalido',
      quantidade: 1
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Email');
  });

  it('POST /realocacoes com whatsapp inválido retorna 400', async () => {
    const novaRealocacao = {
      titulo: 'Teste',
      descricao: 'Teste',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: 'abc123',
      email: 'a@a.com',
      quantidade: 1
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Whatsapp');
  });

  it('POST /realocacoes com quantidade negativa retorna 400', async () => {
    const novaRealocacao = {
      titulo: 'Teste',
      descricao: 'Teste',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'a@a.com',
      quantidade: -5
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Quantidade deve ser um número maior que zero.');
  });

  it('POST /realocacoes com quantidade zero retorna 400', async () => {
    const novaRealocacao = {
      titulo: 'Teste',
      descricao: 'Teste',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'a@a.com',
      quantidade: 0
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Quantidade deve ser um número maior que zero.');
  });

  it('POST /realocacoes com campo extra é ignorado e cria normalmente', async () => {
    const novaRealocacao = {
      titulo: 'Teste',
      descricao: 'Teste',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'a@a.com',
      quantidade: 1,
      campo_extra: 'valor inesperado'
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id_produto');
    expect(response.body.titulo).toBe(novaRealocacao.titulo);
    expect(response.body).not.toHaveProperty('campo_extra');
  });

  it('POST /realocacoes com todos os campos obrigatórios cria', async () => {
    const novaRealocacao = {
      titulo: 'Realocação completa',
      descricao: 'Descrição completa',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/imagem.jpg',
      whatsapp: '11999999999',
      email: 'teste@exemplo.com',
      quantidade: 2
    };
    const response = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaRealocacao);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id_produto');
    expect(response.body.titulo).toBe(novaRealocacao.titulo);
    expect(response.body.descricao).toBe(novaRealocacao.descricao);
    expect(response.body.tipo_item).toBe(novaRealocacao.tipo_item);
    expect(response.body.url_imagem).toBe(novaRealocacao.url_imagem);
    expect(response.body.whatsapp).toBe(novaRealocacao.whatsapp);
    expect(response.body.email).toBe(novaRealocacao.email);
    expect(response.body.quantidade).toBe(novaRealocacao.quantidade);
  });

  it('POST /realocacoes sem token retorna 401', async () => {
    const response = await request(app)
      .post('/realocacoes')
      .send({
        titulo: 'Sem token',
        descricao: 'Erro esperado',
        tipo_item: 'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com'
      });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Token');
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
      .send({
        titulo: 'Realocação de teste PUT',
        descricao: 'Teste PUT',
        tipo_item: 'Roupas e Calçados', // categoria válida
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com',
        quantidade: 3
      });
    realocacaoId = response.body.id_produto;
  });

  it('PUT /realocacoes/:id pela ONG dona atualiza', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Atualizada',
        descricao: 'Atualizada desc',
        tipo_item: 'Utensílios Gerais', // categoria válida
        url_imagem: 'https://exemplo.com/atualizada.jpg',
        whatsapp: '11988888888',
        email: 'atualizada@a.com',
        quantidade: 5
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.titulo).toBe('Atualizada');
    expect(response.body.tipo_item).toBe('Utensílios Gerais');
    expect(response.body.url_imagem).toBe('https://exemplo.com/atualizada.jpg');
    expect(response.body.whatsapp).toBe('11988888888');
    expect(response.body.email).toBe('atualizada@a.com');
    expect(response.body.quantidade).toBe(5);
  });

  it('PUT /realocacoes/:id por outra ONG retorna 403', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${tokenOutraOng}`)
      .send({
        titulo: 'Teste',
        descricao: 'Teste',
        tipo_item: 'Roupas e Calçados', // categoria válida
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com',
        quantidade: 1
      });
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toContain('permissão');
  });

  it('PUT /realocacoes/:id inexistente retorna 404', async () => {
    const response = await request(app)
      .put('/realocacoes/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Teste',
        descricao: 'Teste',
        tipo_item: 'Roupas e Calçados', // categoria válida
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com',
        quantidade: 1
      });
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('não encontrada');
  });

  it('PUT /realocacoes/:id com dados inválidos retorna 400', async () => {
    const response = await request(app)
      .put(`/realocacoes/${realocacaoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: '',
        descricao: '',
        tipo_item: '',
        url_imagem: '',
        whatsapp: '',
        email: '',
        quantidade: 0
      });
    expect(response.statusCode).toBe(400);
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
    const nova = {
      titulo: 'Status PATCH',
      descricao: 'Para testar PATCH',
      tipo_item: 'Saúde e Higiene', // categoria válida
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'a@a.com',
      quantidade: 1
    };
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
    const nova = {
      titulo: 'Para deletar',
      descricao: 'Descrição',
      tipo_item: 'Roupas e Calçados', // categoria válida
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'a@a.com',
      quantidade: 1
    };
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
      .send({
        titulo: 'Realocação de outra ONG',
        descricao: 'Teste 403',
        tipo_item: 'Utensílios Gerais', // categoria válida
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp: '11999999999',
        email: 'a@a.com',
        quantidade: 1
      });
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
