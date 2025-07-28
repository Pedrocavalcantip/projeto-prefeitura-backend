// tests/integracao/realocacoes.get.test.js
jest.unmock('axios');

jest.mock('../../src/services/auth.service.js', () => ({
  loginNaApiPrefeitura: async (email_ong, password) => ({
    userData: { email_ong, name: 'Usuário Teste' },
    ongData:  { id_ong: 1, email_ong, name: 'ONG Teste', logo_url: 'https://exemplo.com/logo.png' }
  }),
  sincronizarOng: async (ongData) => ({
    id_ong:     ongData.id_ong,
    email_ong:  ongData.email_ong,
    nome:       ongData.name,
    logo_url:   ongData.logo_url
  })
}));

require('dotenv').config();
const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../../index');
const prisma  = require('../../src/config/database');

let token;

beforeAll(async () => {
  await prisma.ongs.upsert({
    where: { id_ong: 1 },
    update: {},
    create: {
      id_ong: 1,
      nome: 'ONG Teste',
      email_ong: 'ong1@gmail.com',
      logo_url: 'https://exemplo.com/logo.png'
    }
  });

  await prisma.ongs.upsert({
    where: { id_ong: 2 },
    update: {},
    create: {
      id_ong: 2,
      nome: 'ONG Teste 2',
      email_ong: 'ong2@gmail.com',
      logo_url: 'https://exemplo.com/logo2.png'
    }
  });

  token = jwt.sign(
    { id_ong: 1, email_ong: 'ong1@gmail.com' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});



describe('🔥 GET endpoints de realocações', () => {
  describe('GET /realocacoes/catalogo', () => {
    it('200: Retorna array de realocações ativas', async () => {
      const res = await request(app)
        .get('/realocacoes/catalogo')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body.every(r => r.status === 'ATIVA')).toBe(true);
      }
    });

    it('200: Filtra por título', async () => {
      const res = await request(app)
        .get('/realocacoes/catalogo?titulo=camisa')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      if (res.body.length > 0) {
        expect(res.body.every(r => r.titulo.toLowerCase().includes('camisa'))).toBe(true);
      }
    });

    it('200: Filtra por tipo_item', async () => {
      const res = await request(app)
        .get('/realocacoes/catalogo?tipo_item=roupa')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      if (res.body.length > 0) {
        expect(res.body.every(r => r.tipo_item.toLowerCase().includes('roupa'))).toBe(true);
      }
    });

    it('200: Filtra retornando vazio quando não há correspondência', async () => {
      const res = await request(app)
        .get('/realocacoes/catalogo?titulo=naoexiste&tipo_item=SemCategoria')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('200: Ordenação por criado_em crescente', async () => {
      const first = await request(app)
        .post('/realocacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          titulo:     'Primeiro criado',
          descricao:  'Criado antes',
          tipo_item:  'Outros',
          url_imagem: 'https://exemplo.com/img1.jpg',
          whatsapp:   '11999999999',
          email:      'ordem1@teste.com',
          quantidade: 1
        });

      await new Promise(r => setTimeout(r, 100)); // pequena pausa para garantir ordem de criação

      const second = await request(app)
        .post('/realocacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          titulo:     'Segundo criado',
          descricao:  'Criado depois',
          tipo_item:  'Outros',
          url_imagem: 'https://exemplo.com/img2.jpg',
          whatsapp:   '11999999999',
          email:      'ordem2@teste.com',
          quantidade: 1
        });

      const res = await request(app)
        .get('/realocacoes/catalogo')
        .set('Authorization', `Bearer ${token}`);

      const ids = res.body.map(r => r.id_produto);
      expect(ids).toContain(first.body.id_produto);
      expect(ids).toContain(second.body.id_produto);
      expect(ids.indexOf(first.body.id_produto)).toBeLessThan(ids.indexOf(second.body.id_produto));
    });


    it('401: Sem token', async () => {
      const res = await request(app).get('/realocacoes/catalogo');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/Token/);
    });
  });

  describe('GET /realocacoes/catalogo/:id', () => {
    let idRealocacao;
    beforeAll(async () => {
      const nova = {
        titulo:     'Realocação catálogo',
        descricao:  'Detalhe catálogo',
        tipo_item:  'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'catalogo@a.com',
        prazo_necessidade: '2025-09-26',
        quantidade: 1
      };
      const res = await request(app)
        .post('/realocacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(nova);
      idRealocacao = res.body.id_produto;
    });

    it('200: Retorna detalhes', async () => {
      const res = await request(app)
        .get(`/realocacoes/catalogo/${idRealocacao}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id_produto', idRealocacao);
    });

    

    it('401: Sem token', async () => {
      const res = await request(app).get(`/realocacoes/catalogo/${idRealocacao}`);
      expect(res.statusCode).toBe(401);
    });

    it('400: ID não numérico', async () => {
      const res = await request(app)
        .get('/realocacoes/catalogo/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(400);
    });

    it('404: ID inexistente', async () => {
      const res = await request(app)
        .get('/realocacoes/catalogo/999999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /realocacoes/minhas/ativas', () => {
    it('401: Sem token', async () => {
      const res = await request(app).get('/realocacoes/minhas/ativas');
      expect(res.statusCode).toBe(401);
    });

    it('200: Lista as ativas da ONG', async () => {
      const res = await request(app)
        .get('/realocacoes/minhas/ativas')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body.every(r => r.status === 'ATIVA')).toBe(true);
      }
    });
  });

  describe('GET /realocacoes/minhas/finalizadas', () => {
    it('401: Sem token', async () => {
      const res = await request(app).get('/realocacoes/minhas/finalizadas');
      expect(res.statusCode).toBe(401);
    });

    it('200: Lista as finalizadas da ONG', async () => {
      const res = await request(app)
        .get('/realocacoes/minhas/finalizadas')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});


describe('POST /realocacoes', () => {
  const dadosBase = {
    titulo:     'Realocação via POST',
    descricao:  'Item de teste',
    tipo_item:  'Roupas e Calçados',
    url_imagem: 'https://exemplo.com/img.jpg',
    whatsapp:   '11999999999',
    email:      'teste@ong.com',
    quantidade: 2
  };

  it('401: Sem token', async () => {
    const res = await request(app).post('/realocacoes').send(dadosBase);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Token/);
  });

  it('400: Sem imagem', async () => {
    const dadosSemImagem = { ...dadosBase };
    delete dadosSemImagem.url_imagem;

    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosSemImagem);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/imagem/);
  });

  it('201: Cria com URL de imagem', async () => {
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosBase);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_produto');
    expect(res.body.titulo).toBe(dadosBase.titulo);
  });

  it('400: Dados inválidos', async () => {
    const dadosInvalidos = { ...dadosBase, email: 'errado', whatsapp: '123' };

    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosInvalidos);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('201: Cria com upload de imagem (arquivo)', async () => {
    const caminho = 'tests/imagem-teste.jpg'; // caminho relativo ao projeto

    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .field('titulo',     'Realocação com upload')
      .field('descricao',  'Teste de imagem')
      .field('tipo_item',  'Utensílios Gerais')
      .field('whatsapp',   '11999999999')
      .field('email',      'upload@ong.com')
      .field('quantidade', '1')
      .attach('foto', caminho);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id_produto');
  });
});


describe('PUT e PATCH /realocacoes', () => {
  let idDaOng, idDeOutraOng;

  beforeAll(async () => {
    // Cria realocação para ONG 1 (usuário atual)
    const res1 = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo:     'Item da ONG 1',
        descricao:  'Descrição original',
        tipo_item:  'Outros',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'email@teste.com',
        
        quantidade: 1
      });
    idDaOng = res1.body.id_produto;

    // Cria realocação com outro token (ONG 2)
    const tokenOutraOng = jwt.sign(
      { id_ong: 2, email_ong: 'ong2@gmail.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res2 = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${tokenOutraOng}`)
      .send({
        titulo:     'Item da ONG 2',
        descricao:  'Descrição original',
        tipo_item:  'Outros',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'ong2@teste.com',
        quantidade: 1
      });
    idDeOutraOng = res2.body.id_produto;
  });

  // ---------- PUT ----------

  it('PUT 401: Sem token', async () => {
    const res = await request(app)
      .put(`/realocacoes/${idDaOng}`)
      .send({ titulo: 'Novo título' });
    expect(res.statusCode).toBe(401);
  });

  it('PUT 400: ID não numérico', async () => {
    const res = await request(app)
      .put('/realocacoes/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Novo título' });
    expect(res.statusCode).toBe(400);
  });

  it('PUT 404: ID inexistente', async () => {
    const res = await request(app)
      .put('/realocacoes/999999')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Novo título' });
    expect(res.statusCode).toBe(404);
  });

  it('PUT 403: ID de outra ONG', async () => {
    const res = await request(app)
      .put(`/realocacoes/${idDeOutraOng}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Tentativa de invasão' });
    expect(res.statusCode).toBe(403);
  });

  it('PUT 400: Dados inválidos (e-mail errado)', async () => {
    const res = await request(app)
      .put(`/realocacoes/${idDaOng}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
      titulo: 'Título atualizado',
      descricao: 'Nova descrição',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'emailerrado', // e-mail inválido
      quantidade: 2
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('email');
  });

  it('400: PUT com campos obrigatórios faltando', async () => {
    const res = await request(app)
      .put(`/realocacoes/${idDaOng}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Só o título' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/campo 'descricao' é obrigatório/);
  });

  it('PUT 200: Atualiza com sucesso', async () => {
  const res = await request(app)
    .put(`/realocacoes/${idDaOng}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      titulo: 'Título atualizado',
      descricao: 'Nova descrição',
      tipo_item: 'Roupas e Calçados',
      url_imagem: 'https://exemplo.com/img.jpg',
      whatsapp: '11999999999',
      email: 'teste@ong.com',
      quantidade: 2
    });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('titulo', 'Título atualizado');
});

  // ---------- PATCH ----------

  it('PATCH 400: ID não numérico', async () => {
    const res = await request(app)
      .patch('/realocacoes/abc/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('PATCH 404: ID inexistente', async () => {
    const res = await request(app)
      .patch('/realocacoes/999999/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('PATCH 403: ID de outra ONG', async () => {
    const res = await request(app)
      .patch(`/realocacoes/${idDeOutraOng}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('PATCH 200: Finaliza com sucesso', async () => {
    const res = await request(app)
      .patch(`/realocacoes/${idDaOng}/status`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'FINALIZADA');
  });
});

describe('DELETE /realocacoes/:id', () => {
  let idDaOng, idDeOutraOng;

  beforeAll(async () => {
    // Cria realocação da ONG 1
    const res1 = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo:     'Item para deletar',
        descricao:  'Será deletado',
        tipo_item:  'Outros',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'delete@ong.com',
        quantidade: 1
      });
    idDaOng = res1.body.id_produto;

    // Cria realocação da ONG 2
    const tokenOng2 = jwt.sign(
      { id_ong: 2, email_ong: 'ong2@gmail.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const res2 = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${tokenOng2}`)
      .send({
        titulo:     'Item de outra ONG',
        descricao:  'Não deve ser deletado',
        tipo_item:  'Outros',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'ong2@teste.com',
        quantidade: 1
      });
    idDeOutraOng = res2.body.id_produto;
  });

  it('401: Sem token', async () => {
    const res = await request(app).delete(`/realocacoes/${idDaOng}`);
    expect(res.statusCode).toBe(401);
  });

  it('400: ID não numérico', async () => {
    const res = await request(app)
      .delete('/realocacoes/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('404: ID inexistente', async () => {
    const res = await request(app)
      .delete('/realocacoes/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  it('403: ID de outra ONG', async () => {
    const res = await request(app)
      .delete(`/realocacoes/${idDeOutraOng}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('204: Deleta com sucesso', async () => {
    const res = await request(app)
      .delete(`/realocacoes/${idDaOng}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(204);
  });
  it('Recurso removido não aparece mais nem em “minhas” nem em “catalogo/:id”', async () => {
    await request(app)
      .delete(`/realocacoes/${idDaOng}`)
      .set('Authorization', `Bearer ${token}`);
    // GET minhas
    const min = await request(app)
      .get('/realocacoes/minhas/ativas')
      .set('Authorization', `Bearer ${token}`);
    expect(min.body.find(r => r.id_produto === idDaOng)).toBeUndefined();
    // GET detalhe
    const det = await request(app)
      .get(`/realocacoes/catalogo/${idDaOng}`)
      .set('Authorization', `Bearer ${token}`);
    expect(det.statusCode).toBe(404);
  });
});


describe('🗓️ Métodos automáticos: finalizar e limpar realocações expiradas', () => {
  beforeAll(async () => {
      const hoje = new Date();

      // Realocação ativa com mais de 60 dias (deve ser finalizada)
      await prisma.produtos.create({
        data: {
          titulo:     'Finalizável',
          descricao:  'Mais de 60 dias',
          tipo_item:  'Alimento',
          url_imagem: 'https://img.com/a.jpg',
          whatsapp:   '11999999999',
          email:      'teste@a.com',
          quantidade: 1,
          status:     'ATIVA',
          finalidade: 'REALOCACAO',
          criado_em:  new Date(hoje.setDate(hoje.getDate() - 61)),
          prazo_necessidade: new Date(hoje), // necessário para passar na validação
          ong_id:     1
        }
      });

      // Realocação finalizada com mais de 6 meses (deve ser excluída)
      await prisma.produtos.create({
        data: {
          titulo:        'Para limpar',
          descricao:     'Finalizada há mais de 6 meses',
          tipo_item:     'Outros',
          url_imagem:    'https://img.com/x.jpg',
          whatsapp:      '11999999999',
          email:         'teste@limpar.com',
          quantidade:    1,
          status:        'FINALIZADA',
          finalidade:    'REALOCACAO',
          finalizado_em: new Date(hoje.setMonth(hoje.getMonth() - 7)),
          prazo_necessidade: new Date(), // também obrigatório aqui
          ong_id:        1
      }
    });
  });


  it('Finaliza realocações ativas com mais de 60 dias', async () => {
    const { finalizarRealocacoesAntigas } = require('../../src/services/realocacoes.service');
    const resultado = await finalizarRealocacoesAntigas();
    expect(resultado).toHaveProperty('count');
    expect(resultado.count).toBeGreaterThanOrEqual(1);

    const atualizada = await prisma.produtos.findFirst({
      where: { titulo: 'Finalizável' }
    });
    expect(atualizada.status).toBe('FINALIZADA');
  });

  it('Remove realocações finalizadas há mais de 6 meses', async () => {
    const { limparRealocacoesExpiradas } = require('../../src/services/realocacoes.service');
    const resultado = await limparRealocacoesExpiradas();
    expect(resultado).toHaveProperty('totalExcluidas');
    expect(resultado.totalExcluidas).toBeGreaterThanOrEqual(1);

    const excluida = await prisma.produtos.findFirst({
      where: { titulo: 'Para limpar' }
    });
    expect(excluida).toBeNull();
  });
});
