export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { syncOfflineQuotesToCentral } = await import('@/lib/sync-engine');

    // 1. Sincronização automática inicial no boot do container (espera 5s para inicialização dos serviços)
    setTimeout(() => {
      syncOfflineQuotesToCentral().catch((err: any) => {
        console.warn('⚠️ [Boot Sync] Erro na sincronização inicial:', err.message);
      });
    }, 5000);

    // 2. Loop periódico de resiliência em background (a cada 5 minutos)
    setInterval(() => {
      syncOfflineQuotesToCentral().catch((err: any) => {
        console.warn('⚠️ [Periodic Sync] Erro na sincronização em background:', err.message);
      });
    }, 5 * 60 * 1000);
  }
}
