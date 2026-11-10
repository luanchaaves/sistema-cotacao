import { prisma } from './src/lib/prisma';
import { syncOfflineQuotesToCentral } from './src/lib/sync-engine';
import http from 'http';

async function runTests() {
  console.log('🧪 Iniciando Testes de Sincronização, Resiliência e Schema Prisma em sistema-cotacao...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Teste de Schema Prisma + clientEmail + guestCount
  console.log('1. Validando criação de Quote com clientEmail e guestCount no Prisma Client...');
  const testCode = `TEST-PRISMA-${Date.now()}`;
  try {
    const createdQuote = await prisma.quote.create({
      data: {
        code: testCode,
        clientName: 'Teste Prisma Schema',
        clientWhatsapp: '11999990000',
        clientEmail: 'prisma-test@roboledpartner.com.br',
        eventType: 'Corporativo',
        eventDate: '2026-12-25',
        eventTime: '19:00',
        guestCount: 150,
        addressFull: 'Av Paulista, 1000 - SP',
        distanceOneWayKm: 10,
        distanceTotalKm: 20,
        durationHours: 2.0,
        fuelCost: 15.0,
        marginCost: 30.0,
        tollsCost: 0.0,
        calculatedShipping: 60.0,
        finalShipping: 60.0,
        servicesSubtotal: 1500.0,
        totalAmount: 1560.0,
        selectedServicesData: '[]',
        notes: 'Teste [PENDING_CENTRAL_SYNC]',
        status: 'pending',
      },
    });

    assert(createdQuote.id !== undefined, 'Quote criada com sucesso no banco');
    assert(createdQuote.clientEmail === 'prisma-test@roboledpartner.com.br', 'clientEmail persistido e lido corretamente');
    assert(createdQuote.guestCount === 150, 'guestCount numérico persistido corretamente');
    assert(!Number.isNaN(createdQuote.guestCount), 'guestCount não é NaN');
  } catch (err: any) {
    assert(false, `Falha no Prisma create: ${err.message}`);
  }

  // 2. Teste do Motor de Sincronização Offline com Mock Server Central
  console.log('\n2. Validando Motor de Sincronização Offline (sync-engine)...');
  const receivedQuotes: any[] = [];
  let shouldServerFail = false;

  const mockCentralServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/public/quotes') {
      if (shouldServerFail) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro simulado no Central' }));
        return;
      }

      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const parsed = JSON.parse(body);
        receivedQuotes.push(parsed);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, quote: parsed }));
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise<void>((resolve) => mockCentralServer.listen(9876, () => resolve()));
  const mockCentralUrl = 'http://127.0.0.1:9876';

  try {
    // Sincroniza a cotação pendente criada no teste 1
    const syncResult = await syncOfflineQuotesToCentral(mockCentralUrl);
    assert(syncResult.synced >= 1, `Sincronizou pelo menos 1 cotação pendente (synced: ${syncResult.synced})`);

    // Verifica se os dados recebidos no mock Central contêm clientEmail e valores corretos
    const received = receivedQuotes.find((q) => q.code === testCode);
    assert(received !== undefined, 'Central recebeu a cotação correta pelo endpoint /public/quotes');
    assert(received?.clientEmail === 'prisma-test@roboledpartner.com.br', 'Central recebeu clientEmail correto');
    assert(received?.guestCount === 150, 'Central recebeu guestCount correto');
    assert(received?.totalAmount === 1560.0, 'Central recebeu totalAmount correto');

    // Verifica se a cotação local foi atualizada para [SYNCED_TO_CENTRAL]
    const updatedLocal = await prisma.quote.findUnique({ where: { code: testCode } });
    assert(updatedLocal?.notes?.includes('[SYNCED_TO_CENTRAL]') === true, 'Cotação local foi marcada como [SYNCED_TO_CENTRAL]');
    assert(!updatedLocal?.notes?.includes('[PENDING_CENTRAL_SYNC]'), 'Tag [PENDING_CENTRAL_SYNC] foi removida');

    // 3. Teste de Recuperação Segura contra Falhas Parciais
    console.log('\n3. Validando Recuperação contra Falhas Parciais (Central Offline)...');
    const failCode = `TEST-FAIL-${Date.now()}`;
    await prisma.quote.create({
      data: {
        code: failCode,
        clientName: 'Cliente Retry Test',
        clientWhatsapp: '11911112222',
        clientEmail: 'retry@teste.com',
        eventType: 'Festa',
        eventDate: '2026-11-20',
        eventTime: '18:00',
        guestCount: 50,
        addressFull: 'Rua Teste, 123',
        distanceOneWayKm: 5,
        distanceTotalKm: 10,
        durationHours: 1.0,
        fuelCost: 10.0,
        marginCost: 30.0,
        tollsCost: 0.0,
        calculatedShipping: 50.0,
        finalShipping: 50.0,
        servicesSubtotal: 800.0,
        totalAmount: 850.0,
        selectedServicesData: '[]',
        notes: 'Offline [PENDING_CENTRAL_SYNC]',
        status: 'pending',
      },
    });

    // Força falha no mock Central
    shouldServerFail = true;
    const failSyncResult = await syncOfflineQuotesToCentral(mockCentralUrl);
    assert(failSyncResult.failed >= 1, 'Motor detectou falha no envio quando servidor retornou 500');

    const quoteStillPending = await prisma.quote.findUnique({ where: { code: failCode } });
    assert(quoteStillPending?.notes?.includes('[PENDING_CENTRAL_SYNC]') === true, 'Cotação permaneceu com tag [PENDING_CENTRAL_SYNC] após falha');

    // Restabelece o servidor e re-executa a sincronização (Retry)
    shouldServerFail = false;
    const retrySyncResult = await syncOfflineQuotesToCentral(mockCentralUrl);
    assert(retrySyncResult.synced >= 1, 'Retry recuperou e sincronizou a cotação após restabelecimento');

    const quoteRecovered = await prisma.quote.findUnique({ where: { code: failCode } });
    assert(quoteRecovered?.notes?.includes('[SYNCED_TO_CENTRAL]') === true, 'Cotação recuperada marcada como [SYNCED_TO_CENTRAL]');

    // Cleanup dos registros de teste
    await prisma.quote.deleteMany({
      where: {
        code: { in: [testCode, failCode] },
      },
    });
  } finally {
    mockCentralServer.close();
  }

  console.log(`\n========================================`);
  console.log(`📊 RESULTADO DOS TESTES EM sistema-cotacao:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
