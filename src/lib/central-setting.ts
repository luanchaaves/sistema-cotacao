import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';

export interface EffectiveSetting {
  id: string;
  companyName: string;
  originStreet: string;
  originNumber: string;
  originComplement: string;
  originNeighborhood: string;
  originCity: string;
  originState: string;
  originCep: string;
  originLat: number;
  originLng: number;
  vehicleConsumptionKmL: number;
  gasPricePerLiter: number;
  displacementMarginFixed: number;
  minShippingPrice: number;
  whatsappPhone: string;
  instagramUrl: string;
  linktreeUrl: string;
  maxEventsPerDay: number;
  googleCalendarIcalUrl?: string | null;
  googleCalendarUrl1?: string | null;
  googleCalendarUrl2?: string | null;
  sistemaContratoUrl?: string | null;
  adminSecretPath?: string | null;
  updatedAt?: Date | string;
}

/**
 * Obtém as configurações efetivas da empresa.
 * Prioridade 1: API Central Unificada (${CENTRAL_API_URL}/public/data), garantindo que alterações
 * feitas no painel administrativo sejam refletidas imediatamente na Cotação Pública.
 * Prioridade 2: Fallback local via Prisma SQLite caso a API Central não esteja configurada ou se
 * strict for falso e a Central estiver offline.
 *
 * @param options.strict Se true, lança erro caso CENTRAL_API_URL esteja definida mas a Central falhe/esteja offline.
 */
export async function getEffectiveSetting(options?: { strict?: boolean }): Promise<EffectiveSetting> {
  const centralApiUrl = process.env.CENTRAL_API_URL || process.env.NEXT_PUBLIC_CENTRAL_API_URL;

  if (centralApiUrl) {
    try {
      const res = await fetch(`${centralApiUrl.replace(/\/+$/, '')}/public/data`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.setting) {
          const s = data.setting;
          return {
            id: s.id || 'default',
            companyName: s.companyName || s.company_name || 'Robô LED Partner',
            originStreet: s.originStreet || s.origin_street || 'Centro',
            originNumber: s.originNumber || s.origin_number || 'S/N',
            originComplement: s.originComplement || s.origin_complement || '',
            originNeighborhood: s.originNeighborhood || s.origin_neighborhood || 'Centro',
            originCity: s.originCity || s.origin_city || 'São Bernardo do Campo',
            originState: s.originState || s.origin_state || 'SP',
            originCep: s.originCep || s.origin_cep || '09710-000',
            originLat: Number(s.originLat ?? s.origin_lat ?? -23.6914),
            originLng: Number(s.originLng ?? s.origin_lng ?? -46.5646),
            vehicleConsumptionKmL: Number(s.vehicleConsumptionKmL ?? s.vehicle_consumption_km_l ?? 10.0),
            gasPricePerLiter: Number(s.gasPricePerLiter ?? s.gas_price_per_liter ?? 7.0),
            displacementMarginFixed: Number(s.displacementMarginFixed ?? s.displacement_margin_fixed ?? 30.0),
            minShippingPrice: Number(s.minShippingPrice ?? s.min_shipping_price ?? 50.0),
            whatsappPhone: s.whatsappPhone || s.whatsapp_phone || '5511919973647',
            instagramUrl: s.instagramUrl || s.instagram_url || 'https://www.instagram.com/roboledpartner/',
            linktreeUrl: s.linktreeUrl || s.linktree_url || 'https://linktr.ee/roboledpartner',
            maxEventsPerDay: Number(s.maxEventsPerDay ?? s.max_events_per_day ?? 2),
            googleCalendarIcalUrl: s.googleCalendarIcalUrl || s.google_calendar_ical_url || null,
            googleCalendarUrl1: s.googleCalendarUrl1 || s.google_calendar_url_1 || null,
            googleCalendarUrl2: s.googleCalendarUrl2 || s.google_calendar_url_2 || null,
            sistemaContratoUrl: s.sistemaContratoUrl || s.sistema_contrato_url || 'http://192.168.12.7:3001',
            adminSecretPath: s.adminSecretPath || s.admin_secret_path || 'admin',
            updatedAt: s.updatedAt || s.updated_at,
          };
        }
      } else if (options?.strict) {
        throw new Error(`Central API retornou HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (centralErr: any) {
      if (options?.strict) {
        console.error('[getEffectiveSetting] Erro estrito: Central API indisponível:', centralErr);
        throw new Error(`Serviço central de precificação e configurações indisponível: ${centralErr?.message || centralErr}`);
      }
      console.warn('[getEffectiveSetting] Central API indisponível, usando fallback local Prisma:', centralErr);
    }
  }

  // Fallback local Prisma
  await ensureDatabaseSeeded();
  const localSetting = await prisma.setting.findUnique({ where: { id: 'default' } });

  if (localSetting) {
    return {
      id: localSetting.id,
      companyName: localSetting.companyName,
      originStreet: localSetting.originStreet,
      originNumber: localSetting.originNumber,
      originComplement: localSetting.originComplement,
      originNeighborhood: localSetting.originNeighborhood,
      originCity: localSetting.originCity,
      originState: localSetting.originState,
      originCep: localSetting.originCep,
      originLat: localSetting.originLat,
      originLng: localSetting.originLng,
      vehicleConsumptionKmL: localSetting.vehicleConsumptionKmL,
      gasPricePerLiter: localSetting.gasPricePerLiter,
      displacementMarginFixed: localSetting.displacementMarginFixed,
      minShippingPrice: localSetting.minShippingPrice,
      whatsappPhone: localSetting.whatsappPhone,
      instagramUrl: localSetting.instagramUrl,
      linktreeUrl: localSetting.linktreeUrl,
      maxEventsPerDay: localSetting.maxEventsPerDay,
      googleCalendarIcalUrl: localSetting.googleCalendarIcalUrl,
      googleCalendarUrl1: localSetting.googleCalendarUrl1,
      googleCalendarUrl2: localSetting.googleCalendarUrl2,
      sistemaContratoUrl: localSetting.sistemaContratoUrl,
      adminSecretPath: localSetting.adminSecretPath,
      updatedAt: localSetting.updatedAt,
    };
  }

  // Fallback garantido
  return {
    id: 'default',
    companyName: 'Robô LED Partner',
    originStreet: 'Centro',
    originNumber: 'S/N',
    originComplement: '',
    originNeighborhood: 'Centro',
    originCity: 'São Bernardo do Campo',
    originState: 'SP',
    originCep: '09710-000',
    originLat: -23.6914,
    originLng: -46.5646,
    vehicleConsumptionKmL: 10.0,
    gasPricePerLiter: 7.0,
    displacementMarginFixed: 30.0,
    minShippingPrice: 50.0,
    whatsappPhone: '5511919973647',
    instagramUrl: 'https://www.instagram.com/roboledpartner/',
    linktreeUrl: 'https://linktr.ee/roboledpartner',
    maxEventsPerDay: 2,
    sistemaContratoUrl: 'http://192.168.12.7:3001',
    adminSecretPath: 'admin',
  };
}
