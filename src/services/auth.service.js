const axios = require('axios');
const prisma = require('../config/database.js');

// Autentica na API da prefeitura
exports.loginNaApiPrefeitura = async (email, password) => {
  try {
    const response = await axios.post(
      'https://bora-impactar-dev.setd.rdmapps.com.br/api/login',
      { email, password }
    );
    return response.data;
  } catch (error) {
    console.error('Erro na API da prefeitura:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      throw new Error('401: Falha na autenticação');
    }
    throw new Error('Falha na autenticação com a API da prefeitura');
  }
};

// Sincroniza (upsert) dados da ONG no banco
exports.sincronizarOng = async (ongData, userData) => {
  if (!ongData)  throw new Error('Dados da ONG não foram fornecidos');
  if (!userData) throw new Error('Dados do usuário não foram fornecidos');

  console.log('🔄 Sincronizando dados da ONG...');

  const ong = await prisma.ongs.upsert({
    where: { email: userData.email },
    update: {
      nome:      ongData.name,
      whatsapp:  ongData.contact_phone,
      instagram: ongData.instagram_link,
      facebook:  ongData.facebook_link,
      site:      ongData.site,
      logo_url:  ongData.logo_photo_url,
    },
    create: {
      email:     userData.email,
      nome:      ongData.name,
      whatsapp:  ongData.contact_phone,
      instagram: ongData.instagram_link,
      facebook:  ongData.facebook_link,
      site:      ongData.site,
      logo_url:  ongData.logo_photo_url,
    },
  });

  console.log('✅ ONG sincronizada com ID:', ong.id_ong);
  return ong;
};
