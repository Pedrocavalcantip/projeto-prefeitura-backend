// scripts/seed-cloud.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados na nuvem...');

    // Criar ONGs de teste (com emails que NÃO conflitem com a API da Prefeitura)
    const ong1 = await prisma.ongs.create({
      data: {
        nome: 'ONG Coração Solidário',
        email_ong: 'coracao.solidario@exemplo.com',
        logo_url: 'https://via.placeholder.com/150/0066CC/FFFFFF?text=Coração'
      }
    });

    const ong2 = await prisma.ongs.create({
      data: {
        nome: 'Instituto Mãos que Ajudam',
        email_ong: 'maos.ajudam@exemplo.com',
        logo_url: 'https://via.placeholder.com/150/CC6600/FFFFFF?text=Mãos'
      }
    });

    // Criar produtos de teste
    const dataVencimento1 = new Date();
    dataVencimento1.setDate(dataVencimento1.getDate() + 30); // 30 dias no futuro

    const dataVencimento2 = new Date();
    dataVencimento2.setDate(dataVencimento2.getDate() + 15); // 15 dias no futuro

    const dataVencimento3 = new Date();
    dataVencimento3.setDate(dataVencimento3.getDate() + 7); // 7 dias no futuro

    await prisma.produtos.createMany({
      data: [
        {
          titulo: 'Cestas Básicas',
          descricao: 'Necessitamos de cestas básicas para famílias em situação de vulnerabilidade social',
          tipo_item: 'Alimentos',
          url_imagem: 'https://via.placeholder.com/300/FF6B6B/FFFFFF?text=Cestas',
          prazo_necessidade: dataVencimento1,
          ong_id: ong1.id_ong,
          finalidade: 'DOACAO',
          quantidade: 50,
          urgencia: 'ALTA',
          status: 'ATIVA',
          email: 'coracao.solidario@exemplo.com',
          whatsapp: '11999991111'
        },
        {
          titulo: 'Roupas de Inverno',
          descricao: 'Precisamos de roupas de inverno para pessoas em situação de rua',
          tipo_item: 'Roupas',
          url_imagem: 'https://via.placeholder.com/300/4ECDC4/FFFFFF?text=Roupas',
          prazo_necessidade: dataVencimento2,
          ong_id: ong1.id_ong,
          finalidade: 'DOACAO',
          quantidade: 100,
          urgencia: 'MEDIA',
          status: 'ATIVA',
          email: 'coracao.solidario@exemplo.com',
          whatsapp: '11999991111'
        },
        {
          titulo: 'Material Escolar',
          descricao: 'Materiais escolares para crianças carentes voltarem às aulas',
          tipo_item: 'Educação',
          url_imagem: 'https://via.placeholder.com/300/45B7D1/FFFFFF?text=Escola',
          prazo_necessidade: dataVencimento3,
          ong_id: ong2.id_ong,
          finalidade: 'DOACAO',
          quantidade: 200,
          urgencia: 'ALTA',
          status: 'ATIVA',
          email: 'maos.ajudam@exemplo.com',
          whatsapp: '11999992222'
        },
        {
          titulo: 'Produtos de Higiene',
          descricao: 'Sabonetes, shampoos e produtos de higiene pessoal',
          tipo_item: 'Higiene',
          url_imagem: 'https://via.placeholder.com/300/96CEB4/FFFFFF?text=Higiene',
          prazo_necessidade: dataVencimento1,
          ong_id: ong2.id_ong,
          finalidade: 'DOACAO',
          quantidade: 150,
          urgencia: 'MEDIA',
          status: 'ATIVA',
          email: 'maos.ajudam@exemplo.com',
          whatsapp: '11999992222'
        },
        {
          titulo: 'Medicamentos Excedentes',
          descricao: 'Temos medicamentos em excesso que podem ser úteis para outras ONGs',
          tipo_item: 'Medicamentos',
          url_imagem: 'https://via.placeholder.com/300/FECA57/FFFFFF?text=Remédios',
          prazo_necessidade: dataVencimento2,
          ong_id: ong1.id_ong,
          finalidade: 'REALOCACAO',
          quantidade: 50,
          urgencia: 'BAIXA',
          status: 'ATIVA',
          email: 'coracao.solidario@exemplo.com',
          whatsapp: '11999991111'
        }
      ]
    });

    console.log('✅ Seed concluído com sucesso!');
    console.log(`📊 Dados criados:
    - 2 ONGs
    - 5 produtos (3 doações + 2 realocações)`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
