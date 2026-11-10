import { prisma } from '@/lib/prisma';

/**
 * Motor de Sincronização e Resiliência de Cotações Offline
 * Pega orçamentos pendentes no banco local e envia para a API Central
 */
export async function syncOfflineQuotesToCentral(centralApiUrl?: string): Promise<{
  attempted: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  const targetUrl = centralApiUrl || process.env.CENTRAL_API_URL || process.env.NEXT_PUBLIC_CENTRAL_API_URL;
  if (!targetUrl) {
    return { attempted: 0, synced: 0, failed: 0, errors: ['CENTRAL_API_URL não configurada'] };
  }

  const endpoint = `${targetUrl.replace(/\/+$/, '')}/public/quotes`;

  // Busca cotações com status de sincronização pendente
  const pendingQuotes = await prisma.quote.findMany({
    where: {
      notes: { contains: '[PENDING_CENTRAL_SYNC]' },
    },
    take: 50,
  });

  const results = {
    attempted: pendingQuotes.length,
    synced: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const quote of pendingQuotes) {
    try {
      let selectedComboData = null;
      if (quote.selectedComboData) {
        try {
          selectedComboData = typeof quote.selectedComboData === 'string'
            ? JSON.parse(quote.selectedComboData)
            : quote.selectedComboData;
        } catch {
          selectedComboData = null;
        }
      }

      let selectedServicesData = [];
      if (quote.selectedServicesData) {
        try {
          selectedServicesData = typeof quote.selectedServicesData === 'string'
            ? JSON.parse(quote.selectedServicesData)
            : quote.selectedServicesData;
        } catch {
          selectedServicesData = [];
        }
      }

      let selectedCharacters = [];
      if (quote.selectedCharacters) {
        try {
          selectedCharacters = typeof quote.selectedCharacters === 'string'
            ? JSON.parse(quote.selectedCharacters)
            : quote.selectedCharacters;
        } catch {
          selectedCharacters = [];
        }
      }

      const parsedGuests = parseInt(String(quote.guestCount ?? ''), 10);
      const safeGuestCount = !isNaN(parsedGuests) && parsedGuests > 0 ? parsedGuests : null;

      const payload = {
        code: quote.code,
        clientName: quote.clientName,
        clientWhatsapp: quote.clientWhatsapp,
        clientEmail: quote.clientEmail || null,
        eventType: quote.eventType,
        eventDate: quote.eventDate,
        eventTime: quote.eventTime,
        guestCount: safeGuestCount,
        addressFull: quote.addressFull,
        addressCep: quote.addressCep,
        addressCity: quote.addressCity,
        addressState: quote.addressState,
        distanceOneWayKm: quote.distanceOneWayKm,
        distanceTotalKm: quote.distanceTotalKm,
        durationHours: quote.durationHours,
        selectedComboId: quote.selectedComboId,
        selectedComboData,
        selectedServicesData,
        selectedCharacters,
        fuelCost: quote.fuelCost,
        marginCost: quote.marginCost,
        tollsCost: quote.tollsCost,
        calculatedShipping: quote.calculatedShipping,
        finalShipping: quote.finalShipping,
        servicesSubtotal: quote.servicesSubtotal,
        totalAmount: quote.totalAmount,
        notes: (quote.notes || '').replace(/\[PENDING_CENTRAL_SYNC\]/g, '').replace(/\|\s*$/, '').trim() || null,
        status: quote.status,
        ipAddress: quote.ipAddress,
        userAgent: quote.userAgent,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Marca como sincronizado com sucesso
        const updatedNotes = (quote.notes || '').replace(
          '[PENDING_CENTRAL_SYNC]',
          `[SYNCED_TO_CENTRAL] em ${new Date().toISOString()}`
        );
        await prisma.quote.update({
          where: { id: quote.id },
          data: {
            notes: updatedNotes,
          },
        });
        results.synced++;
      } else {
        results.failed++;
        results.errors.push(`Quote ${quote.code}: HTTP ${res.status}`);
      }
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Quote ${quote.code}: ${err.message}`);
    }
  }

  return results;
}
