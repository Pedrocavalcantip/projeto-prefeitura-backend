// scripts/limpar-produtos.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.produtos.deleteMany({});
  console.log('Todos os produtos foram removidos!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});