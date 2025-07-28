const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index'); 
const { id } = require('date-fns/locale');
// Teste de criacao de doacao 
describe('Doacoes - POST (criacao)', () => {
    let token;
    let ong;

        beforeAll(() => {
        const email = process.env.TEST_EMAIL;
        const id_ong = 1;
        ong = { id_ong: id_ong, email_ong: email }; // Agora ong está definido corretamente!
        token = jwt.sign(
            { id_ong: ong.id_ong, email_ong: ong.email_ong },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
    });

    it('deve criar uma nova doação corretamente', async () => {
        const doacaoData = {
            titulo: 'Doação Teste Integração',
            descricao: 'Descrição da doação teste',
            tipo_item: 'Roupas e Calçados',
            quantidade: 2,
            prazo_necessidade: '2025-09-28',
            url_imagem: 'https://exemplo.com/imagem.jpg',
            urgencia: 'MEDIA',
            whatsapp: '11999999999',
            email: 'ong@teste.com'
        };

        const res = await request(app)
            .post('/doacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(doacaoData);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('titulo', doacaoData.titulo);
        expect(res.body).toHaveProperty('tipo_item', doacaoData.tipo_item);
        expect(res.body).toHaveProperty('status', 'ATIVA');
        expect(res.body).toHaveProperty('url_imagem', doacaoData.url_imagem);
        expect(res.body).toHaveProperty('quantidade', doacaoData.quantidade);
        expect(res.body).toHaveProperty('ong_id', ong.id_ong);
        expect(res.body).toHaveProperty('criado_em');
        expect(new Date(res.body.criado_em)).toBeInstanceOf(Date);

        const agora = new Date();
        const criadoEm = new Date(res.body.criado_em);
        expect(Math.abs(agora - criadoEm)).toBeLessThan(60 * 1000);

        const prazo = new Date(res.body.prazo_necessidade);
        expect(prazo > criadoEm).toBe(true);
    });

    it('deve retornar erro 400 ao criar doação com categoria inválida', async () => {
        const novaDoacao = {
            titulo: 'Teste Categoria Inválida',
            descricao: 'Descrição',
            tipo_item: 'CategoriaInvalida',
            quantidade: 5,
            prazo_necessidade: '2025-09-28',
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

    it('deve retornar erro 401 ao tentar criar doação sem token', async () => {
        const response = await request(app)
            .post('/doacoes')
            .send({
                titulo: 'Doação sem token',
                descricao: 'Descrição da doação sem token',
                tipo_item: 'Roupas',
                quantidade: 5,
                prazo_necessidade: '2025-09-28'
            });
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message');
    });

    const obrigatorios = ['titulo', 'descricao', 'tipo_item', 'url_imagem', 'whatsapp', 'email'];
    obrigatorios.forEach(campo => {
        it(`deve retornar erro 400 se campo obrigatório '${campo}' estiver ausente ou vazio`, async () => {
            const doacaoValida = {
                titulo: 'Doação Teste Integração',
                descricao: 'Descrição da doação teste',
                tipo_item: 'Roupas e Calçados',
                quantidade: 2,
                prazo_necessidade: '2025-09-28',
                url_imagem: 'https://exemplo.com/imagem.jpg',
                urgencia: 'MEDIA',
                whatsapp: '11999999999',
                email: 'ong@teste.com'
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

    it('deve retornar erro 400 para email inválido', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2023-12-31', url_imagem: 'https://exemplo.com/imagem.jpg', urgencia: 'MEDIA', whatsapp: '11999999999', email: 'emailinvalido'
      };
      const response = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('O campo email deve conter um endereço válido.');
    });

    it('deve retornar erro 400 para whatsapp inválido', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2023-12-31', url_imagem: 'https://exemplo.com/imagem.jpg', urgencia: 'MEDIA', whatsapp: 'abc123', email: 'teste@exemplo.com'
      };
      const response = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('O campo whatsapp deve conter apenas números (10 a 13 dígitos).');
    });

    it('deve retornar erro 400 para url_imagem inválida', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2023-12-31', url_imagem: 'imagem_invalida', urgencia: 'MEDIA', whatsapp: '11999999999', email: 'teste@exemplo.com'
      };
      const response = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('url_imagem');
    });

    it('deve retornar erro 400 para urgencia inválida', async () => {
      const doacao = {
        titulo: 'Teste', descricao: 'desc', tipo_item: 'Roupas e Calçados', quantidade: 1,
        prazo_necessidade: '2023-12-31', url_imagem: 'https://exemplo.com/imagem.jpg', urgencia: 'URGENTE', whatsapp: '11999999999', email: 'teste@exemplo.com'
      };
      const response = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacao);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain('O campo urgencia deve ser um dos seguintes: BAIXA, MEDIA, ALTA');
    });

    it('deve retornar erro 400 se body estiver vazio', async () => {
      const response = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro 400 ao tentar criar doação para ONG inexistente', async () => {
    // Gere um token para uma ONG que não existe no banco
    const ongFake = { id_ong: 99999, email_ong: 'fake@ong.com' };
    const tokenFake = jwt.sign(
        { id_ong: ongFake.id_ong, email_ong: ongFake.email_ong },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    const doacaoData = {
        titulo: 'Teste ONG inexistente',
        descricao: 'Descrição',
        tipo_item: 'Roupas e Calçados',
        quantidade: 1,
        prazo_necessidade: '2025-09-28',
        url_imagem: 'https://exemplo.com/imagem.jpg',
        urgencia: 'MEDIA',
        whatsapp: '11999999999',
        email: 'teste@exemplo.com'
    };

    const res = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${tokenFake}`)
        .send(doacaoData);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('ONG não encontrada');
    });


    it('deve retornar erro ao tentar enviar arquivo que não é imagem', async () => {
    const fs = require('fs');
    const path = require('path');
    const email = process.env.TEST_EMAIL;
    const id_ong = 1;
    const token = jwt.sign(
        { id_ong, email_ong: email },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    const fakeFilePath = path.join(__dirname, 'arquivo-teste.txt');
    fs.writeFileSync(fakeFilePath, 'isso não é uma imagem');

    const res = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .field('titulo', 'Teste arquivo não imagem')
        .field('descricao', 'Descrição')
        .field('tipo_item', 'Roupas e Calçados')
        .field('quantidade', 1)
        .field('prazo_necessidade', '2025-09-28')
        .field('urgencia', 'MEDIA')
        .field('whatsapp', '11999999999')
        .field('email', 'teste@exemplo.com')
        .attach('foto', fakeFilePath);

    fs.unlinkSync(fakeFilePath);

    console.log('status:', res.statusCode, 'body:', res.body);
    expect([400, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/imagem/i);
    });

    it('deve retornar erro ao tentar enviar imagem maior que 5MB', async () => {
    const fs = require('fs');
    const path = require('path');
    const email = process.env.TEST_EMAIL;
    const id_ong = 1;
    const token = jwt.sign(
        { id_ong, email_ong: email },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    // Cria um arquivo fake de 6MB
    const bigFilePath = path.join(__dirname, 'imagem-grande.jpg');
    fs.writeFileSync(bigFilePath, Buffer.alloc(6 * 1024 * 1024));

    const res = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .field('titulo', 'Teste imagem grande')
        .field('descricao', 'Descrição')
        .field('tipo_item', 'Roupas e Calçados')
        .field('quantidade', 1)
        .field('prazo_necessidade', '2025-09-28')
        .field('urgencia', 'MEDIA')
        .field('whatsapp', '11999999999')
        .field('email', 'teste@exemplo.com')
        .attach('foto', bigFilePath);

    fs.unlinkSync(bigFilePath);

    expect([400, 500]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/tamanho|large|grande|5mb/i);
    });

    it('deve retornar erro ao tentar enviar imagem com formato não permitido', async () => {
    const fs = require('fs');
    const path = require('path');
    const email = process.env.TEST_EMAIL;
    const id_ong = 1;
    const token = jwt.sign(
        { id_ong, email_ong: email },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
    // Cria um arquivo fake .gif (formato não permitido)
    const gifFilePath = path.join(__dirname, 'imagem-teste.gif');
    fs.writeFileSync(gifFilePath, Buffer.from([0x47,0x49,0x46,0x38,0x39,0x61])); 

    const res = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .field('titulo', 'Teste imagem gif')
        .field('descricao', 'Descrição')
        .field('tipo_item', 'Roupas e Calçados')
        .field('quantidade', 1)
        .field('prazo_necessidade', '2025-09-28')
        .field('urgencia', 'MEDIA')
        .field('whatsapp', '11999999999')
        .field('email', 'teste@exemplo.com')
        .attach('foto', gifFilePath);

    fs.unlinkSync(gifFilePath);

    expect([400, 500]).toContain(res.statusCode); 
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/formato|format|permitido|gif/i);
    });

    it('deve retornar erro 400 ao tentar criar doação com quantidade negativa', async () => {
    const doacaoData = {
        titulo: 'Teste quantidade negativa',
        descricao: 'Descrição',
        tipo_item: 'Roupas e Calçados',
        quantidade: -5,
        prazo_necessidade: '2025-09-28',
        url_imagem: 'https://exemplo.com/imagem.jpg',
        urgencia: 'MEDIA',
        whatsapp: '11999999999',
        email: 'teste@exemplo.com'
    };
    const res = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacaoData);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/quantidade/i);
    });

    it('deve retornar erro 400 ao tentar criar doação com prazo_necessidade no passado', async () => {
    const doacaoData = {
        titulo: 'Teste data passada',
        descricao: 'Descrição',
        tipo_item: 'Roupas e Calçados',
        quantidade: 1,
        prazo_necessidade: '2000-01-01',
        url_imagem: 'https://exemplo.com/imagem.jpg',
        urgencia: 'MEDIA',
        whatsapp: '11999999999',
        email: 'teste@exemplo.com'
    };
    const res = await request(app)
        .post('/doacoes')
        .set('Authorization', `Bearer ${token}`)
        .send(doacaoData);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/prazo|data/i);
    });
});