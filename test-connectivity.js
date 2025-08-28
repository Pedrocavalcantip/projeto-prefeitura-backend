const axios = require('axios');

console.log('🔍 Testando conectividade com API externa...');

async function testConnectivity() {
  try {
    console.log('📡 Testando resolução DNS...');
    const dns = require('dns').promises;
    const addresses = await dns.lookup('bora-impactar-dev.setd.rdmapps.com.br');
    console.log('✅ DNS resolvido:', addresses);
    
    console.log('🌐 Testando conectividade HTTP...');
    const response = await axios.get('https://bora-impactar-dev.setd.rdmapps.com.br', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('✅ Conectividade HTTP OK - Status:', response.status);
    
    console.log('🔐 Testando endpoint de login...');
    const loginResponse = await axios.post(
      'https://bora-impactar-dev.setd.rdmapps.com.br/api/login',
      {
        email: 'teste@exemplo.com',
        password: 'senha123'
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Endpoint de login acessível - Status:', loginResponse.status);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code) {
      console.error('📍 Código do erro:', error.code);
    }
    if (error.cause) {
      console.error('🔍 Causa:', error.cause.message);
    }
  }
}

testConnectivity();
