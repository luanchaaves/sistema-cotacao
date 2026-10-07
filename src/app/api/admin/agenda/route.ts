import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { fetchGoogleCalendarEvents, GoogleCalendarEvent } from '@/lib/gcalendar';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const [blocks, confirmedQuotes, setting] = await Promise.all([
      prisma.blockedSchedule.findMany({
        orderBy: { date: 'asc' },
      }),
      prisma.quote.findMany({
        where: { status: 'confirmed' },
        select: {
          id: true,
          code: true,
          clientName: true,
          eventType: true,
          eventDate: true,
          eventTime: true,
          addressCity: true,
          totalAmount: true,
        },
        orderBy: { eventDate: 'asc' },
      }),
      prisma.setting.findUnique({ where: { id: 'default' } }),
    ]);

    // Fetch Google Calendar events
    let googleCalendarEvents: GoogleCalendarEvent[] = [];
    const gCalUrls: { url: string; label: string }[] = [];
    if (setting?.googleCalendarUrl1) {
      gCalUrls.push({ url: setting.googleCalendarUrl1, label: 'roboledpartner@gmail.com' });
    }
    if (setting?.googleCalendarUrl2) {
      gCalUrls.push({ url: setting.googleCalendarUrl2, label: 'luanchaves1011@gmail.com' });
    }
    if (setting?.googleCalendarIcalUrl) {
      gCalUrls.push({ url: setting.googleCalendarIcalUrl, label: 'Google Calendar' });
    }

    if (gCalUrls.length > 0) {
      try {
        googleCalendarEvents = await fetchGoogleCalendarEvents(gCalUrls, true);
      } catch (err) {
        console.warn('Google Calendar fetch warning in admin:', err);
      }
    }

    return NextResponse.json({
      blocks,
      confirmedQuotes,
      googleCalendarEvents,
      setting: {
        googleCalendarUrl1: setting?.googleCalendarUrl1,
        googleCalendarUrl2: setting?.googleCalendarUrl2,
        maxEventsPerDay: setting?.maxEventsPerDay || 2,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { title, date, startTime, endTime, isFullDay, reason } = body;

    if (!date) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 });
    }

    const block = await prisma.blockedSchedule.create({
      data: {
        title: title || 'Data Bloqueada / Evento',
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        isFullDay: Boolean(isFullDay),
        reason: reason || null,
        status: 'blocked',
      },
    });

    return NextResponse.json({ success: true, block });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.blockedSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
