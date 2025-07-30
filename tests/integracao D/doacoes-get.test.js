// verificacao em ordem : get publico e privado.
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index'); 
const doacoesService = require('../../src/services/doacoes.service');
const prisma = require('../../src/config/database');

describe ('Doações -GET publico', () => {
    it('GET / deve retornar mensagem de status do servidor', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Servidor do Hub de Doações está no ar!');
    });

    it ('GET /doacoes deve retornar lista de doacoes ativas (sem o token)', async () => {
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

    it('GET /doacoes?titulo=TesteFiltroPublico&tipo_item=Roupas e Calçados deve filtrar por ambos (sem token)', async () => {
        const response = await request(app).get('/doacoes?titulo=TesteFiltroPublico&tipo_item=Roupas e Calçados');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.titulo.includes('TesteFiltroPublico') && d.tipo_item === 'Roupas e Calçados')).toBe(true);
        }
    });

    it('GET /doacoes?tipo_item=CategoriaInvalida deve retornar erro 400', async () => {
        const response = await request(app).get('/doacoes?tipo_item=CategoriaInvalida');
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('categorias válidas');
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

  it('GET /doacoes deve retornar 500 se ocorrer erro interno', async () => {
    const original = doacoesService.findAllDoacoesService;
    doacoesService.findAllDoacoesService = jest.fn().mockImplementation(() => {
        throw new Error('Erro simulado');
    });

    const res = await request(app).get('/doacoes');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/erro interno/i);

    doacoesService.findAllDoacoesService = original;
    });
});

describe ('GET /doacoes/prestes-a-vencer', () => {

    it('GET /doacoes/prestes-a-vencer deve retornar 200 e incluir doação com prazo_necessidade em 10 dias', async () => {
    // Cria uma doação com prazo_necessidade para daqui a 10 dias
    const token = jwt.sign(
        { id_ong: 1, email_ong: process.env.TEST_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 10);
    const prazoStr = prazo.toISOString().slice(0, 10);

    const doacaoData = {
        titulo: 'Doação Prestes a Vencer',
        descricao: 'Teste de prazo',
        tipo_item: 'Roupas e Calçados',
        quantidade: 1,
        prazo_necessidade: prazoStr,
        url_imagem: 'https://exemplo.com/imagem.jpg',
        urgencia: 'MEDIA',
        whatsapp: '11999999999',
        email: 'teste@exemplo.com'
    };

    await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacaoData);

    // Agora consulta as doações prestes a vencer
    const res = await request(app).get('/doacoes/prestes-a-vencer');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Deve conter pelo menos uma doação com o título criado
    expect(res.body.some(d => d.titulo === 'Doação Prestes a Vencer')).toBe(true);
    });

    it('deve retornar 200 e array vazio se não houver doações prestes a vencer', async () => {
    // Para garantir, você pode mockar o service:
    const original = doacoesService.findDoacoesPrestesAVencerService;
    doacoesService.findDoacoesPrestesAVencerService = jest.fn().mockResolvedValue([]);
    const res = await request(app).get('/doacoes/prestes-a-vencer');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
    doacoesService.findDoacoesPrestesAVencerService = original;
    });

  it('deve retornar 500 se ocorrer erro interno', async () => {
    const original = doacoesService.findDoacoesPrestesAVencerService;
    doacoesService.findDoacoesPrestesAVencerService = jest.fn().mockImplementation(() => {
      throw new Error('Erro simulado');
    });
    const res = await request(app).get('/doacoes/prestes-a-vencer');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/erro interno/i);
    doacoesService.findDoacoesPrestesAVencerService = original;
    });
});

describe ('GET /doacoes/:id', () => {
    it('GET /doacoes/:id deve retornar 200 e os dados da doação se o ID existir', async () => {
    // Cria uma doação para garantir que existe
    const token = jwt.sign(
        { id_ong: 1, email_ong: process.env.TEST_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    const doacaoData = {
        titulo: 'Doação Teste FindById',
        descricao: 'Teste',
        tipo_item: 'Roupas e Calçados',
        quantidade: 1,
        prazo_necessidade: '2025-12-31',
        url_imagem: 'https://exemplo.com/imagem.jpg',
        urgencia: 'MEDIA',
        whatsapp: '11999999999',
        email: 'teste@exemplo.com'
    };
    const createRes = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacaoData);

    const id = createRes.body.id_produto;
    const res = await request(app).get(`/doacoes/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id_produto', id);
    expect(res.body).toHaveProperty('titulo', doacaoData.titulo);
    });

    it('GET /doacoes/:id deve retornar 400 se o ID não for um número válido', async () => {
    const res = await request(app).get('/doacoes/abc');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/número válido/i);
    });

    it('GET /doacoes/:id deve retornar 400 se o ID for menor ou igual a zero', async () => {
    const res = await request(app).get('/doacoes/0');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/número válido/i);
    });

    it('GET /doacoes/:id deve retornar 404 se a doação não existir', async () => {
    const res = await request(app).get('/doacoes/999999'); // ID improvável de existir
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/não encontrada/i);
    });

    it('GET /doacoes/:id deve retornar 500 se ocorrer erro inesperado', async () => {
    const original = doacoesService.findByIdDoacaoService;
    doacoesService.findByIdDoacaoService = jest.fn().mockImplementation(() => {
        throw new Error('Erro simulado');
    });
    const res = await request(app).get('/doacoes/1');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/erro interno/i);
    doacoesService.findByIdDoacaoService = original;
    });

});

describe ('GET /doacoes/minhas/ativas', () => {
    it('GET /doacoes/minhas/ativas retorna 200 e lista de doações ativas da ONG', async () => {
    const token = jwt.sign(
        { id_ong: 1, email_ong: process.env.TEST_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    const res = await request(app)
        .get('/doacoes/minhas/ativas')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /doacoes/minhas/ativas retorna 401 se token for inválido', async () => {
        console.log('Iniciando teste GET /doacoes/minhas/ativas 401');
        const res = await request(app)
            .get('/doacoes/minhas/ativas')
            .set('Authorization', 'Bearer token_invalido');
        console.log('Resposta recebida do endpoint:', res.body);
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('message');
    });

    it('GET /doacoes/minhas/ativas retorna 500 se ocorrer erro interno', async () => {
    const token = jwt.sign(
        { id_ong: 1, email_ong: process.env.TEST_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    const original = doacoesService.findMinhasDoacoesAtivasService;
    doacoesService.findMinhasDoacoesAtivasService = jest.fn().mockImplementation(() => {
        throw new Error('Erro simulado');
    });
    const res = await request(app)
        .get('/doacoes/minhas/ativas')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    doacoesService.findMinhasDoacoesAtivasService = original;
    });
});

describe ('GET /doacoes/minhas/finalizadas', () => {
    beforeAll(async () => {
        // Cria uma doação para a ONG logada
        const token = jwt.sign(
            { id_ong: 1, email_ong: process.env.TEST_EMAIL },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        const doacaoData = {
            titulo: 'Doação Finalizada Teste',
            descricao: 'Teste de finalizada',
            tipo_item: 'Roupas e Calçados',
            quantidade: 1,
            prazo_necessidade: '2025-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };
        const res = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(doacaoData);

        // Atualiza o status para FINALIZADA
        await prisma.produtos.update({
            where: { id_produto: res.body.id_produto },
            data: { status: 'FINALIZADA', finalizado_em: new Date() }
        });
    });

    it('GET /doacoes/minhas/finalizadas retorna 200 e lista de doações finalizadas da ONG', async () => {
    const token = jwt.sign(
        { id_ong: 1, email_ong: process.env.TEST_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    const res = await request(app)
        .get('/doacoes/minhas/finalizadas')
        .set('Authorization', `Bearer ${token}`);
    console.log(res.body)
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /doacoes/minhas/finalizadas retorna 401 se token for inválido', async () => {
    const res = await request(app)
        .get('/doacoes/minhas/finalizadas')
        .set('Authorization', 'Bearer token_invalido');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
    });

    it('GET /doacoes/minhas/finalizadas retorna 500 se ocorrer erro interno', async () => {
    const token = jwt.sign(
        { id_ong: 1, email_ong: process.env.TEST_EMAIL },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    const original = doacoesService.findMinhasDoacoesFinalizadasService;
    doacoesService.findMinhasDoacoesFinalizadasService = jest.fn().mockImplementation(() => {
        throw new Error('Erro simulado');
    });
    const res = await request(app)
        .get('/doacoes/minhas/finalizadas')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('message');
    doacoesService.findMinhasDoacoesFinalizadasService = original;
    });
});