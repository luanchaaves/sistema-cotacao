'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  MessageCircle,
  Globe,
  Sparkles,
  RefreshCw,
  Share2,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { formatCurrencyBRL } from '@/lib/calculator';

interface StepSuccessProps {
  quote: any;
  whatsappUrl: string;
  instagramUrl: string;
  linktreeUrl: string;
  onReset: () => void;
}

export function StepSuccess({
  quote,
  whatsappUrl,
  instagramUrl,
  linktreeUrl,
  onReset,
}: StepSuccessProps) {
  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f635f4', '#00d2ff', '#f59e0b', '#25d366'],
      });
    } catch {
      // Ignored if canvas not ready
    }
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto text-center">
      {/* Success Badge */}
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(37,211,102,0.3)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          Orçamento #{quote.code} Registrado
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Gostou do <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-fuchsia-400">Orçamento?</span>
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Sua cotação foi gerada com sucesso! Agora é só falar com nossa equipe pelo WhatsApp para garantir a data do seu evento.
        </p>
      </div>

      {/* Quote snapshot card */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 text-left space-y-4 bg-[#121422]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Evento de {quote.clientName}</span>
            <span className="text-sm font-bold text-white">{quote.eventType}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Estimado</span>
            <span className="text-xl font-black text-fuchsia-400">
              {formatCurrencyBRL(quote.totalAmount)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{quote.eventDate} {quote.eventTime ? `às ${quote.eventTime}` : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="truncate">{quote.addressCity} - {quote.addressState}</span>
          </div>
        </div>
      </div>

      {/* Conversion CTAs */}
      <div className="space-y-4 pt-2">
        {/* Main WhatsApp CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#20ba59] hover:to-[#0f776a] text-white font-extrabold text-base tracking-wide shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all flex items-center justify-center gap-3 group animate-subtle-glow"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span>Quero Reservar Minha Data no WhatsApp</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Secondary Links: Instagram & Linktree */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <InstagramIcon className="w-4 h-4 text-pink-400" />
            <span>Conhecer Nosso Trabalho no Instagram</span>
          </a>

          <a
            href={linktreeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Todos os Nossos Links (Linktree)</span>
          </a>
        </div>
      </div>

      {/* Restart */}
      <div className="pt-6">
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Fazer uma nova cotação</span>
        </button>
      </div>
    </div>
  );
}
