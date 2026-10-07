import { formatCurrencyBRL } from './calculator';
import { CompanySetting } from './types';

/**
 * Generate a clean, high-converting, professional WhatsApp message for the quote proposal.
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

  const attractionsLines: string[] = [];

  if (quote.selectedComboData && quote.selectedComboData.name) {
    const dur = quote.selectedComboData.durationHours || quote.durationHours || 1;
    attractionsLines.push(
      `• *Combo:* ${quote.selectedComboData.name} (${dur}h de show) — ${formatCurrencyBRL(
        quote.selectedComboData.promoPrice
      )}`
    );
  }

  if (Array.isArray(quote.selectedServicesData) && quote.selectedServicesData.length > 0) {
    for (const s of quote.selectedServicesData) {
      const charInfo =
        s.selectedCharacters && s.selectedCharacters.length > 0
          ? ` (${s.selectedCharacters.join(', ')})`
          : '';
      const durInfo = s.priceType === 'hourly' ? ` (${s.durationHours}h)` : '';
      attractionsLines.push(`• ${s.name}${charInfo}${durInfo} — ${formatCurrencyBRL(s.itemTotal)}`);
    }
  }

  if (attractionsLines.length === 0) {
    attractionsLines.push('• Atrações a confirmar com a equipe');
  }

  const lines = [
    `Olá, equipe *Robô LED Partner*! 🤖✨`,
    `Fiz uma cotação pelo site e gostaria de confirmar a disponibilidade e meu orçamento:`,
    ``,
    `📋 *RESUMO DA PROPOSTA (#${quote.code})*`,
    `• *Cliente:* ${quote.clientName}`,
    `• *Tipo de Evento:* ${quote.eventType}`,
    `• *Data & Horário:* ${dateFormatted} ${timeFormatted}`.trim(),
    quote.guestCount ? `• *Estimativa de Convidados:* ${quote.guestCount}` : null,
    `• *Local:* ${quote.addressFull}`,
    ``,
    `⚡ *ATRAÇÕES SELECIONADAS:*`,
    ...attractionsLines,
    ``,
    `💵 *Subtotal Atrações:* ${formatCurrencyBRL(quote.servicesSubtotal)}`,
    `🚚 *Deslocamento & Frete:* ${formatCurrencyBRL(quote.finalShipping)} (${quote.distanceTotalKm} km ida e volta)`,
    `🔥 *VALOR TOTAL ESTIMADO: ${formatCurrencyBRL(quote.totalAmount)}*`,
    ``,
    `Vocês têm disponibilidade nessa data? Gostaria de tirar algumas dúvidas e fechar! 🎉`,
  ].filter((item) => item !== null) as string[];

  return lines.join('\n');
}

/**
 * Generate complete WhatsApp Web / Mobile redirect URL.
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const targetPhone = cleanPhone || '5511919973647';
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send/?phone=${targetPhone}&text=${encodedText}&type=phone_number&app_absent=0`;
}
