import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { fetchContractSystemEvents } from '@/lib/contractSync';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { url } = await req.json();
    const targetUrl = url ? url.trim() : 'https://contrato.roboledpartner.com.br';

    const events = await fetchContractSystemEvents(targetUrl, true);

    if (events.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Conexão bem-sucedida! Foram encontrados e sincronizados ${events.length} evento(s) do Sistema de Contratos.`,
        eventsCount: events.length,
        sampleEvents: events.slice(0, 5),
      });
    }

    return NextResponse.json({
      success: false,
      error: `Não foi possível carregar eventos de "${targetUrl}". Verifique se o servidor de contratos está ativo ou use "https://contrato.roboledpartner.com.br" / "http://192.168.12.7:3001".`,
      eventsCount: 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Erro ao conectar com o Sistema de Contratos: ${err.message || 'Falha de conexão'}`,
      },
      { status: 500 }
    );
  }
}
