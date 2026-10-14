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
    <div className="w-full max-w-3xl mx-auto mb-6 sm:mb-8 px-1 sm:px-4">
      {/* Mobile top step badge */}
      <div className="flex sm:hidden items-center justify-between mb-3 bg-white/[0.03] px-3.5 py-2 rounded-xl border border-white/5">
        <span className="text-[11px] text-slate-400 font-medium">
          Etapa <strong className="text-fuchsia-400 font-bold">{currentStep}</strong> de 5
        </span>
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
          {steps[currentStep - 1]?.label || 'Proposta'}
        </span>
      </div>

      {/* Step Tracker with responsive sizes */}
      <div className="relative flex items-center justify-between">
        {/* Background track line */}
        <div className="absolute left-4 sm:left-6 right-4 sm:right-6 top-4 sm:top-5.5 -translate-y-1/2 h-0.5 sm:h-1 bg-white/10 rounded-full z-0" />
        
        {/* Active progress bar fill */}
        <div
          className="absolute left-4 sm:left-6 top-4 sm:top-5.5 -translate-y-1/2 h-0.5 sm:h-1 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-cyan-400 rounded-full transition-all duration-500 z-0"
          style={{
            width: `calc(${((currentStep - 1) / (steps.length - 1)) * 100}% - ${currentStep === 1 ? '0px' : '0px'})`,
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
                className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-xs sm:text-sm border-2 ${
                  isActive
                    ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-[0_0_15px_rgba(246,53,244,0.6)] scale-105 sm:scale-110'
                    : isCompleted
                    ? 'bg-slate-900 text-fuchsia-400 border-fuchsia-500 hover:border-fuchsia-300'
                    : 'bg-[#10121b] text-slate-500 border-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <span
                className={`mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'text-fuchsia-400 font-bold'
                    : isCompleted
                    ? 'text-slate-300 group-hover:text-white'
                    : 'text-slate-500'
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
