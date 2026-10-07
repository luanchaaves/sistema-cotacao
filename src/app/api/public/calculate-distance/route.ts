import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { geocodeAddress, calculateDrivingDistance } from '@/lib/distance';
import { calculateShippingBreakdown } from '@/lib/calculator';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await req.json();

    const {
      cep,
      street,
      number,
      neighborhood,
      city,
      state,
      destLat,
      destLng,
      manualTollAmount = 0,
    } = body;

    const setting = await prisma.setting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      return NextResponse.json({ error: 'Configurações de origem não encontradas' }, { status: 500 });
    }

    let targetLat = typeof destLat === 'number' ? destLat : null;
    let targetLng = typeof destLng === 'number' ? destLng : null;
    let resolvedAddress = '';

    // If coordinates are not given, attempt to geocode
    if (targetLat === null || targetLng === null) {
      const queryParts = [street, number, neighborhood, city, state, 'Brasil'].filter(Boolean);
      const query = queryParts.join(', ');

      const geoResult = await geocodeAddress(query);
      if (geoResult) {
        targetLat = geoResult.lat;
        targetLng = geoResult.lng;
        resolvedAddress = geoResult.displayName;
      } else if (city && state) {
        // Fallback geocode city
        const cityGeo = await geocodeAddress(`${city}, ${state}, Brasil`);
        if (cityGeo) {
          targetLat = cityGeo.lat;
          targetLng = cityGeo.lng;
          resolvedAddress = `${city} - ${state}`;
        }
      }
    }

    if (targetLat === null || targetLng === null) {
      return NextResponse.json(
        {
          error: 'Não foi possível localizar as coordenadas do endereço informado. Verifique o CEP, Cidade e Estado.',
        },
        { status: 400 }
      );
    }

    // Calculate driving route from registered origin in database
    const route = await calculateDrivingDistance(
      setting.originLat,
      setting.originLng,
      targetLat,
      targetLng
    );

    const shipping = calculateShippingBreakdown({
      distanceOneWayKm: route.distanceKm,
      consumptionKmL: setting.vehicleConsumptionKmL,
      gasPricePerLiter: setting.gasPricePerLiter,
      displacementMarginFixed: setting.displacementMarginFixed,
      tollsCost: Number(manualTollAmount) || 0,
      minShippingPrice: setting.minShippingPrice,
    });

    return NextResponse.json({
      success: true,
      origin: {
        address: `${setting.originStreet}, ${setting.originNumber} - ${setting.originCity} - ${setting.originState}`,
        city: setting.originCity,
        state: setting.originState,
        lat: setting.originLat,
        lng: setting.originLng,
      },
      destination: {
        address: resolvedAddress || `${street || ''} ${number || ''}, ${city} - ${state}`,
        city: city || '',
        state: state || '',
        lat: targetLat,
        lng: targetLng,
      },
      distanceOneWayKm: route.distanceKm,
      distanceTotalKm: shipping.distanceTotalKm,
      durationMinutes: route.durationMinutes,
      isEstimated: route.isEstimated,
      shipping,
    });
  } catch (err: any) {
    console.error('Error calculating distance:', err);
    return NextResponse.json(
      { error: 'Erro ao calcular distância e frete', details: err.message },
      { status: 500 }
    );
  }
}
