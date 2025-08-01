// MOCK AQUI PRIMEIRO
jest.mock('../../src/services/auth.service.js', () => ({
  loginNaApiPrefeitura: jest.fn().mockResolvedValue({
    user: { email: 'ong1@gmail.com' },
    ngo: { name: 'ONG Teste', logo_photo_url: 'https://logo.png' }
  }),
  sincronizarOng: jest.fn().mockResolvedValue({
    id_ong: 1,
    email_ong: 'ong1@gmail.com'
  })
}));

// DEPOIS OS IMPORTS
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index');

// atualizacao de status PATCH
describe ('Doações - PATCH (atualização de status)', () => {
    let token;
    let doacaoId;
    let tokenOutraOng;

    beforeAll(async () => {
        // Token da ONG principal
        const login = await request(app)
          .post('/auth/login')
          .send({ email_ong: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;

        const doacaoCriada = await request(app)
          .post('/doacoes')
          .set('Authorization', `Bearer ${token}`)
          .send({
            titulo: 'Doação para PUT',
            descricao: 'Teste PUT',
            tipo_item: 'Roupas e Calçados',
            quantidade: 1,
            prazo_necessidade: '2025-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        });
      doacaoId = doacaoCriada.body.id_produto;

        // Simular token de outra ONG (para teste 403)
        tokenOutraOng = jwt.sign(
            { id_ong: 999, email: 'outra@ong.com' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );
    });
    
    //operacao correta
     
    it('deve atualizar status da doação', async () => {
        console.log('doacaoId:', doacaoId); // <-- log separado
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });

        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('FINALIZADA');
    });

    it('deve retornar erro 401 se o token for inválido', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', 'Bearer token_invalido')
            .send({ status: 'FINALIZADA' });
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBeDefined();
    });

    it('deve retornar erro 401 se o token estiver expirado', async () => {
        const expiredToken = jwt.sign(
            { id_ong: 1, email_ong: 'teste@exemplo.com' },
            process.env.JWT_SECRET,
            { expiresIn: '-1h' }
        );
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${expiredToken}`)
            .send({ status: 'FINALIZADA' });
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBeDefined();
    });

    // Teste para erro 401
    it('deve retornar erro 401 ao tentar atualizar status sem token', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .send({ status: 'FINALIZADA' });
        console.log('Response sem token:', response.body);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    // Teste para erro 403
    it('deve retornar erro 403 ao tentar atualizar status de doação de outra ONG', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${tokenOutraOng}`)
            .send({ status: 'ATIVA' });

        console.log('Response com token de outra ONG:', response.body);
        expect(response.statusCode).toBe(403);
        expect(response.body.message).toContain('Você não tem permissão para modificar esta doação');
    });
    
    // Teste para erro 404 
    it('deve retornar erro 404 para ID inexistente no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/99999/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });

        console.log('Response com ID inexistente:', response.body);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message');
    });

    // Teste para erro 400 - ID inválido
    it('deve retornar erro 400 para ID não numérico no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/abc/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        
        console.log('Response com ID não numérico:', response.body);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });

    it('deve retornar erro 400 para ID zero no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/0/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        
        console.log('Response com ID zero:', response.body);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });

    it('deve retornar erro 400 para ID negativo no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/-5/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        
        console.log('Response com ID negativo:', response.body);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });

    // Teste para erro 400 ( aqui o status é importante verificar)
    it('deve retornar erro 400 para status inválido', async () => {
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'STATUS_INVALIDO' });

        console.log('Response com status inválido:', response.body);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });

    it('não deve permitir alterar para o mesmo status atual', async () => {
        await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        console.log(response.body);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain(`A doação já está com o status 'FINALIZADA'.`);
    });

    it('não deve permitir alterar status se já estiver FINALIZADA', async () => {
        // Garantir que está FINALIZADA
        await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        // Tentar reativar
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'ATIVA' });
        console.log(response.body);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain('Só é possível atualizar o status se a doação estiver ATIVA');
    });

    it('deve aceitar apenas valores permitidos para status', async () => {
        // Testar apenas os valores permitidos
        for (const status of ['ATIVA', 'FINALIZADA']) {
            const res = await request(app)
                .patch(`/doacoes/${doacaoId}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status });
            // Aceita 200 ou 400 se já estiver FINALIZADA
            console.log(`Status: ${status}, Response: ${res.statusCode}`);
            expect([200,400]).toContain(res.statusCode);
        }
    });
});

// Deletar doação
describe ('Doações - DELETE (exclusão)', () => {
    let token;
    let tokenOutraOng;

    beforeAll(async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ email_ong: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;

        tokenOutraOng = jwt.sign(
            { id_ong: 999, email_ong: 'outra@ong.com' }, 
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
            prazo_necessidade: '2025-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };
        const criacaoResponse = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(novaDoacao);

        console.log('Token usado no DELETE:', token)
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
            prazo_necessidade: '2025-12-31',
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
            prazo_necessidade: '2025-12-31',
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
    // teste para erro 400 - ID não numérico
    it('deve retornar erro 400 para ID não numérico no DELETE', async () => {
        const response = await request(app)
            .delete('/doacoes/abc')
            .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });

    // teste para erro 400 - ID zero
    it('deve retornar erro 400 para ID zero no DELETE', async () => {
        const response = await request(app)
            .delete('/doacoes/0')
            .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });

    // teste para erro 400 - ID negativo
    it('deve retornar erro 400 para ID negativo no DELETE', async () => {
        const response = await request(app)
            .delete('/doacoes/-5')
            .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });
});
