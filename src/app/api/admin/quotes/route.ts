import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const eventType = searchParams.get('eventType') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { clientName: { contains: search } },
        { clientWhatsapp: { contains: search } },
        { addressFull: { contains: search } },
        { addressCity: { contains: search } },
      ];
    }

    const [total, quotes] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formatted = quotes.map((q) => ({
      ...q,
      selectedComboData: q.selectedComboData ? JSON.parse(q.selectedComboData) : null,
      selectedServicesData: q.selectedServicesData ? JSON.parse(q.selectedServicesData) : [],
      selectedCharacters: q.selectedCharacters ? JSON.parse(q.selectedCharacters) : [],
    }));

    return NextResponse.json({
      quotes: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin quotes:', err);
    return NextResponse.json(
      { error: 'Erro ao listar orçamentos', details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do orçamento é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      quote: {
        ...updated,
        selectedComboData: updated.selectedComboData ? JSON.parse(updated.selectedComboData) : null,
        selectedServicesData: updated.selectedServicesData ? JSON.parse(updated.selectedServicesData) : [],
        selectedCharacters: updated.selectedCharacters ? JSON.parse(updated.selectedCharacters) : [],
      },
    });
  } catch (err: any) {
    console.error('Error updating quote:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar orçamento', details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // ignore JSON parse error if body was empty
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do orçamento é obrigatório para exclusão' }, { status: 400 });
    }

    await prisma.quote.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Orçamento excluído com sucesso.',
    });
  } catch (err: any) {
    console.error('Error deleting quote:', err);
    return NextResponse.json(
      { error: 'Erro ao excluir orçamento', details: err.message },
      { status: 500 }
    );
  }
}

