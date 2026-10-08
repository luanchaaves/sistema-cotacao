/**
 * Contract System Sync Engine
 * Connects with `https://contrato.roboledpartner.com.br` or `http://192.168.12.7:3001`
 * to fetch confirmed contracts and presentations, ensuring bidirectional availability synchronization.
 */

export interface ContractEvent {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string; // YYYY-MM-DD or DD/MM/YYYY
  eventTime?: string | null; // HH:mm
  addressCity?: string | null;
  status: string;
  source: 'sistema-contrato';
}

let cachedContracts: ContractEvent[] = [];
let lastContractFetch = 0;
const CONTRACT_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function fetchContractSystemEvents(
  contractUrl?: string | null,
  forceRefresh = false
): Promise<ContractEvent[]> {
  const now = Date.now();
  if (!forceRefresh && cachedContracts.length > 0 && now - lastContractFetch < CONTRACT_CACHE_TTL) {
    return cachedContracts;
  }

  const endpointsToTry: string[] = [];
  if (contractUrl && contractUrl.startsWith('http')) {
    const cleanUrl = contractUrl.replace(/\/$/, '');
    endpointsToTry.push(`${cleanUrl}/api/contracts`, `${cleanUrl}/api/events`, `${cleanUrl}/api/admin/contracts`);
  }
  // Also try internal host if on same server
  endpointsToTry.push(
    'https://contrato.roboledpartner.com.br/api/contracts',
    'http://192.168.12.7:3001/api/contracts',
    'http://localhost:3001/api/contracts'
  );

  for (const url of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        headers: { 'User-Agent': 'RoboLedQuoteSync/1.0' },
        signal: controller.signal,
        next: { revalidate: 180 },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : data.contracts || data.events || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          const parsed: ContractEvent[] = rawList
            .filter((item: any) => {
              const st = (item.status || '').toLowerCase();
              return st === 'confirmed' || st === 'confirmado' || st === 'fechado' || st === 'active' || !item.status;
            })
            .map((item: any) => {
              let dateStr = item.eventDate || item.date || item.dataEvento || '';
              // Format date
              if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
              }

              return {
                id: item.id || Math.random().toString(),
                clientName: item.clientName || item.cliente || item.name || 'Cliente Contrato',
                eventType: item.eventType || item.tipoEvento || 'Apresentação Robô LED',
                eventDate: dateStr,
                eventTime: item.eventTime || item.time || item.horario || null,
                addressCity: item.addressCity || item.city || item.cidade || null,
                status: item.status || 'confirmed',
                source: 'sistema-contrato' as const,
              };
            });

          cachedContracts = parsed;
          lastContractFetch = now;
          return parsed;
        }
      }
    } catch {
      // Continue to next endpoint attempt silently
    }
  }

  return cachedContracts;
}
