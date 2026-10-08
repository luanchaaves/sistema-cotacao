/**
 * Contract System Sync Engine
 * Connects with `https://contrato.roboledpartner.com.br` or `http://192.168.12.7:3001`
 * to fetch confirmed contracts and events (/api/eventos & /api/contratos),
 * ensuring real-time bidirectional availability synchronization.
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
const CONTRACT_CACHE_TTL = 30 * 1000; // 30 seconds

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
  baseCandidates.push(
    'https://contrato.roboledpartner.com.br',
    'http://192.168.12.7:3001',
    'http://sistema-contrato-roboled:3001',
    'http://host.docker.internal:3001',
    'http://localhost:3001'
  );

  const routePaths = [
    '/api/eventos',
    '/api/contratos',
    '/api/v1/eventos',
    '/api/events',
    '/api/contracts',
    '/api/presentations',
    '/api/agenda',
  ];

  const endpointsToTry: string[] = [];

  for (const base of baseCandidates) {
    if (base.includes('/api/')) {
      endpointsToTry.push(base);
    } else {
      for (const path of routePaths) {
        endpointsToTry.push(`${base}${path}`);
      }
    }
  }

  for (const url of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'RoboLedQuoteSync/2.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const rawList: any[] = Array.isArray(data)
          ? data
          : data.events || data.eventos || data.contratos || data.contracts || data.data || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
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
                  // DD/MM/YYYY -> YYYY-MM-DD
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
                Number(item.valor_total || item.valor || item.price || item.totalValue) || undefined;

              return {
                id: String(item.id || item.codigo || item.code || Math.random()),
                clientName,
                eventType,
                eventDate: rawDate,
                eventTime,
                location,
                status: item.status || 'Confirmado',
                price,
                source: 'sistema-contrato' as const,
              };
            })
            .filter((item) => Boolean(item.eventDate && item.eventDate.length >= 8));

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
