import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const [blocks, confirmedQuotes] = await Promise.all([
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
    ]);

    return NextResponse.json({ blocks, confirmedQuotes });
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
