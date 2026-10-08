'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FileText,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Printer,
  MessageCircle,
  Loader2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  CompanySetting,
  QuoteFormData,
  QuoteCalculationResult,
  ServiceItem,
  ComboItem,
  CharacterItem,
} from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/calculator';

interface StepSummaryProps {
  formData: QuoteFormData;
  quoteCalc: QuoteCalculationResult;
  setting: CompanySetting;
  services: ServiceItem[];
  combos: ComboItem[];
  characters: CharacterItem[];
  onSubmitQuote: () => Promise<void>;
  isSubmitting: boolean;
  onBack: () => void;
}

export function StepSummary({
  formData,
  quoteCalc,
  setting,
  services,
  combos,
  characters,
  onSubmitQuote,
  isSubmitting,
  onBack,
}: StepSummaryProps) {
  const [copied, setCopied] = useState(false);

  const selectedCombo = quoteCalc.selectedCombo;
  const selectedServices = quoteCalc.selectedServices;
  const shipping = quoteCalc.shipping;

  const handleCopySummary = () => {
    const lines = [
      `*ROBÔ LED PARTNER — PROPOSTA DE ORÇAMENTO*`,
      `Cliente: ${formData.clientName}`,
      `WhatsApp: ${formData.clientWhatsapp}`,
      `Evento: ${formData.eventType} (${formData.eventDate} ${formData.eventTime ? `às ${formData.eventTime}` : ''})`,
      `Local: ${formData.addressFull}`,
      ``,
      `*ATRAÇÕES:*`,
      selectedCombo
        ? `• ${selectedCombo.name} (${selectedCombo.durationHours}h) — ${formatCurrencyBRL(selectedCombo.promoPrice)}`
        : null,
      ...selectedServices.map(
        (s) =>
          `• ${s.name} ${s.priceType === 'hourly' ? `(${s.durationHours}h)` : ''} — ${formatCurrencyBRL(s.itemTotal)}`
      ),
      `Subtotal Atrações: ${formatCurrencyBRL(quoteCalc.servicesSubtotal)}`,
      ``,
      `*DESLOCAMENTO & LOGÍSTICA:*`,
      `• Distância: ${shipping.distanceOneWayKm} km (Ida e volta: ${shipping.distanceTotalKm} km)`,
      `• Frete Total: ${formatCurrencyBRL(shipping.finalShipping)}`,
      ``,
      `*TOTAL ESTIMADO: ${formatCurrencyBRL(quoteCalc.totalAmount)}*`,
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-2 no-print">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          Etapa 5 de 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Resumo da sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Proposta</span>
        </h2>
        <p className="text-sm text-slate-400">
          Revise todos os itens do seu orçamento antes de confirmar e falar com nossa equipe comercial.
        </p>
      </div>

      {/* Main Commercial Sheet */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-b from-[#10121d] via-[#121422] to-[#0d0e17]">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Commercial Proposal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-950/80 to-black p-1 border border-fuchsia-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(246,53,244,0.3)]">
              <Image
                src="/images/logo-official.png"
                alt="Robô LED Partner"
                width={52}
                height={52}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg text-white tracking-wider flex items-center gap-2">
                ROBÔ LED <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">PARTNER</span>
              </span>
              <span className="text-xs text-slate-400 block font-medium">
                Proposta Comercial de Atrações para Eventos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Section 1: Event Information Grid */}
        <div className="py-6 border-b border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-slate-400 block font-medium">Contratante:</span>
            <span className="font-bold text-white text-sm block">{formData.clientName}</span>
            <span className="text-slate-300">{formData.clientWhatsapp}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-slate-400 block font-medium">Tipo & Data do Evento:</span>
            <span className="font-bold text-white text-sm block">{formData.eventType}</span>
            <span className="text-slate-300">
              {formData.eventDate} {formData.eventTime ? `às ${formData.eventTime}` : ''}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-slate-400 block font-medium">Local do Evento:</span>
            <span className="font-bold text-white text-sm block truncate" title={formData.addressFull}>
              {formData.addressCity} - {formData.addressState}
            </span>
            <span className="text-slate-300 line-clamp-1">{formData.addressFull}</span>
          </div>
        </div>

        {/* Section 2: Contracted Attractions */}
        <div className="py-6 border-b border-white/10 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            Atrações & Efeitos Selecionados
          </h3>

          <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 divide-y divide-white/5">
            {/* If Combo is chosen */}
            {selectedCombo && (
              <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-fuchsia-950/20">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                      Combo Especial
                    </span>
                    <span className="font-bold text-white text-sm">{selectedCombo.name}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Duração: {selectedCombo.durationHours}h de apresentação
                    {quoteCalc.selectedCharacters.length > 0
                      ? ` • Personagens: ${quoteCalc.selectedCharacters.join(', ')}`
                      : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    {formatCurrencyBRL(selectedCombo.promoPrice)}
                  </span>
                </div>
              </div>
            )}

            {/* Individual services */}
            {selectedServices.map((svc) => (
              <div
                key={svc.serviceId}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-white text-sm block">{svc.name}</span>
                  <p className="text-xs text-slate-400">
                    {svc.priceType === 'hourly'
                      ? `Cobrança por hora (${svc.durationHours}h contratadas)`
                      : 'Efeito Especial com taxa fixa'}
                    {svc.selectedCharacters && svc.selectedCharacters.length > 0
                      ? ` • [${svc.selectedCharacters.join(', ')}]`
                      : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    {formatCurrencyBRL(svc.itemTotal)}
                  </span>
                </div>
              </div>
            ))}

            {/* Subtotal row */}
            <div className="p-4 flex items-center justify-between bg-white/[0.02]">
              <span className="text-xs font-semibold text-slate-300">Subtotal Atrações:</span>
              <span className="text-sm font-bold text-white">
                {formatCurrencyBRL(quoteCalc.servicesSubtotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Logistics & Displacement */}
        <div className="py-6 border-b border-white/10 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-cyan-400" />
            Deslocamento & Logística
          </h3>

          <div className="rounded-2xl p-4 bg-black/20 border border-white/5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">
                Distância calculada a partir de <strong>{setting.originCity} - {setting.originState}</strong>:
              </span>
              <span className="font-semibold text-cyan-300">
                {shipping.distanceOneWayKm} km ida ({shipping.distanceTotalKm} km ida e volta)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs text-slate-400">
              <div className="flex justify-between sm:block">
                <span>Combustível:</span>
                <span className="font-semibold text-slate-200 block sm:mt-0.5">
                  {formatCurrencyBRL(shipping.fuelCost)}
                </span>
              </div>
              <div className="flex justify-between sm:block">
                <span>Margem Operacional:</span>
                <span className="font-semibold text-slate-200 block sm:mt-0.5">
                  {formatCurrencyBRL(shipping.marginCost)}
                </span>
              </div>
              <div className="flex justify-between sm:block">
                <span>Pedágios:</span>
                <span className="font-semibold text-slate-200 block sm:mt-0.5">
                  {formatCurrencyBRL(shipping.tollsCost)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs font-semibold text-slate-300">Frete Total:</span>
              <span className="text-sm font-bold text-cyan-300">
                {formatCurrencyBRL(shipping.finalShipping)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Grand Total Card */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Valor Total Estimado do Orçamento:
            </span>
            <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300">
              {formatCurrencyBRL(quoteCalc.totalAmount)}
            </div>
            <span className="text-[11px] text-slate-400 block">
              Atrações ({formatCurrencyBRL(quoteCalc.servicesSubtotal)}) + Frete ({formatCurrencyBRL(shipping.finalShipping)})
            </span>
          </div>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3 no-print">
            <button
              type="button"
              onClick={onSubmitQuote}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-sm sm:text-base tracking-wide shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 group animate-subtle-glow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gerando Orçamento Oficial...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Quero Contratar / Falar no WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mandatory Disclaimer Notice */}
        <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-slate-400">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-200">Aviso Comercial:</strong> Os valores apresentados são uma estimativa automática. A contratação está sujeita à disponibilidade da data, confirmação das informações do evento e validação final pela equipe Robô LED Partner.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 no-print">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-all"
        >
          ← Voltar e Editar
        </button>
      </div>
    </div>
  );
}
