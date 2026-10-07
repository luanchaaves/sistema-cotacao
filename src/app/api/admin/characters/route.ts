import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const characters = await prisma.character.findMany({
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ characters });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, category = 'Infantil', imageUrl, isActive = true, order = 0 } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome do personagem é obrigatório' }, { status: 400 });
    }

    const generatedSlug = slug || slugify(name);

    const character = await prisma.character.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        category: category.trim(),
        imageUrl: imageUrl || null,
        isActive: Boolean(isActive),
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, character });
  } catch (err: any) {
    console.error('Error creating character:', err);
    return NextResponse.json(
      { error: 'Erro ao criar personagem', details: err.message },
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
    const { id, name, slug, category, imageUrl, isActive, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do personagem é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.character.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        slug: slug !== undefined ? slug.trim() : undefined,
        category: category !== undefined ? category.trim() : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
    });

    return NextResponse.json({ success: true, character: updated });
  } catch (err: any) {
    console.error('Error updating character:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar personagem', details: err.message },
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
      return NextResponse.json({ error: 'ID do personagem é obrigatório' }, { status: 400 });
    }

    await prisma.character.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Personagem excluído com sucesso' });
  } catch (err: any) {
    console.error('Error deleting character:', err);
    return NextResponse.json(
      { error: 'Erro ao excluir personagem', details: err.message },
      { status: 500 }
    );
  }
}
