'use client';

import React, { useState } from 'react';
import { Clock, MessageSquare, Info, Sparkles, Check } from 'lucide-react';
import { QuoteFormData } from '@/lib/types';

interface StepDurationProps {
  formData: QuoteFormData;
  updateFormData: (fields: Partial<QuoteFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepDuration({ formData, updateFormData, onNext, onBack }: StepDurationProps) {
  const [customHours, setCustomHours] = useState('');
  const [isCustom, setIsCustom] = useState(
    ![0.5, 1, 1.5, 2, 2.5, 3, 4].includes(formData.durationHours || 1)
  );

  const durationOptions = [
    { label: '30 minutos', value: 0.5, popular: false },
    { label: '1 hora', value: 1.0, popular: true },
    { label: '1h30 min', value: 1.5, popular: false },
    { label: '2 horas', value: 2.0, popular: false },
    { label: '2h30 min', value: 2.5, popular: false },
    { label: '3 horas', value: 3.0, popular: false },
    { label: '4 horas', value: 4.0, popular: false },
  ];

  const handleSelectDuration = (val: number) => {
    setIsCustom(false);
    updateFormData({ durationHours: val });
  };

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCustomHours(e.target.value);
    if (!isNaN(val) && val > 0) {
      updateFormData({ durationHours: val });
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.durationHours || formData.durationHours <= 0) {
      updateFormData({ durationHours: 1.0 });
    }
    onNext();
  };

  return (
    <form onSubmit={handleContinue} className="space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          Etapa 4 de 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Qual a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400">Duração</span> desejada?
        </h2>
        <p className="text-sm text-slate-400">
          Selecione o tempo de apresentação para as atrações com cobrança por hora (Robô de LED e Personagens).
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Duration Options Grid */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Tempo de Apresentação das Atrações
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {durationOptions.map((opt) => {
              const isSelected = !isCustom && formData.durationHours === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectDuration(opt.value)}
                  className={`relative p-4 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  {opt.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-[10px] font-bold text-white shadow">
                      Mais Escolhido
                    </span>
                  )}
                  <span className="font-extrabold text-sm sm:text-base text-white block">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {opt.value === 1 ? 'Show padrão' : `${opt.value} horas`}
                  </span>
                </button>
              );
            })}

            {/* Custom option button */}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`p-4 rounded-xl border text-center transition-all ${
                isCustom
                  ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <span className="font-extrabold text-sm sm:text-base text-white block">
                Outra Duração
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Personalizada
              </span>
            </button>
          </div>

          {/* Custom duration input box */}
          {isCustom && (
            <div className="mt-3 p-4 rounded-xl bg-black/40 border border-purple-500/30 flex items-center gap-3">
              <span className="text-xs text-slate-300 font-medium">
                Informe o número exato de horas:
              </span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                placeholder="Ex: 5"
                value={customHours || formData.durationHours || ''}
                onChange={handleCustomDurationChange}
                className="w-24 px-3 py-1.5 rounded-lg text-sm text-center font-bold"
              />
              <span className="text-xs text-purple-300">horas</span>
            </div>
          )}
        </div>

        {/* Informative Note */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">Dica comercial:</strong> Atrações fixas como <strong>Cilindro de CO2</strong> e <strong>Gerb Indoor</strong> mantêm seu valor contratual fixo independente da duração de pista.
          </p>
        </div>

        {/* Special requests / notes */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            Observações ou Pedidos Especiais (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Ex: Gostaria de alinhar a entrada do Robô de LED durante a valsa ou abertura da pista de dança às 23h..."
            value={formData.notes || ''}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-all"
        >
          ← Voltar
        </button>

        <button
          type="submit"
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-600/50 transition-all flex items-center gap-2"
        >
          <span>Visualizar Orçamento Completo</span>
          <span className="text-lg">→</span>
        </button>
      </div>
    </form>
  );
}
