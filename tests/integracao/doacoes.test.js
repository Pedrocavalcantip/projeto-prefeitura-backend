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

    it('GET /doacoes?tipo_item=CategoriaInvalida deve retornar erro 400', async () => {
        const response = await request(app).get('/doacoes?tipo_item=CategoriaInvalida');
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('categorias válidas');
    });

    it('GET /doacoes?titulo=TesteFiltroPublico&tipo_item=Roupas e Calçados deve filtrar por ambos (sem token)', async () => {
        const response = await request(app).get('/doacoes?titulo=TesteFiltroPublico&tipo_item=Roupas e Calçados');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
            expect(response.body.every(d => d.titulo.includes('TesteFiltroPublico') && d.tipo_item === 'Roupas e Calçados')).toBe(true);
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
    let decoded;

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
    let decoded;

    beforeAll(async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;
        decoded = jwt.decode(token);
    });

    // operação correta
    it( 'deve criar uma doacao com token valido', async () => {
        const novaDoacao = {
            titulo: 'Teste de Doação',
            descricao: 'Descrição da doação de teste',
            tipo_item: 'Roupas e Calçados', // categoria válida
            quantidade: 10,
            prazo_necessidade: '2023-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };

        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id_produto');
        expect(response.body.titulo).toBe(novaDoacao.titulo);
    });

    it('deve retornar erro 400 ao criar doação com categoria inválida', async () => {
        const novaDoacao = {
            titulo: 'Teste Categoria Inválida',
            descricao: 'Descrição',
            tipo_item: 'CategoriaInvalida', // categoria inválida
            quantidade: 5,
            prazo_necessidade: '2023-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };
        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('categorias válidas');
    });

    // teste para erro 401
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

    // teste para erro 400 - campos obrigatórios
    const camposObrigatorios = [
      'titulo', 'descricao', 'tipo_item', 'prazo_necessidade', 'url_imagem', 'urgencia', 'whatsapp', 'email'
    ];
    camposObrigatorios.forEach(campo => {
      it(`deve retornar erro 400 se campo obrigatório '${campo}' estiver ausente ou vazio`, async () => {
        const doacaoValida = {
          titulo: 'Teste',
          descricao: 'desc',
          tipo_item: 'Roupas e Calçados',
          quantidade: 1,
          prazo_necessidade: '2023-12-31',
          url_imagem: 'https://exemplo.com/imagem.jpg',
          urgencia: 'MEDIA',
          whatsapp: '11999999999',
          email: 'teste@exemplo.com'
        };
        doacaoValida[campo] = '';
        const response = await request(app)
          .post('/doacoes')
          .set('Authorization', `Bearer ${token}`)
          .send(doacaoValida);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(campo);
      });
    });
});

// teste de atualizacao de doacao PUT
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
            tipo_item: 'Utensílios Gerais',
            quantidade: 5,
            prazo_necessidade: '2023-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };
        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);
        doacaoId = response.body.id_produto;
    });

    // operação correta
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

    // teste para erro 401
    it('deve retornar erro 401 ao tentar atualizar sem token', async () => {
        const response = await request(app)
            .put(`/doacoes/${doacaoId}`)
            .send({ titulo: 'Tentativa sem token' });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    // teste para erro 403
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
        expect(response.body.message).toContain('Você não tem permissão para modificar esta doação');
    });

    // teste para erro 404 ( id inexistente) 
    it('deve retornar erro 404 para ID inexistente', async () => {
        const response = await request(app)
            .put('/doacoes/99999')
            .set('Authorization', `Bearer ${token}`)
            .send({ titulo: 'Teste' });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message');
    });

    // teste para erro 400
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
            tipo_item: 'Itens Pet',
            quantidade: 3,
            prazo_necessidade: '2023-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };
        // Criar a doação e obter o ID
        const response = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);
        doacaoId = response.body.id_produto;
    });
    
    //operacao correta 
    it('deve atualizar status da doação', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('FINALIZADA');
    });

    // Teste para erro 401
    it('deve retornar erro 401 ao tentar atualizar status sem token', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .send({ status: 'FINALIZADA' });

        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    // Teste para erro 403
    it('deve retornar erro 403 ao tentar atualizar status de doação de outra ONG', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${tokenOutraOng}`)
            .send({ status: 'ATIVA' });

        expect(response.statusCode).toBe(403);
        expect(response.body.message).toContain('Você não tem permissão para modificar esta doação');
    });
    
    // Teste para erro 404 
    it('deve retornar erro 404 para ID inexistente no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/99999/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });

        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message');
    });

    // Teste para erro 400 ( aqui o status é importante verificar)
    it('deve retornar erro 400 para status inválido', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'STATUS_INVALIDO' });

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });
});

// Deletar doação
describe('Doações - DELETE (exclusão)', () => {
    let token;
    let tokenOutraOng;

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
    });

    it('deve excluir doação com token da ONG dona', async () => {
        // Criar doação específica para este teste
        const novaDoacao = {
            titulo: 'Doação para excluir - sucesso',
            descricao: 'Teste de exclusão bem-sucedida',
            tipo_item: 'Saúde e Higiene',
            quantidade: 1,
            prazo_necessidade: '2023-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };
        const criacaoResponse = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);

        const response = await request(app)
            .delete(`/doacoes/${criacaoResponse.body.id_produto}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(204);

        // Verificar se foi excluída
        const verificacao = await request(app)
            .get(`/doacoes/${criacaoResponse.body.id_produto}`);
        expect(verificacao.statusCode).toBe(404);
    });

    // teste para erro 401
    it('deve retornar erro 401 ao tentar excluir sem token', async () => {
        // Criar nova doação para este teste
        const novaDoacao = {
            titulo: 'Doação teste 401',
            descricao: 'Teste exclusão sem token',
            tipo_item: 'Materiais Educativos e Culturais',
            quantidade: 1,
            prazo_necessidade: '2023-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
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

    // teste para erro 403
    it('deve retornar erro 403 ao tentar excluir doação de outra ONG', async () => {
        // Criar nova doação para este teste
        const novaDoacao = {
            titulo: 'Doação teste 403',
            descricao: 'Teste exclusão por outra ONG',
            tipo_item: 'Eletrônicos',
            quantidade: 1,
            prazo_necessidade: '2023-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
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
        expect(response.body.message).toContain('Você não tem permissão para deletar esta doação');
    });

    // teste para erro 404 
    it('deve retornar erro 404 para ID inexistente no DELETE', async () => {
        const response = await request(app)
            .delete('/doacoes/99999')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(404); // Agora deve ser 404 em vez de 403
        expect(response.body).toHaveProperty('message');
    });
});






