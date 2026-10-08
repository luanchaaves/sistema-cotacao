/**
 * Contract System Sync Engine
 * Connects with `https://contrato.roboledpartner.com.br` or `http://192.168.12.7:3001`
 * to fetch confirmed contracts and presentations, ensuring bidirectional availability synchronization.
 */

export interface ContractEvent {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string; // YYYY-MM-DD
  eventTime?: string | null; // HH:mm
  location?: string | null;
  status: string;
  price?: number;
  source: 'sistema-contrato';
}

let cachedContracts: ContractEvent[] = [];
let lastContractFetch = 0;
const CONTRACT_CACHE_TTL = 60 * 1000; // 1 minute

export async function fetchContractSystemEvents(
  contractUrl?: string | null,
  forceRefresh = false
): Promise<ContractEvent[]> {
  const now = Date.now();
  if (!forceRefresh && cachedContracts.length > 0 && now - lastContractFetch < CONTRACT_CACHE_TTL) {
    return cachedContracts;
  }

  const baseUrls: string[] = [];
  if (contractUrl && contractUrl.startsWith('http')) {
    baseUrls.push(contractUrl.replace(/\/$/, ''));
  }
  baseUrls.push(
    'https://contrato.roboledpartner.com.br',
    'http://192.168.12.7:3001',
    'http://host.docker.internal:3001',
    'http://localhost:3001'
  );

  const routePaths = [
    '/api/events',
    '/api/contracts',
    '/api/presentations',
    '/api/festas',
    '/api/shows',
    '/api/agenda',
    '/api/calendar',
    '/api/admin/contracts',
    '/api/admin/events',
  ];

  const endpointsToTry: string[] = [];
  for (const base of baseUrls) {
    for (const path of routePaths) {
      endpointsToTry.push(`${base}${path}`);
    }
  }

  for (const url of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'RoboLedQuoteSync/1.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data)
          ? data
          : data.events || data.contracts || data.presentations || data.items || data.data || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          const parsed: ContractEvent[] = rawList
            .filter((item: any) => {
              const st = String(item.status || item.statusPresentation || '').toLowerCase();
              return !st.includes('cancel') && !st.includes('recusad');
            })
            .map((item: any) => {
              let dateStr = item.eventDate || item.date || item.dataEvento || item.data || '';
              if (dateStr.includes('T')) {
                dateStr = dateStr.split('T')[0];
              } else if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  // DD/MM/YYYY -> YYYY-MM-DD
                  dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }

              return {
                id: String(item.id || item._id || Math.random()),
                clientName:
                  item.clientName ||
                  item.cliente ||
                  item.nome ||
                  item.title ||
                  item.characterName ||
                  'Evento Confirmado (Contrato)',
                eventType: item.eventType || item.tipoEvento || item.attraction || 'Apresentação Robô LED',
                eventDate: dateStr,
                eventTime: item.eventTime || item.time || item.horario || item.hora || null,
                location: item.location || item.local || item.address || item.addressCity || item.cidade || null,
                status: item.status || 'Confirmado',
                price: Number(item.price || item.totalValue || item.valorAcordado) || undefined,
                source: 'sistema-contrato' as const,
              };
            })
            .filter((item) => Boolean(item.eventDate));

          if (parsed.length > 0) {
            cachedContracts = parsed;
            lastContractFetch = now;
            return parsed;
          }
        }
      }
    } catch {
      // Continue searching next candidate endpoint
    }
  }

  return cachedContracts;
}
