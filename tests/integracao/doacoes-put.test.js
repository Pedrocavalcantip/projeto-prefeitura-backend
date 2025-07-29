const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index'); 

describe('Doações - PUT (atualização)', () => {
    let token;
    let tokenOutraOng;
    const doacaoId = 30; // Usando produto já existente no banco

    beforeAll(async () => {
        // Token da ONG principal
        const login = await request(app)
            .post('/auth/login')
            .send({ email_ong: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD });
        token = login.body.token;

        // Simular token de outra ONG (para teste 403)
        tokenOutraOng = jwt.sign(
            { id_ong: 999, email: 'outra@ong.com' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );
    });

    it('deve atualizar doação com token da ONG dona', async () => {
        const dadosAtualizados = {
            titulo: 'Doação Atualizada',
            descricao: 'Nova descrição',
            tipo_item: 'Utensílios Gerais',
            quantidade: 10,
            prazo_necessidade: '2025-11-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };

        const response = await request(app)
            .put(`/doacoes/${doacaoId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(dadosAtualizados);

        console.log('PUT response:', response.body);
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
            titulo: 'Doação Atualizada',
            descricao: 'Nova descrição',
            tipo_item: 'Utensílios Gerais',
            quantidade: 10,
            prazo_necessidade: '2025-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
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
        const dadosAtualizados = {
            titulo: 'Doação Atualizada',
            descricao: 'Nova descrição',
            tipo_item: 'Utensílios Gerais',
            quantidade: 10,
            prazo_necessidade: '2025-12-31',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'teste@exemplo.com'
        };
        const response = await request(app)
            .put('/doacoes/99999')
            .set('Authorization', `Bearer ${token}`)
            .send(dadosAtualizados);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('message');
    });

    // teste para erro 400 - campos obrigatórios PUT
    const obrigatorios = ['titulo', 'descricao', 'tipo_item', 'url_imagem', 'whatsapp', 'email'];
    obrigatorios.forEach(campo => {
      it(`deve retornar erro 400 no PUT se campo obrigatório '${campo}' estiver ausente ou vazio`, async () => {
        const doacaoValida = {
          titulo: 'Teste',
          descricao: 'desc',
          tipo_item: 'Roupas e Calçados',
          quantidade: 1,
          prazo_necessidade: '2025-12-31',
          url_imagem: 'https://exemplo.com/imagem.jpg',
          urgencia: 'MEDIA',
          whatsapp: '11999999999',
          email: 'teste@exemplo.com'
        };
        doacaoValida[campo] = '';
        const response = await request(app)
          .put(`/doacoes/${doacaoId}`)
          .set('Authorization', `Bearer ${token}`)
          .send(doacaoValida);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(campo);
      });
    });

    it('deve retornar erro 400 para quantidade negativa', async () => {
      const dadosInvalidos = {
        titulo: 'Teste',
        descricao: 'desc',
        tipo_item: 'Roupas e Calçados',
        quantidade: -5,
        prazo_necessidade: '2025-12-31',
        url_imagem: 'https://exemplo.com/imagem.jpg',
        urgencia: 'MEDIA',
        whatsapp: '11999999999',
        email: 'teste@exemplo.com'
      };
      const response = await request(app)
        .put(`/doacoes/${doacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(dadosInvalidos);
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('A quantidade deve ser um número maior que zero.');
    });
    it('deve retornar erro 400 para email inválido no PUT', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2025-12-31', url_imagem: 'https://exemplo.com/imagem.jpg', urgencia: 'MEDIA', whatsapp: '11999999999', email: 'emailinvalido'
      };
      const response = await request(app)
        .put(`/doacoes/${doacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('O campo email deve conter um endereço válido.');
    });

    it('deve retornar erro 400 para whatsapp inválido no PUT', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2025-12-31', url_imagem: 'https://exemplo.com/imagem.jpg', urgencia: 'MEDIA', whatsapp: 'abc123', email: 'teste@exemplo.com'
      };
      const response = await request(app)
        .put(`/doacoes/${doacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('O campo whatsapp deve conter apenas números (10 a 13 dígitos).');
    });

    it('deve retornar erro 400 para url_imagem inválida no PUT', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2025-12-31', url_imagem: 'imagem_invalida', urgencia: 'MEDIA', whatsapp: '11999999999', email: 'teste@exemplo.com'
      };
      const response = await request(app)
        .put(`/doacoes/${doacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('O campo url_imagem deve conter uma URL válida.');
    });

    it('deve retornar erro 400 para urgencia inválida no PUT', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2025-12-31', url_imagem: 'https://exemplo.com/imagem.jpg', urgencia: 'URGENTE', whatsapp: '11999999999', email: 'teste@exemplo.com'
      };
      const response = await request(app)
        .put(`/doacoes/${doacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('O campo urgencia deve ser um dos seguintes: BAIXA, MEDIA, ALTA');
    });

    it('deve retornar erro 400 se body estiver vazio no PUT', async () => {
      const response = await request(app)
        .put(`/doacoes/${doacaoId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
});