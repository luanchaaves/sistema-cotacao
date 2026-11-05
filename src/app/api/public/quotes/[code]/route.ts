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

    const centralApiUrl = process.env.CENTRAL_API_URL || process.env.NEXT_PUBLIC_CENTRAL_API_URL;
    if (centralApiUrl) {
      try {
        const res = await fetch(`${centralApiUrl.replace(/\/+$/, '')}/public/quotes/${code}`, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          const centralQuote = await res.json();
          const selectedComboData = typeof centralQuote.selectedComboData === 'string'
            ? JSON.parse(centralQuote.selectedComboData)
            : (centralQuote.selectedComboData || null);
          const selectedServicesData = typeof centralQuote.selectedServicesData === 'string'
            ? JSON.parse(centralQuote.selectedServicesData)
            : (centralQuote.selectedServicesData || []);
          const selectedCharacters = typeof centralQuote.selectedCharacters === 'string'
            ? JSON.parse(centralQuote.selectedCharacters)
            : (centralQuote.selectedCharacters || []);

          const whatsappMessage = generateWhatsAppMessage(
            {
              code: centralQuote.code || centralQuote.codigo,
              clientName: centralQuote.clientName || centralQuote.cliente_nome,
              clientWhatsapp: centralQuote.clientWhatsapp || centralQuote.cliente_telefone,
              eventType: centralQuote.eventType || centralQuote.tipo_evento,
              eventDate: centralQuote.eventDate || centralQuote.data_evento,
              eventTime: centralQuote.eventTime || centralQuote.horario_evento,
              guestCount: centralQuote.guestCount || centralQuote.quantidade_convidados,
              addressFull: centralQuote.addressFull || centralQuote.endereco_evento,
              distanceOneWayKm: centralQuote.distanceOneWayKm || centralQuote.distancia_km,
              distanceTotalKm: centralQuote.distanceTotalKm || ((centralQuote.distancia_km || 0) * 2),
              selectedComboData,
              selectedServicesData,
              selectedCharacters,
              calculatedShipping: centralQuote.calculatedShipping || centralQuote.valor_deslocamento || 0,
              finalShipping: centralQuote.finalShipping || centralQuote.valor_deslocamento || 0,
              servicesSubtotal: centralQuote.servicesSubtotal || centralQuote.valor_servicos || 0,
              totalAmount: centralQuote.totalAmount || centralQuote.valor_total || 0,
              fuelCost: centralQuote.fuelCost || 0,
              marginCost: centralQuote.marginCost || 0,
              tollsCost: centralQuote.tollsCost || centralQuote.valor_pedagios || 0,
            },
            {
              companyName: 'Robô LED Partner',
              whatsappPhone: '11985923985',
              originCity: 'São Bernardo do Campo',
              originState: 'SP',
            }
          );

          const whatsappUrl = generateWhatsAppUrl('11985923985', whatsappMessage);

          return NextResponse.json({
            quote: centralQuote,
            whatsappMessage,
            whatsappUrl,
            publicUrl: `https://cotacao.roboledpartner.com.br/orcamento/${centralQuote.code || centralQuote.codigo}`,
          });
        }
      } catch (centralErr) {
        console.warn('Falha ao buscar orçamento na API central, usando fallback local:', centralErr);
      }
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
