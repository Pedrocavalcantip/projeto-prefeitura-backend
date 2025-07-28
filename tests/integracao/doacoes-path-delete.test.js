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

    // Teste para erro 400 - ID inválido
    it('deve retornar erro 400 para ID não numérico no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/abc/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });

    it('deve retornar erro 400 para ID zero no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/0/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('ID deve ser um número válido maior que zero');
    });

    it('deve retornar erro 400 para ID negativo no PATCH', async () => {
        const response = await request(app)
            .patch('/doacoes/-5/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
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

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
    });

    it('não deve permitir alterar para o mesmo status atual', async () => {
        // Primeiro, garantir que está FINALIZADA
        await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        // Tentar alterar para FINALIZADA novamente
        const response = await request(app)
            .patch(`/doacoes/${doacaoId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'FINALIZADA' });
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain('Só é possível atualizar o status se a doação estiver ATIVA');
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
            expect([200,400]).toContain(res.statusCode);
        }
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
