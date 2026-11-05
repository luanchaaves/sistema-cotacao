import { prisma } from '../src/lib/prisma';
import { syncOfflineQuotesToCentral } from '../src/lib/sync-engine';

async function main() {
  console.log('=====================================================');
  console.log('🔄 ROBÔ LED PARTNER - SINCRONIZADOR DE COTAÇÕES');
  console.log('=====================================================');

  const centralUrl = process.argv[2] || process.env.CENTRAL_API_URL || 'http://localhost:3000/api';
  console.log(`📡 URL Central Alvo: ${centralUrl}`);

  const res = await syncOfflineQuotesToCentral(centralUrl);
  console.log('\n📊 Relatório de Sincronização:');
  console.log(`- Tentados:     ${res.attempted}`);
  console.log(`- Sincronizados:${res.synced}`);
  console.log(`- Falhas:       ${res.failed}`);

  if (res.errors.length > 0) {
    console.log('\n⚠️ Erros encontrados:');
    res.errors.forEach((e) => console.log(`  - ${e}`));
  }

  await prisma.$disconnect();
  console.log('\n✅ Processamento finalizado.');
}

main().catch((err) => {
  console.error('❌ Falha:', err);
  process.exit(1);
});
