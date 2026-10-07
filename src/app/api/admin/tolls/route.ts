import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const tolls = await prisma.toll.findMany({
    orderBy: { highway: 'asc' },
  });

  return NextResponse.json({ tolls });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, highway, price, region, direction = 'Ambos', isActive = true } = body;

    if (!name || !highway || price === undefined) {
      return NextResponse.json(
        { error: 'Nome, rodovia e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const toll = await prisma.toll.create({
      data: {
        name: name.trim(),
        highway: highway.trim(),
        price: Number(price) || 0,
        region: (region || 'SP').trim(),
        direction: direction || 'Ambos',
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, toll });
  } catch (err: any) {
    console.error('Error creating toll:', err);
    return NextResponse.json(
      { error: 'Erro ao cadastrar pedágio', details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, highway, price, region, direction, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do pedágio é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.toll.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        highway: highway !== undefined ? highway.trim() : undefined,
        price: price !== undefined ? Number(price) : undefined,
        region: region !== undefined ? region.trim() : undefined,
        direction: direction !== undefined ? direction : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({ success: true, toll: updated });
  } catch (err: any) {
    console.error('Error updating toll:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedágio', details: err.message },
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do pedágio é obrigatório' }, { status: 400 });
    }

    await prisma.toll.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Pedágio excluído com sucesso' });
  } catch (err: any) {
    console.error('Error deleting toll:', err);
    return NextResponse.json(
      { error: 'Erro ao excluir pedágio', details: err.message },
      { status: 500 }
    );
  }
}
