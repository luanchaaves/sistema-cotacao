import { formatCurrencyBRL } from './calculator';
import { CompanySetting, SavedQuote } from './types';

/**
 * Generate a clean, highly professional WhatsApp message for the quote proposal.
 */
export function generateWhatsAppMessage(
  quote: {
    code: string;
    clientName: string;
    clientWhatsapp: string;
    eventType: string;
    eventDate: string;
    eventTime: string;
    guestCount?: number | string | null;
    addressFull: string;
    distanceOneWayKm: number;
    distanceTotalKm: number;
    selectedComboData?: any;
    selectedServicesData?: any[];
    selectedCharacters?: string[] | null;
    durationHours?: number;
    fuelCost: number;
    marginCost: number;
    tollsCost: number;
    calculatedShipping: number;
    finalShipping: number;
    servicesSubtotal: number;
    totalAmount: number;
  },
  setting?: Partial<CompanySetting>
): string {
  const dateFormatted = quote.eventDate;
  const timeFormatted = quote.eventTime ? `às ${quote.eventTime}` : '';

  let attractionsText = '';

  if (quote.selectedComboData && quote.selectedComboData.name) {
    attractionsText += `• *Combo:* ${quote.selectedComboData.name} (${quote.selectedComboData.durationHours || quote.durationHours || 1}h) — ${formatCurrencyBRL(
      quote.selectedComboData.promoPrice
    )}\n`;
  }

  if (Array.isArray(quote.selectedServicesData) && quote.selectedServicesData.length > 0) {
    for (const s of quote.selectedServicesData) {
      const charInfo =
        s.selectedCharacters && s.selectedCharacters.length > 0
          ? ` [${s.selectedCharacters.join(', ')}]`
          : '';
      const durInfo = s.priceType === 'hourly' ? ` (${s.durationHours}h)` : '';
      attractionsText += `• ${s.name}${charInfo}${durInfo} — ${formatCurrencyBRL(s.itemTotal)}\n`;
    }
  }

  if (!attractionsText) {
    attractionsText = '• Atrações a confirmar\n';
  }

  const lines = [
    `*ROBÔ LED PARTNER — ORÇAMENTO COMERCIAL*`,
    `Ref: #${quote.code}`,
    ``,
    `Olá, equipe Robô LED Partner! Fiz uma cotação pelo site e gostaria de confirmar meu orçamento e a disponibilidade da data para o meu evento:`,
    ``,
    `📋 *DADOS DO EVENTO*`,
    `• *Cliente:* ${quote.clientName}`,
    `• *WhatsApp:* ${quote.clientWhatsapp}`,
    `• *Tipo de Evento:* ${quote.eventType}`,
    `• *Data:* ${dateFormatted} ${timeFormatted}`.trim(),
    quote.guestCount ? `• *Estimativa de convidados:* ${quote.guestCount}` : null,
    `• *Local:* ${quote.addressFull}`,
    ``,
    `✨ *ATRAÇÕES CONTRATADAS*`,
    attractionsText.trim(),
    `*Subtotal Atrações:* ${formatCurrencyBRL(quote.servicesSubtotal)}`,
    ``,
    `🚚 *LOGÍSTICA & DESLOCAMENTO*`,
    `• *Distância:* ${quote.distanceOneWayKm} km (Ida e volta: ${quote.distanceTotalKm} km)`,
    `• *Combustível:* ${formatCurrencyBRL(quote.fuelCost)}`,
    `• *Margem operacional:* ${formatCurrencyBRL(quote.marginCost)}`,
    quote.tollsCost > 0 ? `• *Pedágios:* ${formatCurrencyBRL(quote.tollsCost)}` : null,
    `*Frete Total:* ${formatCurrencyBRL(quote.finalShipping)}`,
    ``,
    `💰 *TOTAL ESTIMADO: ${formatCurrencyBRL(quote.totalAmount)}*`,
    ``,
    `_Este orçamento é uma estimativa automática sujeita à confirmação de disponibilidade da data e condições técnicas do local._`,
  ].filter((item) => item !== null);

  return lines.join('\n');
}

/**
 * Generate complete WhatsApp Web / Mobile redirect URL.
 */
export function generateWhatsAppUrl(
  phone: string,
  message: string
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  // Default to 5511919973647 if phone is empty
  const targetPhone = cleanPhone || '5511919973647';
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send/?phone=${targetPhone}&text=${encodedText}&type=phone_number&app_absent=0`;
}
