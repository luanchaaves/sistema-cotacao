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

  const combos = await prisma.combo.findMany({
    orderBy: { order: 'asc' },
  });

  const parsedCombos = combos.map((c) => ({
    ...c,
    includedItems: (() => {
      try {
        return JSON.parse(c.includedItems);
      } catch {
        return [];
      }
    })(),
  }));

  return NextResponse.json({ combos: parsedCombos });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      imageUrl,
      regularPrice,
      promoPrice,
      durationHours = 1.0,
      includedItems = [],
      badgeText,
      isActive = true,
      order = 0,
    } = body;

    if (!name || promoPrice === undefined) {
      return NextResponse.json({ error: 'Nome e Preço Promocional são obrigatórios' }, { status: 400 });
    }

    const generatedSlug = slug || slugify(name);
    const serializedIncluded = Array.isArray(includedItems)
      ? JSON.stringify(includedItems)
      : typeof includedItems === 'string'
      ? includedItems
      : JSON.stringify([]);

    const combo = await prisma.combo.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        description: description?.trim() || null,
        imageUrl: imageUrl || null,
        regularPrice: Number(regularPrice) || Number(promoPrice),
        promoPrice: Number(promoPrice) || 0,
        durationHours: Number(durationHours) || 1.0,
        includedItems: serializedIncluded,
        badgeText: badgeText?.trim() || null,
        isActive: Boolean(isActive),
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({
      success: true,
      combo: {
        ...combo,
        includedItems: JSON.parse(combo.includedItems),
      },
    });
  } catch (err: any) {
    console.error('Error creating combo:', err);
    return NextResponse.json(
      { error: 'Erro ao criar combo', details: err.message },
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
    const {
      id,
      name,
      slug,
      description,
      imageUrl,
      regularPrice,
      promoPrice,
      durationHours,
      includedItems,
      badgeText,
      isActive,
      order,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do combo é obrigatório' }, { status: 400 });
    }

    const serializedIncluded =
      includedItems !== undefined
        ? Array.isArray(includedItems)
          ? JSON.stringify(includedItems)
          : String(includedItems)
        : undefined;

    const updated = await prisma.combo.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        slug: slug !== undefined ? slug.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        regularPrice: regularPrice !== undefined ? Number(regularPrice) : undefined,
        promoPrice: promoPrice !== undefined ? Number(promoPrice) : undefined,
        durationHours: durationHours !== undefined ? Number(durationHours) : undefined,
        includedItems: serializedIncluded,
        badgeText: badgeText !== undefined ? badgeText?.trim() || null : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      combo: {
        ...updated,
        includedItems: (() => {
          try {
            return JSON.parse(updated.includedItems);
          } catch {
            return [];
          }
        })(),
      },
    });
  } catch (err: any) {
    console.error('Error updating combo:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar combo', details: err.message },
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
      return NextResponse.json({ error: 'ID do combo é obrigatório' }, { status: 400 });
    }

    await prisma.combo.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Combo excluído com sucesso' });
  } catch (err: any) {
    console.error('Error deleting combo:', err);
    return NextResponse.json(
      { error: 'Erro ao excluir combo', details: err.message },
      { status: 500 }
    );
  }
}
