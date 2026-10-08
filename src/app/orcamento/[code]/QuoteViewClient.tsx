'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Truck,
  MessageCircle,
  Copy,
  Printer,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Info,
} from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { formatCurrencyBRL } from '@/lib/calculator';

interface QuoteViewClientProps {
  code: string;
}

export default function QuoteViewClient({ code }: QuoteViewClientProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      if (!code) return;
      try {
        const res = await fetch(`/api/public/quotes/${code}`);
        const json = await res.json();
        if (res.ok && json.quote) {
          setData(json);
        } else {
          setError(json.error || 'Orçamento não encontrado.');
        }
      } catch (err) {
        console.error(err);
        setError('Erro de conexão ao carregar o orçamento.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [code]);

  const handleCopy = () => {
    if (!data?.quote) return;
    const q = data.quote;
    const lines = [
      `*ROBÔ LED PARTNER — PROPOSTA DE ORÇAMENTO*`,
      `Ref: #${q.code}`,
      `Cliente: ${q.clientName}`,
      `Evento: ${q.eventType} (${q.eventDate} ${q.eventTime ? `às ${q.eventTime}` : ''})`,
      `Local: ${q.addressFull}`,
      `Subtotal Atrações: ${formatCurrencyBRL(q.servicesSubtotal)}`,
      `Frete Total: ${formatCurrencyBRL(q.finalShipping)}`,
      `*TOTAL ESTIMADO: ${formatCurrencyBRL(q.totalAmount)}*`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a10] flex flex-col items-center justify-center space-y-4 text-white">
        <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Carregando Proposta Comercial...</span>
      </div>
    );
  }

  if (error || !data?.quote) {
    return (
      <div className="min-h-screen bg-[#090a10] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Orçamento não localizado</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">{error || 'Verifique o link informado e tente novamente.'}</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
        >
          Fazer Nova Cotação
        </Link>
      </div>
    );
  }

  const { quote, whatsappUrl, instagramUrl, linktreeUrl } = data;
  const combo = quote.selectedComboData;
  const services = quote.selectedServicesData || [];

  return (
    <div className="min-h-screen bg-[#090a10] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-[#090a10]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs text-slate-300 hover:text-white font-semibold">
            <ChevronLeft className="w-4 h-4 text-fuchsia-400" />
            <span>Voltar ao Início</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/5 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Quote Card */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 pb-24">
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-b from-[#10121d] via-[#121422] to-[#0d0e17] space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
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
                  Proposta de Orçamento Comercial
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Código da Proposta</span>
              <span className="font-mono text-sm font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2.5 py-1 rounded-lg border border-fuchsia-500/20">
                #{quote.code}
              </span>
            </div>
          </div>

          {/* Event info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-400 block font-medium">Contratante:</span>
              <span className="font-bold text-white text-sm block">{quote.clientName}</span>
              <span className="text-slate-300">{quote.clientWhatsapp}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-400 block font-medium">Tipo & Data do Evento:</span>
              <span className="font-bold text-white text-sm block">{quote.eventType}</span>
              <span className="text-slate-300">
                {quote.eventDate} {quote.eventTime ? `às ${quote.eventTime}` : ''}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-400 block font-medium">Local do Evento:</span>
              <span className="font-bold text-white text-sm block truncate">
                {quote.addressCity} - {quote.addressState}
              </span>
              <span className="text-slate-300 line-clamp-1">{quote.addressFull}</span>
            </div>
          </div>

          {/* Attractions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              Atrações Contratadas
            </h3>

            <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 divide-y divide-white/5">
              {combo && (
                <div className="p-4 flex justify-between items-center bg-fuchsia-950/20">
                  <div>
                    <span className="font-bold text-white text-sm block">{combo.name}</span>
                    <span className="text-xs text-slate-400">{combo.durationHours}h de apresentação</span>
                  </div>
                  <span className="font-extrabold text-white text-sm">{formatCurrencyBRL(combo.promoPrice)}</span>
                </div>
              )}

              {services.map((svc: any, idx: number) => (
                <div key={idx} className="p-4 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white text-sm block">{svc.name}</span>
                    <span className="text-xs text-slate-400">
                      {svc.priceType === 'hourly' ? `${svc.durationHours}h show` : 'Taxa fixa'}
                    </span>
                  </div>
                  <span className="font-extrabold text-white text-sm">{formatCurrencyBRL(svc.itemTotal)}</span>
                </div>
              ))}

              <div className="p-4 flex justify-between items-center bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-300">Subtotal Atrações:</span>
                <span className="text-sm font-bold text-white">{formatCurrencyBRL(quote.servicesSubtotal)}</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-cyan-400" />
              Deslocamento & Frete
            </h3>
            <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-white block">Deslocamento Ida e Volta ({quote.distanceTotalKm} km)</span>
                <span className="text-slate-400">Combustível + Margem operacional + Pedágios</span>
              </div>
              <span className="text-sm font-bold text-cyan-300">{formatCurrencyBRL(quote.finalShipping)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-[#121422] border border-fuchsia-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Estimado</span>
              <span className="text-3xl font-black text-white">{formatCurrencyBRL(quote.totalAmount)}</span>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#20ba59] hover:to-[#0f776a] text-white font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Confirmar pelo WhatsApp</span>
            </a>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Os valores apresentados são uma estimativa automática. A contratação está sujeita à disponibilidade da data, confirmação das informações do evento e validação final pela equipe Robô LED Partner.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
