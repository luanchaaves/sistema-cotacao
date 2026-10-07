/**
 * Distance, Geocoding, and CEP calculation engine for Brazilian addresses.
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean | string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  state?: string;
}

export interface DrivingRouteResult {
  distanceKm: number;
  durationMinutes: number;
  isEstimated: boolean;
  geometry?: any;
}

/**
 * Fetch address details by Brazilian CEP.
 */
export async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return null;
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // Cache for 24h
    });

    if (!res.ok) return null;
    const data: ViaCepResponse = await res.json();
    if (data.erro) return null;
    return data;
  } catch (err) {
    console.error('Error fetching CEP:', err);
    return null;
  }
}

/**
 * Geocode text query using OpenStreetMap Nominatim with safety fallbacks.
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&countrycodes=br&limit=1&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RoboLedPartner-QuotationSystem/1.0 (contato@roboledpartner.com.br)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.municipality,
        state: item.address?.state,
      };
    }

    return null;
  } catch (err) {
    console.error('Error geocoding address:', err);
    return null;
  }
}

/**
 * Calculates straight line (Haversine) distance in kilometers between two GPS coordinates.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate driving distance and time between origin and destination coordinates.
 * Tries OSRM routing first, and uses 1.35x winding curvature factor fallback if OSRM is offline.
 */
export async function calculateDrivingDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DrivingRouteResult> {
  // If coordinates are almost identical
  if (
    Math.abs(originLat - destLat) < 0.0001 &&
    Math.abs(originLng - destLng) < 0.0001
  ) {
    return {
      distanceKm: 0,
      durationMinutes: 0,
      isEstimated: false,
    };
  }

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RoboLedPartner-QuotationSystem/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.round(route.duration / 60);

        return {
          distanceKm: Math.max(1, distanceKm),
          durationMinutes: Math.max(1, durationMinutes),
          isEstimated: false,
        };
      }
    }
  } catch (err) {
    // Timeout or network error, fallback to Haversine with road multiplier
    console.warn('OSRM routing unavailable, using road factor fallback:', err);
  }

  // Fallback: Haversine distance with 1.35x road curvature factor for SP metro & interior
  const straightLine = calculateHaversineDistanceKm(
    originLat,
    originLng,
    destLat,
    destLng
  );
  const estimatedRoadKm = Math.round(straightLine * 1.35 * 10) / 10;
  const estimatedDurationMinutes = Math.round((estimatedRoadKm / 45) * 60); // average 45km/h in SP

  return {
    distanceKm: Math.max(1, estimatedRoadKm),
    durationMinutes: Math.max(5, estimatedDurationMinutes),
    isEstimated: true,
  };
}
