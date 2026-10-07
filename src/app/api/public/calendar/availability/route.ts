import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { fetchGoogleCalendarEvents, GoogleCalendarEvent } from '@/lib/gcalendar';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get('date'); // e.g. "2026-11-20" or "20/11/2026"
    const timeQuery = searchParams.get('time'); // e.g. "20:00"

    if (!dateQuery) {
      return NextResponse.json({ available: true, message: 'Data não informada' });
    }

    // Normalize date representation
    let isoDate = dateQuery.trim(); // YYYY-MM-DD
    let brDate = dateQuery.trim(); // DD/MM/YYYY

    if (dateQuery.includes('-')) {
      const parts = dateQuery.split('-');
      if (parts.length === 3) {
        isoDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
        brDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } else if (dateQuery.includes('/')) {
      const parts = dateQuery.split('/');
      if (parts.length === 3) {
        brDate = `${parts[0]}/${parts[1]}/${parts[2]}`;
        isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const setting = await prisma.setting.findUnique({ where: { id: 'default' } });
    const maxEvents = setting?.maxEventsPerDay || 2;

    // 1. Fetch Google Calendar events (roboledpartner@gmail.com & luanchaves1011@gmail.com)
    let gCalEvents: GoogleCalendarEvent[] = [];
    const gCalUrls: { url: string; label: string }[] = [];
    if (setting?.googleCalendarUrl1) {
      gCalUrls.push({ url: setting.googleCalendarUrl1, label: 'roboledpartner@gmail.com' });
    }
    if (setting?.googleCalendarUrl2) {
      gCalUrls.push({ url: setting.googleCalendarUrl2, label: 'luanchaves1011@gmail.com' });
    }
    if (setting?.googleCalendarIcalUrl) {
      gCalUrls.push({ url: setting.googleCalendarIcalUrl, label: 'Google Calendar Geral' });
    }

    if (gCalUrls.length > 0) {
      try {
        const allGCal = await fetchGoogleCalendarEvents(gCalUrls);
        gCalEvents = allGCal.filter((ev) => ev.date === isoDate);
      } catch (err) {
        console.warn('Google Calendar sync warning:', err);
      }
    }

    // If Google Calendar has a full-day event
    const gCalFullDay = gCalEvents.find((e) => e.isFullDay);
    if (gCalFullDay) {
      return NextResponse.json({
        available: false,
        isFullDayUnavailable: true,
        reason: `Data indisponível na nossa agenda Google Calendar (${gCalFullDay.title}).`,
        bookedTimes: [],
      });
    }

    // 2. Check internal blocked schedule
    const blockedEntries = await prisma.blockedSchedule.findMany({
      where: {
        OR: [{ date: isoDate }, { date: brDate }],
      },
    });

    // Check full-day block
    const fullDayBlock = blockedEntries.find((b) => b.isFullDay);
    if (fullDayBlock) {
      return NextResponse.json({
        available: false,
        isFullDayUnavailable: true,
        reason: fullDayBlock.reason || 'Data indisponível na nossa agenda (já temos evento confirmado nesta data).',
        bookedTimes: [],
      });
    }

    // 3. Check confirmed quotes
    const confirmedQuotes = await prisma.quote.findMany({
      where: {
        status: 'confirmed',
        OR: [{ eventDate: isoDate }, { eventDate: brDate }],
      },
    });

    const totalEventsCount = blockedEntries.length + confirmedQuotes.length + gCalEvents.length;

    if (totalEventsCount >= maxEvents) {
      return NextResponse.json({
        available: false,
        isFullDayUnavailable: true,
        reason: 'Agenda cheia para esta data (limite de apresentações atingido). Entre em contato no WhatsApp para verificar encaixe.',
        totalEventsCount,
        maxEvents,
      });
    }

    // 4. Collect booked times (from blocks, quotes, and Google Calendar)
    const bookedTimes: string[] = [];
    blockedEntries.forEach((b) => {
      if (b.startTime) bookedTimes.push(b.startTime);
    });
    confirmedQuotes.forEach((q) => {
      if (q.eventTime) bookedTimes.push(q.eventTime);
    });
    gCalEvents.forEach((g) => {
      if (g.startTime) bookedTimes.push(g.startTime);
    });

    // 5. Check time slot conflict if time was requested
    if (timeQuery && timeQuery.includes(':')) {
      const [reqH, reqM] = timeQuery.split(':').map(Number);
      const reqMinutes = reqH * 60 + reqM;

      for (const booked of bookedTimes) {
        if (!booked.includes(':')) continue;
        const [bH, bM] = booked.split(':').map(Number);
        const bMinutes = bH * 60 + bM;

        // If within 2.5 hours (150 mins) of each other
        if (Math.abs(reqMinutes - bMinutes) < 150) {
          return NextResponse.json({
            available: false,
            isTimeUnavailable: true,
            reason: `Já possuímos uma apresentação agendada por volta das ${booked}. Recomendamos escolher um horário com pelo menos 2h30 de intervalo.`,
            bookedTimes,
            remainingSlots: maxEvents - totalEventsCount,
          });
        }
      }
    }

    return NextResponse.json({
      available: true,
      remainingSlots: maxEvents - totalEventsCount,
      bookedTimes,
      gCalEventsFound: gCalEvents.length,
    });
  } catch (err: any) {
    console.error('Calendar availability check error:', err);
    return NextResponse.json({ available: true, error: err.message });
  }
}
