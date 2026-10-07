import {
  CompanySetting,
  ServiceItem,
  ComboItem,
  ShippingBreakdown,
  SelectedServicePayload,
  QuoteCalculationResult,
} from './types';

/**
 * Utility helper to round currency values safely to 2 decimal places.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Format a number to Brazilian Real (R$ 1.234,56).
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

/**
 * Calculates complete shipping logistics breakdown.
 *
 * Rules:
 * - Distância total = Distância de ida × 2 (ida e volta)
 * - Litros de combustível = Distância total ÷ Consumo do veículo (km/L)
 * - Custo do combustível = Litros × Preço da gasolina
 * - Frete calculado = Custo combustível + Margem operacional fixa + Pedágios
 * - Frete final = Maior entre (Frete calculado, Frete mínimo)
 */
export function calculateShippingBreakdown(params: {
  distanceOneWayKm: number;
  consumptionKmL: number;
  gasPricePerLiter: number;
  displacementMarginFixed: number;
  tollsCost?: number;
  minShippingPrice: number;
}): ShippingBreakdown {
  const distanceOneWayKm = Math.max(0, roundCurrency(params.distanceOneWayKm || 0));
  const distanceTotalKm = roundCurrency(distanceOneWayKm * 2);
  const consumptionKmL = Math.max(0.1, params.consumptionKmL || 10.0);
  const gasPricePerLiter = Math.max(0, params.gasPricePerLiter || 7.0);
  const marginCost = roundCurrency(params.displacementMarginFixed ?? 30.0);
  const tollsCost = roundCurrency(params.tollsCost || 0);
  const minShippingPrice = roundCurrency(params.minShippingPrice ?? 50.0);

  // Liters needed = total km / km per liter
  const litersNeeded = distanceTotalKm > 0 ? roundCurrency(distanceTotalKm / consumptionKmL) : 0;
  
  // Fuel cost = liters * gas price
  const fuelCost = distanceTotalKm > 0 ? roundCurrency(litersNeeded * gasPricePerLiter) : 0;

  // Calculated shipping before minimum rule
  const calculatedShipping = roundCurrency(fuelCost + marginCost + tollsCost);

  // Apply minimum shipping rule
  const appliedMinShipping = calculatedShipping < minShippingPrice && distanceOneWayKm > 0;
  const finalShipping = distanceOneWayKm > 0 
    ? Math.max(calculatedShipping, minShippingPrice) 
    : 0;

  return {
    distanceOneWayKm,
    distanceTotalKm,
    vehicleConsumptionKmL: consumptionKmL,
    gasPricePerLiter,
    litersNeeded,
    fuelCost,
    marginCost,
    tollsCost,
    calculatedShipping,
    minShippingPrice,
    appliedMinShipping,
    finalShipping: roundCurrency(finalShipping),
  };
}

/**
 * Authoritative quote calculation engine.
 * Computes combo discounts, extra services, character multiplier, duration, and freight.
 */
export function calculateQuote(params: {
  setting: CompanySetting;
  allServices: ServiceItem[];
  allCombos: ComboItem[];
  selectedComboId?: string | null;
  selectedServicesMap?: {
    [serviceIdOrSlug: string]: {
      selected: boolean;
      durationHours?: number;
      selectedCharacters?: string[];
    };
  };
  selectedCharacterNames?: string[];
  distanceOneWayKm: number;
  manualTollAmount?: number;
  generalDurationHours?: number;
}): QuoteCalculationResult {
  const {
    setting,
    allServices,
    allCombos,
    selectedComboId,
    selectedServicesMap = {},
    selectedCharacterNames = [],
    distanceOneWayKm,
    manualTollAmount = 0,
    generalDurationHours = 1.0,
  } = params;

  let servicesSubtotal = 0;
  let selectedComboData: QuoteCalculationResult['selectedCombo'] = null;
  const processedServices: SelectedServicePayload[] = [];

  // Check if a combo is chosen
  const activeCombo = selectedComboId
    ? allCombos.find((c) => c.id === selectedComboId || c.slug === selectedComboId)
    : null;

  if (activeCombo) {
    selectedComboData = {
      comboId: activeCombo.id,
      name: activeCombo.name,
      promoPrice: roundCurrency(activeCombo.promoPrice),
      regularPrice: roundCurrency(activeCombo.regularPrice),
      durationHours: activeCombo.durationHours || generalDurationHours,
      includedItems: activeCombo.includedItems || [],
      characters: selectedCharacterNames,
    };
    servicesSubtotal += selectedComboData.promoPrice;
  }

  // Set of items included in the combo to avoid duplicate charges
  const comboIncludedSet = new Set(
    activeCombo ? (activeCombo.includedItems || []).map((s) => s.toLowerCase().trim()) : []
  );

  // Process individual services
  for (const service of allServices) {
    if (!service.isActive) continue;

    const selectionInfo =
      selectedServicesMap[service.id] || selectedServicesMap[service.slug];

    // If not selected, skip
    if (!selectionInfo || !selectionInfo.selected) continue;

    // Check if service is already included in the active combo
    const isIncludedInCombo =
      activeCombo &&
      (comboIncludedSet.has(service.slug.toLowerCase().trim()) ||
        comboIncludedSet.has(service.name.toLowerCase().trim()) ||
        (service.category === 'character' && comboIncludedSet.has('personagens')) ||
        (service.slug === 'robo-de-led' && comboIncludedSet.has('robo de led')));

    if (isIncludedInCombo) {
      // Already paid for inside the combo, do not double charge base item
      continue;
    }

    const duration = Math.max(0.5, selectionInfo.durationHours || generalDurationHours || 1.0);
    let itemTotal = 0;

    if (service.priceType === 'hourly') {
      if (service.category === 'character' || service.slug === 'personagens') {
        // For characters, if multiple characters are chosen, price per character hour
        const charCount = Math.max(1, (selectionInfo.selectedCharacters || selectedCharacterNames).length);
        itemTotal = roundCurrency(service.price * duration * charCount);
      } else {
        itemTotal = roundCurrency(service.price * duration);
      }
    } else {
      // Fixed price
      itemTotal = roundCurrency(service.price);
    }

    servicesSubtotal += itemTotal;

    processedServices.push({
      serviceId: service.id,
      name: service.name,
      slug: service.slug,
      price: service.price,
      priceType: service.priceType,
      durationHours: duration,
      selectedCharacters: selectionInfo.selectedCharacters || selectedCharacterNames,
      itemTotal,
    });
  }

  servicesSubtotal = roundCurrency(servicesSubtotal);

  // Calculate Shipping Logistics
  const shipping = calculateShippingBreakdown({
    distanceOneWayKm,
    consumptionKmL: setting.vehicleConsumptionKmL,
    gasPricePerLiter: setting.gasPricePerLiter,
    displacementMarginFixed: setting.displacementMarginFixed,
    tollsCost: manualTollAmount,
    minShippingPrice: setting.minShippingPrice,
  });

  const totalAmount = roundCurrency(servicesSubtotal + shipping.finalShipping);

  return {
    selectedCombo: selectedComboData,
    selectedServices: processedServices,
    selectedCharacters: selectedCharacterNames,
    servicesSubtotal,
    shipping,
    totalAmount,
  };
}
