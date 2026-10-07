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

  const services = await prisma.service.findMany({
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ services });
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
      price,
      priceType = 'hourly',
      category = 'attraction',
      imageUrl,
      isActive = true,
      order = 0,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 });
    }

    const generatedSlug = slug || slugify(name);

    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        description: description?.trim() || null,
        price: Number(price) || 0,
        priceType: priceType === 'fixed' ? 'fixed' : 'hourly',
        category: category || 'attraction',
        imageUrl: imageUrl || null,
        isActive: Boolean(isActive),
        order: Number(order) || 0,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (err: any) {
    console.error('Error creating service:', err);
    return NextResponse.json(
      { error: 'Erro ao criar serviço', details: err.message },
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
    const { id, name, slug, description, price, priceType, category, imageUrl, isActive, order } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        slug: slug !== undefined ? slug.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        price: price !== undefined ? Number(price) : undefined,
        priceType: priceType !== undefined ? (priceType === 'fixed' ? 'fixed' : 'hourly') : undefined,
        category: category !== undefined ? category : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (err: any) {
    console.error('Error updating service:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar serviço', details: err.message },
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
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Serviço excluído com sucesso' });
  } catch (err: any) {
    console.error('Error deleting service:', err);
    return NextResponse.json(
      { error: 'Erro ao excluir serviço', details: err.message },
      { status: 500 }
    );
  }
}
