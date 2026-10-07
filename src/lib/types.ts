export type EventType =
  | 'Casamento'
  | 'Aniversário'
  | '15 anos'
  | 'Festa infantil'
  | 'Evento corporativo'
  | 'Formatura'
  | 'Festa de empresa'
  | 'Outro';

export interface CompanySetting {
  id: string;
  companyName: string;
  originCep: string;
  originStreet: string;
  originNumber: string;
  originComplement: string;
  originNeighborhood: string;
  originCity: string;
  originState: string;
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
}

export interface BlockedScheduleItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string | null;
  endTime?: string | null;
  isFullDay: boolean;
  reason?: string | null;
  status: string; // 'blocked' | 'confirmed'
}

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  priceType: 'hourly' | 'fixed';
  category: string;
  imageUrl?: string | null;
  isActive: boolean;
  order: number;
}

export interface CharacterItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageUrl?: string | null;
  isActive: boolean;
  order: number;
}

export interface ComboItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  regularPrice: number;
  promoPrice: number;
  durationHours: number;
  includedItems: string[]; // slugs or names of included services
  isActive: boolean;
  order: number;
  badgeText?: string | null;
}

export interface TollItem {
  id: string;
  name: string;
  highway: string;
  price: number;
  region: string;
  direction: string;
  isActive: boolean;
}

export interface DistanceCalculationResult {
  origin: {
    address: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
  distanceOneWayKm: number;
  distanceTotalKm: number;
  durationMinutes: number;
  isEstimated: boolean;
}

export interface ShippingBreakdown {
  distanceOneWayKm: number;
  distanceTotalKm: number;
  vehicleConsumptionKmL: number;
  gasPricePerLiter: number;
  litersNeeded: number;
  fuelCost: number;
  marginCost: number;
  tollsCost: number;
  calculatedShipping: number;
  minShippingPrice: number;
  appliedMinShipping: boolean;
  finalShipping: number;
}

export interface SelectedServicePayload {
  serviceId: string;
  name: string;
  slug: string;
  price: number;
  priceType: 'hourly' | 'fixed';
  durationHours: number;
  selectedCharacters?: string[]; // character names/slugs
  itemTotal: number;
}

export interface QuoteCalculationResult {
  selectedCombo?: {
    comboId: string;
    name: string;
    promoPrice: number;
    regularPrice: number;
    durationHours: number;
    includedItems: string[];
    characters?: string[];
  } | null;
  selectedServices: SelectedServicePayload[];
  selectedCharacters: string[];
  servicesSubtotal: number;
  shipping: ShippingBreakdown;
  totalAmount: number;
}

export interface QuoteFormData {
  // Step 1 - Event
  clientName: string;
  clientWhatsapp: string;
  eventType: EventType | string;
  eventDate: string;
  eventTime: string;
  guestCount?: number | string;

  // Step 2 - Location
  addressFull?: string;
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  destinationLat?: number;
  destinationLng?: number;
  distanceOneWayKm: number;
  manualTollAmount?: number;

  // Step 3 & 4 - Attractions & Duration
  selectedComboId?: string | null;
  selectedServices: {
    [serviceId: string]: {
      selected: boolean;
      durationHours: number;
      selectedCharacters?: string[];
    };
  };
  selectedCharacterIds: string[];
  durationHours: number; // General duration or base
  notes?: string;
}

export interface SavedQuote {
  id: string;
  code: string;
  clientName: string;
  clientWhatsapp: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  guestCount?: number | null;
  addressFull: string;
  addressCep?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  distanceOneWayKm: number;
  distanceTotalKm: number;
  durationHours: number;
  selectedComboId?: string | null;
  selectedComboData?: any;
  selectedServicesData: SelectedServicePayload[];
  selectedCharacters?: string[] | null;
  fuelCost: number;
  marginCost: number;
  tollsCost: number;
  calculatedShipping: number;
  finalShipping: number;
  servicesSubtotal: number;
  totalAmount: number;
  notes?: string | null;
  status: 'pending' | 'contacted' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
