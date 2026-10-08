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
    const targetUrl = url || 'https://contrato.roboledpartner.com.br';

    const events = await fetchContractSystemEvents(targetUrl, true);

    if (events.length > 0) {
      return NextResponse.json({
        success: true,
        message: `Conexão bem-sucedida! Foram encontrados ${events.length} evento(s) ativos no Sistema de Contratos.`,
        eventsCount: events.length,
        sampleEvents: events.slice(0, 5),
      });
    }

    return NextResponse.json({
      success: false,
      error: `Não foi possível puxar eventos automaticamente de ${targetUrl}. Verifique se a URL da API está correta ou se o sistema exige autenticação. Dica: Os eventos do Sistema de Contratos que já estão no Google Agenda são sincronizados automaticamente pela 1ª coluna!`,
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
