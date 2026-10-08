'use client';

import React from 'react';
import { ArrowRight, Sparkles, Truck } from 'lucide-react';
import { QuoteCalculationResult } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/calculator';

interface LivePriceFloatingBarProps {
  currentStep: number;
  quoteCalc: QuoteCalculationResult;
  onNext: () => void;
  canAdvance: boolean;
  nextButtonText?: string;
}

export function LivePriceFloatingBar({
  currentStep,
  quoteCalc,
  onNext,
  canAdvance,
  nextButtonText,
}: LivePriceFloatingBarProps) {
  // Only display in steps 1 through 4
  if (currentStep < 1 || currentStep > 4) return null;

  const total = quoteCalc.totalAmount || 0;
  const subtotal = quoteCalc.servicesSubtotal || 0;
  const shipping = quoteCalc.shipping?.finalShipping || 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] glass-panel border-t border-white/10 bg-[#090a10]/95 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Estimated Price summary */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold block">
              Orçamento Estimado
            </span>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl font-black text-white">
                {total > 0 ? formatCurrencyBRL(total) : 'R$ 0,00'}
              </span>
              {shipping > 0 && (
                <span className="hidden sm:inline-block text-[11px] text-cyan-300 font-medium">
                  (inclui frete de {formatCurrencyBRL(shipping)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step Advance CTA */}
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="px-4 sm:px-7 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-lg shadow-fuchsia-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 shrink-0 active:scale-95"
        >
          <span>{nextButtonText || 'Próxima Etapa'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
