import { NextRequest, NextResponse } from 'next/server';
import { syncOfflineQuotesToCentral } from '@/lib/sync-engine';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificação de Autenticação / Autorização (Sessão de Admin ou Token Secreto de Cron)
    const session = await getAdminSession();
    const syncToken = req.headers.get('x-sync-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    const validSecret = process.env.SYNC_SECRET || process.env.ADMIN_JWT_SECRET || 'roboled-sync-secret';

    if (!session && syncToken !== validSecret) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login como administrador ou envie o cabeçalho x-sync-secret.' },
        { status: 401 }
      );
    }

    const centralApiUrl = process.env.CENTRAL_API_URL || process.env.NEXT_PUBLIC_CENTRAL_API_URL;
    if (!centralApiUrl) {
      return NextResponse.json(
        { error: 'Variável CENTRAL_API_URL não configurada no servidor' },
        { status: 400 }
      );
    }

    const result = await syncOfflineQuotesToCentral(centralApiUrl);
    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${result.synced} sincronizados, ${result.failed} falhas de ${result.attempted} pendentes.`,
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Erro ao executar rotina de sincronização', details: err.message },
      { status: 500 }
    );
  }
}
