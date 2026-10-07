import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';

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
    let formattedDate = dateQuery.trim();
    let altFormattedDate = dateQuery.trim();

    if (dateQuery.includes('-')) {
      const parts = dateQuery.split('-');
      if (parts.length === 3) {
        // YYYY-MM-DD -> DD/MM/YYYY
        altFormattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } else if (dateQuery.includes('/')) {
      const parts = dateQuery.split('/');
      if (parts.length === 3) {
        // DD/MM/YYYY -> YYYY-MM-DD
        altFormattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const setting = await prisma.setting.findUnique({ where: { id: 'default' } });
    const maxEvents = setting?.maxEventsPerDay || 2;

    // 1. Check blocked schedule
    const blockedEntries = await prisma.blockedSchedule.findMany({
      where: {
        OR: [
          { date: formattedDate },
          { date: altFormattedDate },
        ],
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

    // 2. Check confirmed quotes
    const confirmedQuotes = await prisma.quote.findMany({
      where: {
        status: 'confirmed',
        OR: [
          { eventDate: formattedDate },
          { eventDate: altFormattedDate },
        ],
      },
    });

    const totalEventsCount = blockedEntries.length + confirmedQuotes.length;

    if (totalEventsCount >= maxEvents) {
      return NextResponse.json({
        available: false,
        isFullDayUnavailable: true,
        reason: 'Agenda cheia para esta data (limite de eventos atingido). Entre em contato no WhatsApp para verificar encaixe.',
        totalEventsCount,
        maxEvents,
      });
    }

    // 3. Collect booked times
    const bookedTimes: string[] = [];
    blockedEntries.forEach((b) => {
      if (b.startTime) bookedTimes.push(b.startTime);
    });
    confirmedQuotes.forEach((q) => {
      if (q.eventTime) bookedTimes.push(q.eventTime);
    });

    // 4. Check time slot conflict if time was requested
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
    });
  } catch (err: any) {
    console.error('Calendar availability check error:', err);
    return NextResponse.json({ available: true, error: err.message });
  }
}
