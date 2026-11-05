import { NextRequest, NextResponse } from 'next/server';
import { syncOfflineQuotesToCentral } from '@/lib/sync-engine';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificação Estrita de Autenticação / Autorização
    // Acesso permitido SOMENTE para:
    // a) Sessão de usuário com role 'admin' explicitamente verificado
    // b) Requisição automatizada com token x-sync-secret que coincida com SYNC_SECRET / ADMIN_JWT_SECRET (sem fallback padrão inseguro)
    const session = await getAdminSession();
    const isAdmin = Boolean(session && session.role === 'admin');

    const configuredSecret = process.env.SYNC_SECRET || process.env.ADMIN_JWT_SECRET;
    const providedSecret = req.headers.get('x-sync-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const isSecretAuthorized = Boolean(
      configuredSecret &&
      providedSecret &&
      configuredSecret.trim().length >= 16 &&
      providedSecret === configuredSecret
    );

    if (!isAdmin && !isSecretAuthorized) {
      return NextResponse.json(
        { error: 'Não autorizado. Acesso restrito a administradores autenticados ou requisições autenticadas com x-sync-secret válido.' },
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
