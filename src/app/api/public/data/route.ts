import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function GET() {
  try {
    await ensureDatabaseSeeded();

    const [setting, services, combos, characters, tolls] = await Promise.all([
      prisma.setting.findUnique({ where: { id: 'default' } }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.combo.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.character.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.toll.findMany({
        where: { isActive: true },
        orderBy: { highway: 'asc' },
      }),
    ]);

    const formattedCombos = combos.map((c) => ({
      ...c,
      includedItems: (() => {
        try {
          return JSON.parse(c.includedItems);
        } catch {
          return [];
        }
      })(),
    }));

    return NextResponse.json({
      setting,
      services,
      combos: formattedCombos,
      characters,
      tolls,
    });
  } catch (err: any) {
    console.error('API /public/data error:', err);
    return NextResponse.json(
      { error: 'Failed to load initial quotation data', details: err.message },
      { status: 500 }
    );
  }
}
