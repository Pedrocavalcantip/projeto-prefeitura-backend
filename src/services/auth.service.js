const axios = require('axios');
const prisma = require('../config/database');

// Função para autenticar na API da prefeitura
exports.loginNaApiPrefeitura = async (email, password) => {
  try {
    const response = await axios.post('https://bora-impactar-dev.setd.rdmapps.com.br/api/login', { 
      email, 
      password 
    });
    return response.data;
  } catch (error) {
    console.error('Erro na API da prefeitura:', error.message);
    throw new Error('Falha na autenticação com a API da prefeitura');
  }
};

// Função para sincronizar dados da ONG por upsert
// Se a ONG já existir, atualiza os dados; se não existir, cria uma nova
exports.sincronizarOng = async (ongData, userData) => {
  console.log('🔄 Sincronizando dados da ONG...');
  const ong = await prisma.ongs.upsert({
    where: { email: userData.email },
    update: { 
      nome: ongData.name, 
      whatsapp: ongData.contact_phone,
      instagram: ongData.instagram_link,
      facebook: ongData.facebook_link,
      site: ongData.site,
      logo_url: ongData.logo_photo_url,
    },
    create: { 
      email: userData.email,
      nome: ongData.name, 
      whatsapp: ongData.contact_phone,
      instagram: ongData.instagram_link,
      facebook: ongData.facebook_link,
      site: ongData.site,
      logo_url: ongData.logo_photo_url,
    },
  });
  console.log('✅ ONG sincronizada com ID:', ong.id_ong);
  return ong;
};