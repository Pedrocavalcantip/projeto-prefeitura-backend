const axios = require('axios');
const https = require('https');
const dns = require('dns').promises;

console.log('🔍 Testando conectividade com API externa...');

async function testConnectivity() {
  try {
    console.log('📡 1. Testando resolução DNS...');
    const addresses = await dns.lookup('bora-impactar-dev.setd.rdmapps.com.br', { family: 4 });
    console.log('✅ DNS resolvido:', addresses);
    
    console.log('🌐 2. Testando HTTPS nativo...');
    const testNativeHttps = () => {
      return new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'bora-impactar-dev.setd.rdmapps.com.br',
          path: '/',
          method: 'GET',
          timeout: 10000
        }, (res) => {
          console.log('✅ HTTPS nativo OK - Status:', res.statusCode);
          resolve(res.statusCode);
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Timeout')));
        req.end();
      });
    };
    
    await testNativeHttps();
    
    console.log('📦 3. Testando Axios...');
    const response = await axios.get('https://bora-impactar-dev.setd.rdmapps.com.br', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('✅ Axios OK - Status:', response.status);
    
    console.log('🔐 4. Testando endpoint de login...');
    try {
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
      console.log('✅ Login endpoint acessível - Status:', loginResponse.status);
    } catch (loginError) {
      if (loginError.response) {
        console.log('✅ Login endpoint acessível (erro esperado) - Status:', loginError.response.status);
      } else {
        throw loginError;
      }
    }
    
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
