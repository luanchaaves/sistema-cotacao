/**
 * Contract System Sync Engine
 * Connects with `https://contrato.roboledpartner.com.br` or local microservices
 * to fetch confirmed contracts and events (/api/eventos & /api/contratos),
 * ensuring real-time bidirectional availability synchronization with ultra-fast latency.
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
const CONTRACT_CACHE_TTL = 60 * 1000; // 60 seconds cache

export async function fetchContractSystemEvents(
  contractUrl?: string | null,
  forceRefresh = false
): Promise<ContractEvent[]> {
  const now = Date.now();
  if (!forceRefresh && cachedContracts.length > 0 && now - lastContractFetch < CONTRACT_CACHE_TTL) {
    return cachedContracts;
  }

  const baseCandidates: string[] = [];
  if (contractUrl && typeof contractUrl === 'string' && contractUrl.trim().startsWith('http')) {
    baseCandidates.push(contractUrl.trim().replace(/\/$/, ''));
  }
  baseCandidates.push('https://contrato.roboledpartner.com.br');

  // Primary routes to check
  const routePaths = ['/api/eventos', '/api/contratos', '/api/agenda'];
  const urlsToTry: string[] = [];

  for (const base of baseCandidates) {
    if (base.includes('/api/')) {
      urlsToTry.push(base);
    } else {
      for (const path of routePaths) {
        urlsToTry.push(`${base}${path}`);
      }
    }
  }

  // Fetch all endpoints in PARALLEL with a fast 1500ms timeout
  const fetchPromises = urlsToTry.map(async (url) => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'RoboLedQuoteSync/2.0',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(1500),
        cache: 'no-store',
      });

      if (!res.ok) return [];
      const data = await res.json();
      const rawList: any[] = Array.isArray(data)
        ? data
        : data.events || data.eventos || data.contratos || data.contracts || data.data || [];

      if (!Array.isArray(rawList)) return [];

      const parsed: ContractEvent[] = rawList
        .filter((item: any) => {
          const st = String(
            item.status || item.statusPresentation || item.situacao || ''
          ).toLowerCase();
          return !st.includes('cancel') && !st.includes('recusad') && !st.includes('excluid');
        })
        .map((item: any) => {
          // 1. Parse date (handles YYYY-MM-DD, DD/MM/YYYY, or ISO timestamp)
          let rawDate =
            item.data ||
            item.evento_data ||
            item.eventDate ||
            item.date ||
            item.dataEvento ||
            '';
          if (rawDate.includes('T')) {
            rawDate = rawDate.split('T')[0];
          } else if (rawDate.includes('/')) {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
              rawDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          // 2. Parse client & attraction title
          const clientName =
            item.cliente?.nome ||
            item.cliente_nome ||
            item.nome_evento ||
            item.clientName ||
            item.cliente ||
            item.nome ||
            'Evento Confirmado';

          const eventType =
            item.tipo_evento ||
            item.tipo ||
            item.eventType ||
            item.personagem ||
            (Array.isArray(item.atracoes) && item.atracoes.length > 0
              ? item.atracoes.map((a: any) => a.atracao?.nome || a.nome).filter(Boolean).join(', ')
              : 'Apresentação Robô de LED');

          const eventTime =
            item.horario ||
            item.evento_horario ||
            item.eventTime ||
            item.time ||
            item.hora ||
            null;

          const location =
            item.endereco ||
            item.evento_endereco ||
            item.cidade ||
            item.evento_cidade ||
            item.local ||
            item.location ||
            null;

          const price =
            Number(item.valor_total || item.valor || item.total || item.price) || 0;

          return {
            id: String(item.id || item._id || Math.random().toString()),
            clientName,
            eventType,
            eventDate: rawDate,
            eventTime,
            location,
            status: 'confirmed',
            price,
            source: 'sistema-contrato' as const,
          };
        })
        .filter((ev) => ev.eventDate && ev.eventDate.length === 10);

      return parsed;
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const aggregatedMap = new Map<string, ContractEvent>();

  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      for (const ev of r.value) {
        const key = `${ev.eventDate}_${ev.eventTime || ''}_${ev.clientName}`;
        if (!aggregatedMap.has(key)) {
          aggregatedMap.set(key, ev);
        }
      }
    }
  }

  const events = Array.from(aggregatedMap.values());
  cachedContracts = events;
  lastContractFetch = now;
  return events;
}
