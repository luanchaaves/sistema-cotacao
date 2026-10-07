import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { calculateQuote } from '@/lib/calculator';
import { generateWhatsAppMessage, generateWhatsAppUrl } from '@/lib/whatsapp';
import { ComboItem, ServiceItem } from '@/lib/types';

function generateQuoteCode(): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RLP-${currentYear}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();

    const {
      clientName,
      clientWhatsapp,
      eventType,
      eventDate,
      eventTime,
      guestCount,
      addressFull,
      addressCep,
      addressCity,
      addressState,
      distanceOneWayKm = 0,
      manualTollAmount = 0,
      selectedComboId = null,
      selectedServices = {},
      selectedCharacterIds = [],
      durationHours = 1.0,
      notes,
    } = body;

    if (!clientName || !clientWhatsapp || !eventType || !eventDate || !addressFull) {
      return NextResponse.json(
        { error: 'Por favor preencha todos os campos obrigatórios da cotação.' },
        { status: 400 }
      );
    }

    // Load active settings and catalog from DB to guarantee backend-enforced prices
    const [setting, allServicesDb, allCombosDb, allCharactersDb] = await Promise.all([
      prisma.setting.findUnique({ where: { id: 'default' } }),
      prisma.service.findMany({ where: { isActive: true } }),
      prisma.combo.findMany({ where: { isActive: true } }),
      prisma.character.findMany({ where: { isActive: true } }),
    ]);

    if (!setting) {
      return NextResponse.json({ error: 'Configurações da empresa não encontradas' }, { status: 500 });
    }

    const services: ServiceItem[] = allServicesDb.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      price: s.price,
      priceType: s.priceType as 'hourly' | 'fixed',
      category: s.category,
      imageUrl: s.imageUrl,
      isActive: s.isActive,
      order: s.order,
    }));

    const combos: ComboItem[] = allCombosDb.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      regularPrice: c.regularPrice,
      promoPrice: c.promoPrice,
      durationHours: c.durationHours,
      includedItems: (() => {
        try {
          return JSON.parse(c.includedItems);
        } catch {
          return [];
        }
      })(),
      isActive: c.isActive,
      order: c.order,
      badgeText: c.badgeText,
    }));

    // Resolve character names from selectedCharacterIds
    const selectedCharObjects = allCharactersDb.filter(
      (ch) => selectedCharacterIds.includes(ch.id) || selectedCharacterIds.includes(ch.slug) || selectedCharacterIds.includes(ch.name)
    );
    const selectedCharacterNames = selectedCharObjects.map((ch) => ch.name);

    // Calculate Authoritative Quote on Backend
    const quoteCalc = calculateQuote({
      setting: {
        id: setting.id,
        companyName: setting.companyName,
        originCep: setting.originCep,
        originStreet: setting.originStreet,
        originNumber: setting.originNumber,
        originComplement: setting.originComplement,
        originNeighborhood: setting.originNeighborhood,
        originCity: setting.originCity,
        originState: setting.originState,
        originLat: setting.originLat,
        originLng: setting.originLng,
        vehicleConsumptionKmL: setting.vehicleConsumptionKmL,
        gasPricePerLiter: setting.gasPricePerLiter,
        displacementMarginFixed: setting.displacementMarginFixed,
        minShippingPrice: setting.minShippingPrice,
        whatsappPhone: setting.whatsappPhone,
        instagramUrl: setting.instagramUrl,
        linktreeUrl: setting.linktreeUrl,
      },
      allServices: services,
      allCombos: combos,
      selectedComboId,
      selectedServicesMap: selectedServices,
      selectedCharacterNames,
      distanceOneWayKm: Number(distanceOneWayKm) || 0,
      manualTollAmount: Number(manualTollAmount) || 0,
      generalDurationHours: Number(durationHours) || 1.0,
    });

    // Generate unique reference code
    let code = generateQuoteCode();
    let collisionCheck = await prisma.quote.findUnique({ where: { code } });
    while (collisionCheck) {
      code = generateQuoteCode();
      collisionCheck = await prisma.quote.findUnique({ where: { code } });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    // Persist to SQLite
    const savedQuote = await prisma.quote.create({
      data: {
        code,
        clientName: clientName.trim(),
        clientWhatsapp: clientWhatsapp.trim(),
        eventType: eventType.trim(),
        eventDate: eventDate.trim(),
        eventTime: (eventTime || '').trim(),
        guestCount: guestCount ? parseInt(String(guestCount), 10) : null,
        addressFull: addressFull.trim(),
        addressCep: addressCep ? addressCep.trim() : null,
        addressCity: addressCity ? addressCity.trim() : null,
        addressState: addressState ? addressState.trim() : null,
        distanceOneWayKm: quoteCalc.shipping.distanceOneWayKm,
        distanceTotalKm: quoteCalc.shipping.distanceTotalKm,
        durationHours: Number(durationHours) || 1.0,
        selectedComboId: quoteCalc.selectedCombo ? quoteCalc.selectedCombo.comboId : null,
        selectedComboData: quoteCalc.selectedCombo ? JSON.stringify(quoteCalc.selectedCombo) : null,
        selectedServicesData: JSON.stringify(quoteCalc.selectedServices),
        selectedCharacters: JSON.stringify(selectedCharacterNames),
        fuelCost: quoteCalc.shipping.fuelCost,
        marginCost: quoteCalc.shipping.marginCost,
        tollsCost: quoteCalc.shipping.tollsCost,
        calculatedShipping: quoteCalc.shipping.calculatedShipping,
        finalShipping: quoteCalc.shipping.finalShipping,
        servicesSubtotal: quoteCalc.servicesSubtotal,
        totalAmount: quoteCalc.totalAmount,
        notes: notes ? String(notes).trim() : null,
        status: 'pending',
        ipAddress,
        userAgent,
      },
    });

    // Generate WhatsApp text & link
    const whatsappMessage = generateWhatsAppMessage({
      code: savedQuote.code,
      clientName: savedQuote.clientName,
      clientWhatsapp: savedQuote.clientWhatsapp,
      eventType: savedQuote.eventType,
      eventDate: savedQuote.eventDate,
      eventTime: savedQuote.eventTime,
      guestCount: savedQuote.guestCount,
      addressFull: savedQuote.addressFull,
      distanceOneWayKm: savedQuote.distanceOneWayKm,
      distanceTotalKm: savedQuote.distanceTotalKm,
      selectedComboData: quoteCalc.selectedCombo,
      selectedServicesData: quoteCalc.selectedServices,
      selectedCharacters: selectedCharacterNames,
      durationHours: savedQuote.durationHours,
      fuelCost: savedQuote.fuelCost,
      marginCost: savedQuote.marginCost,
      tollsCost: savedQuote.tollsCost,
      calculatedShipping: savedQuote.calculatedShipping,
      finalShipping: savedQuote.finalShipping,
      servicesSubtotal: savedQuote.servicesSubtotal,
      totalAmount: savedQuote.totalAmount,
    });

    const whatsappUrl = generateWhatsAppUrl(setting.whatsappPhone, whatsappMessage);

    return NextResponse.json({
      success: true,
      quote: {
        ...savedQuote,
        selectedComboData: quoteCalc.selectedCombo,
        selectedServicesData: quoteCalc.selectedServices,
        selectedCharacters: selectedCharacterNames,
      },
      whatsappMessage,
      whatsappUrl,
      instagramUrl: setting.instagramUrl,
      linktreeUrl: setting.linktreeUrl,
    });
  } catch (err: any) {
    console.error('Error creating quote:', err);
    return NextResponse.json(
      { error: 'Erro ao gerar e registrar orçamento', details: err.message },
      { status: 500 }
    );
  }
}
