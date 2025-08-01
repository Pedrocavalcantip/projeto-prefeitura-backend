const axios = require('axios');
const prisma = require('../config/database.js');

// Autentica na API da prefeitura
exports.loginNaApiPrefeitura = async (email_ong, password) => {
  try {
    const response = await axios.post(
      'https://bora-impactar-dev.setd.rdmapps.com.br/api/login',
      {
        email: email_ong,
        password
      }
    );
    return response.data;
  } catch (error) {
    // Se error.response existe, loga status/data/message. Se não, loga o erro inteiro.
    if (error.response) {
      console.error('Erro na API da prefeitura:', {
        status: error.response.status,
        data: error.response.data,
        message: error.message,
      });

      // Tratamento de erro 401: credenciais inválidas
      if (error.response.status === 401) {
        throw new Error('Credenciais inválidas');
      }
    } else {
      // Erro sem response: rede, timeout, DNS, etc
      console.error('Erro na API da prefeitura (sem response):', error);
    }

    // Erro genérico para falha de conexão, timeout, etc
    throw new Error('Falha ao se conectar à API da prefeitura');
  }
};



// Sincroniza (upsert) dados da ONG no banco
exports.sincronizarOng = async (ongData, userData) => {
  if (!ongData) throw new Error('Dados da ONG não foram fornecidos');
  if (!userData) throw new Error('Dados do usuário não foram fornecidos');

  console.log('🔄 Sincronizando dados da ONG...');

  const ong = await prisma.ongs.upsert({
    where: { email_ong: userData.email_ong }, // <- permanece email_ong no seu sistema
    update: {
      nome:     ongData.name,
      logo_url: ongData.logo_photo_url,
    },
    create: {
      email_ong: userData.email_ong,
      nome:      ongData.name,
      logo_url:  ongData.logo_photo_url,
    },
  });

  console.log('✅ ONG sincronizada com ID:', ong.id_ong);
  return ong;
};
