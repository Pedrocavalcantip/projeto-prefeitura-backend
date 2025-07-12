const axios = require('axios');
const jwt = require('jsonwebtoken');
// Importe a nossa conexão com o banco
const prisma = require('../config/database');

exports.login = async (req, res) => {

    const { email, password } = req.body;

    try {
        //  Autentica com a API externa
        console.log('🔐 Fazendo login na API da prefeitura...');
        const response = await axios.post('https://bora-impactar-dev.setd.rdmapps.com.br/api/login', { email, password });

        if (response.status !== 200 || !response.data.user) {
            return res.status(401).json({ erro: 'Email ou senha inválidos.' });
        }

        // Extrai os dados da resposta da Prefeitura
        const ongDataFromApi = response.data.ngo;
        const userDataFromApi = response.data.user;
        
        console.log('📊 Dados da ONG recebidos:', ongDataFromApi);
        console.log('👤 Dados do usuário recebidos:', userDataFromApi);

        //  A LÓGICA DE SINCRONIZAÇÃO (UPSERT)
        console.log('🔄 Sincronizando dados da ONG...');
        const ong = await prisma.ongs.upsert({
            where: { email: userDataFromApi.email }, // Procura a ONG pelo email
            update: { 
                nome: ongDataFromApi.name, 
                whatsapp: ongDataFromApi.contact_phone,
                instagram: ongDataFromApi.instagram_link,
                facebook: ongDataFromApi.facebook_link,
                site: ongDataFromApi.site,
                logo_url: ongDataFromApi.logo_photo_url,
            },
            create: { 
                email: userDataFromApi.email,
                nome: ongDataFromApi.name, 
                whatsapp: ongDataFromApi.contact_phone,
                instagram: ongDataFromApi.instagram_link,
                facebook: ongDataFromApi.facebook_link,
                site: ongDataFromApi.site,
                logo_url: ongDataFromApi.logo_photo_url,
            },
        });

        console.log('✅ ONG sincronizada com ID:', ong.id_ong);

        // Cria o token JWT, agora com o ID da ONG do NOSSO banco
        const token = jwt.sign(
            { id_ong: ong.id_ong, email: ong.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Retorna o sucesso com o token
        return res.json({ 
            auth: true, 
            token: token,
            debug: {
                ong_id: ong.id_ong,
                nome: ong.nome,
                email: ong.email
            }
        });

    } catch (error) {
        console.error('❌ Erro no processo de login:', error);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }

};