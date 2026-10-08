import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { parseICalFeed } from '@/lib/gcalendar';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL não informada' }, { status: 400 });
    }

    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('webcal://')) {
      cleanUrl = 'https://' + cleanUrl.slice(9);
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL inválida. Ela deve começar com https:// ou webcal://' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/calendar, text/plain, */*',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `O Google Agenda retornou erro HTTP ${res.status} (${res.statusText}). Verifique se copiou o link "Endereço secreto no formato iCal" correto.`,
        },
        { status: 400 }
      );
    }

    const icsText = await res.text();
    if (!icsText.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json(
        {
          error: 'O link informado não retornou um arquivo iCalendar (.ics) válido.',
        },
        { status: 400 }
      );
    }

    const events = parseICalFeed(icsText, 'Teste');

    return NextResponse.json({
      success: true,
      message: `Conexão bem-sucedida! Foram encontrados ${events.length} evento(s) no arquivo iCal.`,
      eventsCount: events.length,
      sampleEvents: events.slice(0, 5),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Erro ao conectar com o Google Agenda: ${err.message || 'Falha de rede / Timeout'}`,
      },
      { status: 500 }
    );
  }
}
