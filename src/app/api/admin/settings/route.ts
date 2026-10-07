import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  await ensureDatabaseSeeded();
  const setting = await prisma.setting.findUnique({ where: { id: 'default' } });
  return NextResponse.json({ setting });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const updated = await prisma.setting.upsert({
      where: { id: 'default' },
      update: {
        companyName: body.companyName ?? 'Robô LED Partner',
        originCep: body.originCep ?? '09710-000',
        originStreet: body.originStreet ?? 'Centro',
        originNumber: body.originNumber ?? '1000',
        originComplement: body.originComplement ?? '',
        originNeighborhood: body.originNeighborhood ?? 'Centro',
        originCity: body.originCity ?? 'São Bernardo do Campo',
        originState: body.originState ?? 'SP',
        originLat: Number(body.originLat) || -23.7000,
        originLng: Number(body.originLng) || -46.5500,
        vehicleConsumptionKmL: Number(body.vehicleConsumptionKmL) || 10.0,
        gasPricePerLiter: Number(body.gasPricePerLiter) || 7.00,
        displacementMarginFixed: Number(body.displacementMarginFixed) ?? 30.00,
        minShippingPrice: Number(body.minShippingPrice) ?? 50.00,
        whatsappPhone: body.whatsappPhone ?? '5511919973647',
        instagramUrl: body.instagramUrl ?? 'https://www.instagram.com/roboledpartner/',
        linktreeUrl: body.linktreeUrl ?? 'https://linktr.ee/roboledpartner',
        maxEventsPerDay: Number(body.maxEventsPerDay) || 2,
        googleCalendarUrl1: body.googleCalendarUrl1 !== undefined ? body.googleCalendarUrl1 : undefined,
        googleCalendarUrl2: body.googleCalendarUrl2 !== undefined ? body.googleCalendarUrl2 : undefined,
        sistemaContratoUrl: body.sistemaContratoUrl !== undefined ? body.sistemaContratoUrl : undefined,
        adminSecretPath: body.adminSecretPath !== undefined ? body.adminSecretPath : undefined,
      },
      create: {
        id: 'default',
        companyName: body.companyName ?? 'Robô LED Partner',
        originCep: body.originCep ?? '09710-000',
        originStreet: body.originStreet ?? 'Centro',
        originNumber: body.originNumber ?? '1000',
        originComplement: body.originComplement ?? '',
        originNeighborhood: body.originNeighborhood ?? 'Centro',
        originCity: body.originCity ?? 'São Bernardo do Campo',
        originState: body.originState ?? 'SP',
        originLat: Number(body.originLat) || -23.7000,
        originLng: Number(body.originLng) || -46.5500,
        vehicleConsumptionKmL: Number(body.vehicleConsumptionKmL) || 10.0,
        gasPricePerLiter: Number(body.gasPricePerLiter) || 7.00,
        displacementMarginFixed: Number(body.displacementMarginFixed) ?? 30.00,
        minShippingPrice: Number(body.minShippingPrice) ?? 50.00,
        whatsappPhone: body.whatsappPhone ?? '5511919973647',
        instagramUrl: body.instagramUrl ?? 'https://www.instagram.com/roboledpartner/',
        linktreeUrl: body.linktreeUrl ?? 'https://linktr.ee/roboledpartner',
        maxEventsPerDay: Number(body.maxEventsPerDay) || 2,
        googleCalendarUrl1: body.googleCalendarUrl1 || null,
        googleCalendarUrl2: body.googleCalendarUrl2 || null,
        sistemaContratoUrl: body.sistemaContratoUrl || 'http://192.168.12.7:3001',
        adminSecretPath: body.adminSecretPath || 'admin',
      },
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações', details: err.message },
      { status: 500 }
    );
  }
}
