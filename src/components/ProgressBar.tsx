'use client';

import React from 'react';
import { Calendar, MapPin, Sparkles, Clock, FileCheck } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({ currentStep, onStepClick }: ProgressBarProps) {
  const steps = [
    { number: 1, label: 'Evento', icon: Calendar },
    { number: 2, label: 'Local', icon: MapPin },
    { number: 3, label: 'Atrações', icon: Sparkles },
    { number: 4, label: 'Duração', icon: Clock },
    { number: 5, label: 'Resumo', icon: FileCheck },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 px-2 sm:px-4">
      {/* Mobile progress indicator */}
      <div className="flex sm:hidden items-center justify-between mb-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
        <span className="text-xs text-slate-400 font-medium">
          Etapa <strong className="text-fuchsia-400 font-semibold">{currentStep}</strong> de 5
        </span>
        <span className="text-xs font-semibold text-white">
          {steps[currentStep - 1]?.label || 'Proposta'}
        </span>
      </div>

      {/* Desktop & Tablet step tracker */}
      <div className="relative flex items-center justify-between">
        {/* Background track line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0" />
        {/* Active progress bar fill */}
        <div
          className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-cyan-400 rounded-full transition-all duration-500 z-0"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isClickable = onStepClick && currentStep > step.number;

          return (
            <button
              key={step.number}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.number)}
              className={`relative z-10 flex flex-col items-center group transition-all focus:outline-none ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-xs sm:text-sm border-2 ${
                  isActive
                    ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-[0_0_20px_rgba(246,53,244,0.6)] scale-110'
                    : isCompleted
                    ? 'bg-slate-900 text-fuchsia-400 border-fuchsia-500 hover:border-fuchsia-300'
                    : 'bg-[#10121b] text-slate-400 border-white/10'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`mt-2 text-[11px] sm:text-xs font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'text-fuchsia-400 font-semibold'
                    : isCompleted
                    ? 'text-slate-300 group-hover:text-white'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
