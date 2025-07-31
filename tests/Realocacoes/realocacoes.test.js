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
const realocacoesService = require('../../src/services/realocacoes.service');


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
      .field('email',      'teste@ong.com')
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
    console.log('PUT response:', res.body);
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
    console.log('Excluída:', excluida);
    expect(excluida).toBeNull();
  });
});



const caminhoImagem = 'tests/imagem-teste.jpg';

describe('POST /realocacoes - validação de campos', () => {
  const base = {
    titulo: 'Teste POST',
    descricao: 'Descricao teste',
    tipo_item: 'Roupas e Calçados',
    whatsapp: '11999999999',
    email: 'teste@ong.com',
    quantidade: 2,
    url_imagem: 'https://exemplo.com/img.jpg'
  };

  [
    'titulo', 'descricao', 'tipo_item', 'whatsapp', 'email',  'url_imagem'
  ].forEach(campo => {
    it(`400: Falta campo obrigatório '${campo}'`, async () => {
      const dados = { ...base };
      delete dados[campo];
      const res = await request(app)
        .post('/realocacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(dados);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(new RegExp(campo, 'i'));
    });
  });

  it('400: E-mail inválido', async () => {
    const dados = { ...base, email: 'invalido' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('400: Whatsapp inválido', async () => {
    const dados = { ...base, whatsapp: '1234' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/whatsapp/i);
  });

  it('400: quantidade zero', async () => {
    const dados = { ...base, quantidade: 0 };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/quantidade/i);
  });

  it('400: quantidade negativa', async () => {
    const dados = { ...base, quantidade: -5 };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/quantidade/i);
  });

  it('400: quantidade string não numérica', async () => {
    const dados = { ...base, quantidade: 'abc' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/quantidade/i);
  });

  it('400: tipo_item inválido', async () => {
    const dados = { ...base, tipo_item: 'NaoExiste' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/tipo_item/i);
  });

  it('400: url_imagem inválida', async () => {
    const dados = { ...base, url_imagem: 'url_incorreta' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/url_imagem/i);
  });

  it('201: Cria via upload de imagem (arquivo, sem url_imagem)', async () => {
    const { url_imagem, ...dados } = base;
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .field('titulo', dados.titulo)
      .field('descricao', dados.descricao)
      .field('tipo_item', dados.tipo_item)
      .field('whatsapp', dados.whatsapp)
      .field('email', dados.email)
      .field('quantidade', dados.quantidade.toString())
      .attach('foto', caminhoImagem);
    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id_produto');
  });

  // Campos extras inesperados
  it('201: Ignora campo extra inesperado', async () => {
    const dados = { ...base, extra: 'deve ser ignorado' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id_produto');
  });

  // Campo com tipo errado
  it('400: Campo whatsapp com letras', async () => {
    const dados = { ...base, whatsapp: 'abcdefghij' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/whatsapp/i);
  });

  it('400: Campo email vazio', async () => {
    const dados = { ...base, email: '' };
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });
});


describe('PUT /realocacoes/:id - validação de campos', () => {
  let id;
  const base = {
    titulo: 'PUT base',
    descricao: 'PUT descricao',
    tipo_item: 'Utensílios Gerais',
    whatsapp: '11988887777',
    email: 'put@ong.com',
    quantidade: 3,
    url_imagem: 'https://exemplo.com/img2.jpg'
  };

  beforeAll(async () => {
    const res = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(base);
    id = res.body.id_produto;
  });

  [
    'titulo', 'descricao', 'tipo_item', 'whatsapp', 'email', 'url_imagem'
  ].forEach(campo => {
    it(`400: PUT Falta campo obrigatório '${campo}'`, async () => {
      const dados = { ...base };
      delete dados[campo];
      const res = await request(app)
        .put(`/realocacoes/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(dados);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(new RegExp(campo, 'i'));
    });
  });

  it('400: PUT E-mail inválido', async () => {
    const dados = { ...base, email: 'invalido' };
    const res = await request(app)
      .put(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it('400: PUT Whatsapp inválido', async () => {
    const dados = { ...base, whatsapp: '1234' };
    const res = await request(app)
      .put(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/whatsapp/i);
  });

  it('400: PUT quantidade zero', async () => {
    const dados = { ...base, quantidade: 0 };
    const res = await request(app)
      .put(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/quantidade/i);
  });

  it('400: PUT tipo_item inválido', async () => {
    const dados = { ...base, tipo_item: 'Xablau' };
    const res = await request(app)
      .put(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/tipo_item/i);
  });

  it('400: PUT url_imagem inválida', async () => {
    const dados = { ...base, url_imagem: 'errada' };
    const res = await request(app)
      .put(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/url_imagem/i);
  });

  it('200: PUT - Atualiza imagem via upload de arquivo', async () => {
    const res = await request(app)
      .put(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('titulo', base.titulo)
      .field('descricao', base.descricao)
      .field('tipo_item', base.tipo_item)
      .field('whatsapp', base.whatsapp)
      .field('email', base.email)
      .field('quantidade', base.quantidade.toString())
      .attach('foto', caminhoImagem);
    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('id_produto');
  });

  it('400: PUT Campo extra inesperado', async () => {
    const dados = { ...base, inesperado: 'campo' };
    const res = await request(app)
      .put(`/realocacoes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dados);
    expect([200,400]).toContain(res.statusCode); // pode aceitar, pode ignorar, depende do service
  });
});

describe('PATCH /realocacoes/expiradas', () => {
  it('401: Sem token', async () => {
    const res = await request(app).patch('/realocacoes/expiradas');
    expect(res.statusCode).toBe(401);
  });

  it('200: Finaliza realocações antigas com sucesso', async () => {
    const res = await request(app)
      .patch('/realocacoes/expiradas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('idsFinalizadas');
  });
});

describe('DELETE /realocacoes/expiradas', () => {
  it('401: Sem token', async () => {
    const res = await request(app).delete('/realocacoes/expiradas');
    expect(res.statusCode).toBe(401);
    console.log('Resposta:', res.body);
  });

  it('200: Limpa realocações expiradas com sucesso', async () => {
    const res = await request(app)
      .delete('/realocacoes/expiradas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('detalhes');
    console.log('Resposta:', res.body);
  });
});


describe('Cobertura dos erros internos (catch) do realocacoes.controller.js', () => {
  let tokenLocal, idRealocacao, idUpdate, idPatch;

  beforeAll(async () => {
    // Gere o token localmente, igual ao seu beforeAll principal
    tokenLocal = token;

    // Crie IDs reais para update/patch/delete
    const res1 = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${tokenLocal}`)
      .send({
        titulo:     'Erro Interno update',
        descricao:  'Teste',
        tipo_item:  'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'update@ong.com',
        quantidade: 1
      });
    idUpdate = res1.body.id_produto;

    const res2 = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${tokenLocal}`)
      .send({
        titulo:     'Erro Interno patch',
        descricao:  'Teste',
        tipo_item:  'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'patch@ong.com',
        quantidade: 1
      });
    idPatch = res2.body.id_produto;

    const res3 = await request(app)
      .post('/realocacoes')
      .set('Authorization', `Bearer ${tokenLocal}`)
      .send({
        titulo:     'Erro Interno delete',
        descricao:  'Teste',
        tipo_item:  'Roupas e Calçados',
        url_imagem: 'https://exemplo.com/img.jpg',
        whatsapp:   '11999999999',
        email:      'delete@ong.com',
        quantidade: 1
      });
    idRealocacao = res3.body.id_produto;
  });

  function requireAppAndService() {
    jest.resetModules();
    const realocacoesService = require('../../src/services/realocacoes.service');
    const app = require('../../index');
    const request = require('supertest');
    return { realocacoesService, app, request };
  }

  it('500: findCatalogo erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'findCatalogoService').mockImplementation(() => {
      throw new Error('Fake erro 500');
    });
    const res = await request(app)
      .get('/realocacoes/catalogo')
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Fake erro 500');
    jest.restoreAllMocks();
  });

  it('500: findCatalogoById erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'findCatalogoByIdService').mockImplementation(() => {
      throw new Error('Fake erro 500');
    });
    const res = await request(app)
      .get(`/realocacoes/catalogo/${idRealocacao}`)
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Fake erro 500');
    jest.restoreAllMocks();
  });

  it('500: findMinhasAtivas erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'findMinhasRealocacoesAtivasService').mockImplementation(() => {
      throw new Error('Fake erro 500');
    });
    const res = await request(app)
      .get('/realocacoes/minhas/ativas')
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Erro interno ao listar realocações ativas.');
    jest.restoreAllMocks();
  });

  it('500: findMinhasFinalizadas erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'findMinhasRealocacoesFinalizadasService').mockImplementation(() => {
      throw new Error('Fake erro 500');
    });
    const res = await request(app)
      .get('/realocacoes/minhas/finalizadas')
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Erro interno ao listar realocações finalizadas.');
    jest.restoreAllMocks();
  });

   

  it('400: updateStatus erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'finalizarRealocacaoService').mockImplementation(() => {
      throw { status: 400, message: 'Fake erro 400' };
    });
    const res = await request(app)
      .patch(`/realocacoes/${idPatch}/status`)
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Fake erro 400');
    jest.restoreAllMocks();
  });

  it('500: finalizarRealocacoesAntigas erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'finalizarRealocacoesAntigas').mockImplementation(() => {
      throw new Error('Fake erro 500');
    });
    const res = await request(app)
      .patch('/realocacoes/expiradas')
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Erro interno ao finalizar realocações antigas.');
    jest.restoreAllMocks();
  });

  it('500: limparRealocacoesExpiradas erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'limparRealocacoesExpiradas').mockImplementation(() => {
      throw new Error('Fake erro 500');
    });
    const res = await request(app)
      .delete('/realocacoes/expiradas')
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Erro interno ao limpar realocações expiradas.');
    jest.restoreAllMocks();
  });

  it('500: deleteRealocacao erro interno', async () => {
    const { realocacoesService, app, request } = requireAppAndService();
    jest.spyOn(realocacoesService, 'deleteRealocacaoService').mockImplementation(() => {
      throw new Error('Fake erro 500');
    });
    const res = await request(app)
      .delete(`/realocacoes/${idRealocacao}`)
      .set('Authorization', `Bearer ${tokenLocal}`);
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Fake erro 500');
    jest.restoreAllMocks();
  });
});

describe('Validação de ID nos endpoints de realocação', () => {
  const rotas = [
    { metodo: 'get', url: id => `/realocacoes/catalogo/${id}` },
    { metodo: 'delete', url: id => `/realocacoes/${id}` }
  ];

  const idsInvalidos = ['abc', '0', '-1', '1.5', 'null', 'undefined'];

  rotas.forEach(({ metodo, url }) => {
    idsInvalidos.forEach(idInvalido => {
      it(`${metodo.toUpperCase()} retorna 400 para ID inválido: "${idInvalido}"`, async () => {
        const res = await request(app)[metodo](url(idInvalido))
          .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/id.*número.*maior que zero/i);
      });
    });
  });
});
