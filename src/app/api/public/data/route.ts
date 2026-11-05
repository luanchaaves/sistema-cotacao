import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function GET() {
  try {
    // 1. Prioriza integração em tempo real com a API da Plataforma Central Unificada
    const centralApiUrl = process.env.CENTRAL_API_URL || process.env.NEXT_PUBLIC_CENTRAL_API_URL;
    if (centralApiUrl) {
      try {
        const res = await fetch(`${centralApiUrl.replace(/\/+$/, '')}/public/data`, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          const centralData = await res.json();
          return NextResponse.json(centralData);
        }
      } catch (centralErr) {
        console.warn('API Central indisponível momentaneamente, usando cache local:', centralErr);
      }
    }

    // 2. Fallback local via Prisma
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
