import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { calculateQuote } from '@/lib/calculator';
import { generateWhatsAppMessage, generateWhatsAppUrl } from '@/lib/whatsapp';
import { ComboItem, ServiceItem } from '@/lib/types';
import { syncOfflineQuotesToCentral } from '@/lib/sync-engine';
import { getEffectiveSetting } from '@/lib/central-setting';

function generateQuoteCode(): string {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RLP-${currentYear}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await ensureDatabaseSeeded();

    const {
      clientName,
      clientWhatsapp,
      clientEmail,
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

    // Sanitização e validação robusta de tipos numéricos
    const parsedGuest = parseInt(String(guestCount ?? ''), 10);
    const safeGuestCount = !isNaN(parsedGuest) && parsedGuest > 0 ? parsedGuest : null;

    const parsedDist = Number(distanceOneWayKm);
    const safeDistOneWay = !isNaN(parsedDist) && parsedDist >= 0 ? parsedDist : 0;

    const parsedToll = Number(manualTollAmount);
    const safeManualToll = !isNaN(parsedToll) && parsedToll >= 0 ? parsedToll : 0;

    const parsedDur = Number(durationHours);
    const safeDuration = !isNaN(parsedDur) && parsedDur > 0 ? parsedDur : 1.0;

    // 1. Carregar configurações efetivas (API Central com fallback Prisma) e catálogo para cálculo autorizado
    const [setting, allServicesDb, allCombosDb, allCharactersDb] = await Promise.all([
      getEffectiveSetting(),
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

    const selectedCharObjects = allCharactersDb.filter(
      (ch) => selectedCharacterIds.includes(ch.id) || selectedCharacterIds.includes(ch.slug) || selectedCharacterIds.includes(ch.name)
    );
    const selectedCharacterNames = selectedCharObjects.map((ch) => ch.name);

    // 2. Calcular orçamento autorizado
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
        maxEventsPerDay: setting.maxEventsPerDay || 2,
      },
      allServices: services,
      allCombos: combos,
      selectedComboId,
      selectedServicesMap: selectedServices,
      selectedCharacterNames,
      distanceOneWayKm: safeDistOneWay,
      manualTollAmount: safeManualToll,
      generalDurationHours: safeDuration,
    });

    // 3. Gerar código único e amigável
    let code = (body.code || generateQuoteCode()).trim();
    let collisionCheck = await prisma.quote.findUnique({ where: { code } });
    while (collisionCheck && !body.code) {
      code = generateQuoteCode();
      collisionCheck = await prisma.quote.findUnique({ where: { code } });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    // 4. PERSISTÊNCIA LOCAL CONFIRMADA (Garantia de Zero Perda de Dados)
    // A cotação é salva localmente com tag de sincronização pendente ANTES de tentar envio externo.
    const cleanEmail = clientEmail ? String(clientEmail).trim() : null;
    const initialNotes = [notes ? String(notes).trim() : null, '[PENDING_CENTRAL_SYNC]'].filter(Boolean).join(' | ');

    const savedQuote = await prisma.quote.create({
      data: {
        code,
        clientName: clientName.trim(),
        clientWhatsapp: clientWhatsapp.trim(),
        clientEmail: cleanEmail,
        eventType: eventType.trim(),
        eventDate: eventDate.trim(),
        eventTime: (eventTime || '').trim(),
        guestCount: safeGuestCount,
        addressFull: addressFull.trim(),
        addressCep: addressCep ? String(addressCep).trim() : null,
        addressCity: addressCity ? String(addressCity).trim() : null,
        addressState: addressState ? String(addressState).trim() : null,
        distanceOneWayKm: quoteCalc.shipping.distanceOneWayKm,
        distanceTotalKm: quoteCalc.shipping.distanceTotalKm,
        durationHours: safeDuration,
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
        notes: initialNotes,
        status: 'pending',
        ipAddress,
        userAgent,
      },
    });

    // 5. SINCRONIZAÇÃO IDEMPOTENTE COM API CENTRAL
    const centralApiUrl = process.env.CENTRAL_API_URL || process.env.NEXT_PUBLIC_CENTRAL_API_URL;
    if (centralApiUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

        const syncPayload = {
          code: savedQuote.code,
          clientName: savedQuote.clientName,
          clientWhatsapp: savedQuote.clientWhatsapp,
          clientEmail: savedQuote.clientEmail,
          eventType: savedQuote.eventType,
          eventDate: savedQuote.eventDate,
          eventTime: savedQuote.eventTime,
          guestCount: savedQuote.guestCount,
          addressFull: savedQuote.addressFull,
          addressCep: savedQuote.addressCep,
          addressCity: savedQuote.addressCity,
          addressState: savedQuote.addressState,
          distanceOneWayKm: savedQuote.distanceOneWayKm,
          distanceTotalKm: savedQuote.distanceTotalKm,
          durationHours: savedQuote.durationHours,
          selectedComboId: savedQuote.selectedComboId,
          selectedComboData: quoteCalc.selectedCombo,
          selectedServicesData: quoteCalc.selectedServices,
          selectedCharacters: selectedCharacterNames,
          fuelCost: savedQuote.fuelCost,
          marginCost: savedQuote.marginCost,
          tollsCost: savedQuote.tollsCost,
          calculatedShipping: savedQuote.calculatedShipping,
          finalShipping: savedQuote.finalShipping,
          servicesSubtotal: savedQuote.servicesSubtotal,
          totalAmount: savedQuote.totalAmount,
          notes: notes ? String(notes).trim() : null,
          status: savedQuote.status,
          ipAddress: savedQuote.ipAddress,
          userAgent: savedQuote.userAgent,
        };

        const centralRes = await fetch(`${centralApiUrl.replace(/\/+$/, '')}/public/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (centralRes.ok) {
          const syncedNotes = (savedQuote.notes || '').replace(
            '[PENDING_CENTRAL_SYNC]',
            `[SYNCED_TO_CENTRAL] em ${new Date().toISOString()}`
          );
          await prisma.quote.update({
            where: { id: savedQuote.id },
            data: { notes: syncedNotes },
          });

          // Dispara flush de eventuais cotações em background
          syncOfflineQuotesToCentral(centralApiUrl).catch(() => {});
        } else {
          console.warn(`⚠️ Central API retornou HTTP ${centralRes.status} para cotação ${savedQuote.code}. Fila local preservada.`);
        }
      } catch (centralErr: any) {
        console.warn(`⚠️ Central API indisponível (${centralErr?.message || centralErr}). Cotação salva localmente com tag offline.`);
      }
    }

    // 6. Gerar Mensagem e Link de WhatsApp
    const whatsappMessage = generateWhatsAppMessage({
      code: savedQuote.code,
      clientName: savedQuote.clientName,
      clientWhatsapp: savedQuote.clientWhatsapp,
      clientEmail: savedQuote.clientEmail,
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
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating quote:', err);
    return NextResponse.json(
      { error: 'Erro ao gerar e registrar orçamento', details: err.message },
      { status: 500 }
    );
  }
}
