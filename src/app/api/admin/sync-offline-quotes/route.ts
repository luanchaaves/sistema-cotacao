import { NextRequest, NextResponse } from 'next/server';
import { syncOfflineQuotesToCentral } from '@/lib/sync-engine';

export async function POST(req: NextRequest) {
  try {
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
