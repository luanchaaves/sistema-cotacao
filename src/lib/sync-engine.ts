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
      const payload = {
        code: quote.code,
        clientName: quote.clientName,
        clientWhatsapp: quote.clientWhatsapp,
        eventType: quote.eventType,
        eventDate: quote.eventDate,
        eventTime: quote.eventTime,
        guestCount: quote.guestCount,
        addressFull: quote.addressFull,
        addressCep: quote.addressCep,
        addressCity: quote.addressCity,
        addressState: quote.addressState,
        distanceOneWayKm: quote.distanceOneWayKm,
        durationHours: quote.durationHours,
        selectedComboId: quote.selectedComboId,
        selectedComboData: quote.selectedComboData ? JSON.parse(quote.selectedComboData) : null,
        selectedServicesData: quote.selectedServicesData ? JSON.parse(quote.selectedServicesData) : [],
        selectedCharacters: quote.selectedCharacters ? JSON.parse(quote.selectedCharacters) : [],
        fuelCost: quote.fuelCost,
        marginCost: quote.marginCost,
        tollsCost: quote.tollsCost,
        calculatedShipping: quote.calculatedShipping,
        finalShipping: quote.finalShipping,
        servicesSubtotal: quote.servicesSubtotal,
        totalAmount: quote.totalAmount,
        notes: quote.notes,
        status: quote.status,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Marca como sincronizado com sucesso
        const updatedNotes = (quote.notes || '').replace('[PENDING_CENTRAL_SYNC]', `[SYNCED_TO_CENTRAL] em ${new Date().toISOString()}`);
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
