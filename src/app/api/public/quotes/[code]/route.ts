import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateWhatsAppMessage, generateWhatsAppUrl } from '@/lib/whatsapp';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Código de orçamento não fornecido' }, { status: 400 });
    }

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [{ code: code.toUpperCase() }, { id: code }],
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    const setting = await prisma.setting.findUnique({ where: { id: 'default' } });

    const selectedComboData = quote.selectedComboData
      ? JSON.parse(quote.selectedComboData)
      : null;
    const selectedServicesData = quote.selectedServicesData
      ? JSON.parse(quote.selectedServicesData)
      : [];
    const selectedCharacters = quote.selectedCharacters
      ? JSON.parse(quote.selectedCharacters)
      : [];

    const whatsappMessage = generateWhatsAppMessage(
      {
        code: quote.code,
        clientName: quote.clientName,
        clientWhatsapp: quote.clientWhatsapp,
        eventType: quote.eventType,
        eventDate: quote.eventDate,
        eventTime: quote.eventTime,
        guestCount: quote.guestCount,
        addressFull: quote.addressFull,
        distanceOneWayKm: quote.distanceOneWayKm,
        distanceTotalKm: quote.distanceTotalKm,
        selectedComboData,
        selectedServicesData,
        selectedCharacters,
        durationHours: quote.durationHours,
        fuelCost: quote.fuelCost,
        marginCost: quote.marginCost,
        tollsCost: quote.tollsCost,
        calculatedShipping: quote.calculatedShipping,
        finalShipping: quote.finalShipping,
        servicesSubtotal: quote.servicesSubtotal,
        totalAmount: quote.totalAmount,
      },
      setting || undefined
    );

    const whatsappUrl = generateWhatsAppUrl(
      setting?.whatsappPhone || '5511919973647',
      whatsappMessage
    );

    return NextResponse.json({
      quote: {
        ...quote,
        selectedComboData,
        selectedServicesData,
        selectedCharacters,
      },
      whatsappMessage,
      whatsappUrl,
      instagramUrl: setting?.instagramUrl || 'https://www.instagram.com/roboledpartner/',
      linktreeUrl: setting?.linktreeUrl || 'https://linktr.ee/roboledpartner',
    });
  } catch (err: any) {
    console.error('Error fetching quote by code:', err);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do orçamento', details: err.message },
      { status: 500 }
    );
  }
}
