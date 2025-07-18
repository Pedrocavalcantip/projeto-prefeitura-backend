// verificacao em ordem : get publico e privado.

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index'); 

describe ('Doações -GET publico', () => {
    it (' deve retornar lista de doacoes ativas (sem o token)', async () => {
        const response = await request(app).get('/doacoes');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.status === 'ATIVA')).toBe(true);
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

// Teste de criacao de doacao 
describe ('Doacoes - POST (criacao)', () => {
    let token;

    beforeAll(async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;
        decoded = jwt.decode(token);
    });

    it( 'deve criar uma doacao com token valido', async () => {
        const novaDoacao = {
            titulo: 'Teste de Doação',
            descricao: 'Descrição da doação de teste',
            tipo_item: 'Alimento',
            quantidade: 10,
            prazo_necessidade: '2023-12-31'
    };

    const response = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(novaDoacao);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id_produto');
    expect(response.body.titulo).toBe(novaDoacao.titulo);

    });

    it( 'deve retornar erro 401 ao tentar criar doação sem token', async () => {
        const response = await request(app)
            .post('/doacoes')
            .send({
                titulo: 'Doação sem token',
                descricao: 'Descrição da doação sem token',
                tipo_item: 'Roupas',
                quantidade: 5,
                prazo_necessidade: '2023-12-31'
            });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    it ( 'deve retornar erro 400 se dados incompletos', async () => {
        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                titulo: '',
                descricao: '',
                tipo_item: '',
                quantidade: 1,
                prazo_necessidade: '2023-12-31'
            });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });
});

// teste de atualizacao de doacao put
describe('Doações - PUT (atualização)', () => {
    let token;
    let tokenOutraOng;
    let doacaoId;

    beforeAll(async () => {
        // Token da ONG principal
        const login = await request(app)
            .post('/auth/login')
            .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;

        // Simular token de outra ONG (para teste 403)
        tokenOutraOng = jwt.sign(
            { id_ong: 999, email: 'outra@ong.com' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Criar uma doação para testar a atualização
        const novaDoacao = {
            titulo: 'Doação para atualizar',
            descricao: 'Descrição original',
            tipo_item: 'Alimento',
            quantidade: 5,
            prazo_necessidade: '2023-12-31'
        };
        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);
        doacaoId = response.body.id_produto;
    });

    it('deve atualizar doação com token da ONG dona', async () => {
        const dadosAtualizados = {
            titulo: 'Doação Atualizada',
            descricao: 'Nova descrição',
            quantidade: 10
        };

        const response = await request(app)
            .put(`/doacoes/${doacaoId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(dadosAtualizados);

        expect(response.statusCode).toBe(200);
        expect(response.body.titulo).toBe(dadosAtualizados.titulo);
    });

    it('deve retornar erro 401 ao tentar atualizar sem token', async () => {
        const response = await request(app)
            .put(`/doacoes/${doacaoId}`)
            .send({ titulo: 'Tentativa sem token' });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro 403 ao tentar atualizar doação de outra ONG', async () => {
        const dadosAtualizados = {
            titulo: 'Tentativa de hack',
            descricao: 'ONG tentando alterar doação alheia'
        };

        const response = await request(app)
            .put(`/doacoes/${doacaoId}`)
            .set('Authorization', `Bearer ${tokenOutraOng}`)
            .send(dadosAtualizados);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Você não tem permissão para atualizar esta doação');
    });

    it('deve retornar erro 404 para ID inexistente', async () => {
        const response = await request(app)
            .put('/doacoes/99999')
            .set('Authorization', `Bearer ${token}`)
            .send({ titulo: 'Teste' });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
        const dadosInvalidos = {
            titulo: '', // título vazio
            quantidade: -5 // quantidade negativa
        };

        const response = await request(app)
            .put(`/doacoes/${doacaoId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(dadosInvalidos);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });
});

// atualizacao de status PATCH
describe ('Doações - PATCH (atualização de status)', () => {
    let token;
    let doacaoId;
    let tokenOutraOng;

    beforeAll(async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;

        // Simular token de outra ONG (para teste 403)
        tokenOutraOng = jwt.sign(
            { id_ong: 999, email: 'outra@ong.com' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Criar uma doação para testar a mudança de status
        const novaDoacao = {
            titulo: 'Doação para status',
            descricao: 'Teste de status',
            tipo_item: 'Roupas',
            quantidade: 3,
            prazo_necessidade: '2023-12-31'
        };
        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);
        doacaoId = response.body.id_produto;
    });

    it('deve atualizar status da doação', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('FINALIZADA');
    });

    it('deve retornar erro 401 ao tentar atualizar status sem token', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .send({ status: 'FINALIZADA' });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro 403 ao tentar atualizar status de doação de outra ONG', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${tokenOutraOng}`)
            .send({ status: 'ATIVA' });

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toContain('Você não tem permissão para modificar esta doação');
    });

    it('deve retornar erro 404 para ID inexistente no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/99999/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'CANCELADA' });

        expect(response.statusCode).toBe(404);
    });

    it('deve retornar erro 400 para status inválido', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'STATUS_INVALIDO' });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });
});

// Teste de exclusão de doação - DELETE
describe('Doações - DELETE (exclusão)', () => {
    let token;
    let tokenOutraOng;
    let doacaoId;

    beforeAll(async () => {
        // Token da ONG principal
        const login = await request(app)
            .post('/auth/login')
            .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;

        // Simular token de outra ONG (para teste 403)
        tokenOutraOng = jwt.sign(
            { id_ong: 999, email: 'outra@ong.com' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Criar uma doação para testar a exclusão
        const novaDoacao = {
            titulo: 'Doação para excluir',
            descricao: 'Descrição da doação que será excluída',
            tipo_item: 'Material',
            quantidade: 2,
            prazo_necessidade: '2023-12-31'
        };
        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);
        doacaoId = response.body.id_produto;
    });

    it('deve excluir doação com token da ONG dona', async () => {
        const response = await request(app)
            .delete(`/doacoes/${doacaoId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('excluída com sucesso');

        // Verificar se a doação foi realmente excluída
        const verificacao = await request(app)
            .get(`/doacoes/${doacaoId}`);
        expect(verificacao.statusCode).toBe(404);
    });

    it('deve retornar erro 401 ao tentar excluir sem token', async () => {
        // Criar nova doação para este teste
        const novaDoacao = {
            titulo: 'Doação teste 401',
            descricao: 'Teste exclusão sem token',
            tipo_item: 'Roupas',
            quantidade: 1,
            prazo_necessidade: '2023-12-31'
        };
        const criacaoResponse = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);
        
        const response = await request(app)
            .delete(`/doacoes/${criacaoResponse.body.id_produto}`);

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro 403 ao tentar excluir doação de outra ONG', async () => {
        // Criar nova doação para este teste
        const novaDoacao = {
            titulo: 'Doação teste 403',
            descricao: 'Teste exclusão por outra ONG',
            tipo_item: 'Brinquedos',
            quantidade: 1,
            prazo_necessidade: '2023-12-31'
        };
        const criacaoResponse = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);

        const response = await request(app)
            .delete(`/doacoes/${criacaoResponse.body.id_produto}`)
            .set('Authorization', `Bearer ${tokenOutraOng}`);

        expect(response.statusCode).toBe(403);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Você não tem permissão para excluir esta doação');
    });

    it('deve retornar erro 404 para ID inexistente no DELETE', async () => {
        const response = await request(app)
            .delete('/doacoes/99999')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message');
    });
});




