'use client';

import React, { useState } from 'react';
import { User, Phone, Calendar, Clock, Users, Sparkles, Heart, Gift, Crown, Briefcase, GraduationCap, PartyPopper } from 'lucide-react';
import { QuoteFormData } from '@/lib/types';

interface StepEventProps {
  formData: QuoteFormData;
  updateFormData: (fields: Partial<QuoteFormData>) => void;
  onNext: () => void;
}

export function StepEvent({ formData, updateFormData, onNext }: StepEventProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eventTypes = [
    { label: 'Casamento', icon: Heart, description: 'Entrada dos noivos & Pista' },
    { label: '15 anos', icon: Crown, description: 'Valsa & Balada Debutante' },
    { label: 'Aniversário', icon: Gift, description: 'Balada & Comemoração' },
    { label: 'Festa infantil', icon: PartyPopper, description: 'Animação e Personagens' },
    { label: 'Evento corporativo', icon: Briefcase, description: 'Confraternização & Marcas' },
    { label: 'Formatura', icon: GraduationCap, description: 'Baile & Pista de Dança' },
    { label: 'Festa de empresa', icon: Briefcase, description: 'Fim de ano e celebrações' },
    { label: 'Outro', icon: Sparkles, description: 'Personalizado' },
  ];

  // Format Brazilian phone mask (11) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    let formatted = val;
    if (val.length > 2) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    if (val.length > 7) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    }

    updateFormData({ clientWhatsapp: formatted });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.clientName.trim()) {
      errs.clientName = 'Por favor, informe seu nome completo ou da empresa.';
    }
    const cleanPhone = formData.clientWhatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errs.clientWhatsapp = 'Informe um WhatsApp válido com DDD (mínimo 10 dígitos).';
    }
    if (!formData.eventType) {
      errs.eventType = 'Selecione o tipo de evento.';
    }
    if (!formData.eventDate) {
      errs.eventDate = 'Informe a data prevista do evento.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleContinue} className="space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Etapa 1 de 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Conte sobre o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-500">Evento</span>
        </h2>
        <p className="text-sm text-slate-400">
          Preencha seus dados para montarmos uma cotação sob medida e reservarmos a disponibilidade.
        </p>
      </div>

      {/* Main Form Fields */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-fuchsia-400" />
              Seu Nome ou Nome do Contratante *
            </label>
            <input
              type="text"
              placeholder="Ex: João Silva ou Empresa XYZ"
              value={formData.clientName}
              onChange={(e) => updateFormData({ clientName: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium ${
                errors.clientName ? 'border-red-500 ring-1 ring-red-500' : ''
              }`}
            />
            {errors.clientName && (
              <p className="text-xs text-red-400 mt-1">{errors.clientName}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              WhatsApp para Contato *
            </label>
            <input
              type="text"
              placeholder="(11) 99999-9999"
              value={formData.clientWhatsapp}
              onChange={handlePhoneChange}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium ${
                errors.clientWhatsapp ? 'border-red-500 ring-1 ring-red-500' : ''
              }`}
            />
            {errors.clientWhatsapp && (
              <p className="text-xs text-red-400 mt-1">{errors.clientWhatsapp}</p>
            )}
          </div>
        </div>

        {/* Event Type Grid Selection */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            Tipo de Evento *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {eventTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = formData.eventType === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => updateFormData({ eventType: item.label })}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-fuchsia-500/15 border-fuchsia-500 ring-1 ring-fuchsia-500/50 shadow-[0_0_15px_rgba(246,53,244,0.2)]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${
                      isSelected
                        ? 'bg-fuchsia-500 text-white'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs sm:text-sm text-white">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.eventType && (
            <p className="text-xs text-red-400 mt-1">{errors.eventType}</p>
          )}
        </div>

        {/* Date, Time & Guests Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          {/* Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Data do Evento *
            </label>
            <input
              type="date"
              value={formData.eventDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => updateFormData({ eventDate: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium ${
                errors.eventDate ? 'border-red-500 ring-1 ring-red-500' : ''
              }`}
            />
            {errors.eventDate && (
              <p className="text-xs text-red-400 mt-1">{errors.eventDate}</p>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Horário Previsto
            </label>
            <input
              type="time"
              value={formData.eventTime}
              onChange={(e) => updateFormData({ eventTime: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium"
            />
          </div>

          {/* Guests */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Qtd. Estimada de Convidados
            </label>
            <select
              value={formData.guestCount || ''}
              onChange={(e) => updateFormData({ guestCount: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium"
            >
              <option value="">Selecione (opcional)</option>
              <option value="Até 50 pessoas">Até 50 convidados</option>
              <option value="50 a 100 pessoas">50 a 100 convidados</option>
              <option value="100 a 200 pessoas">100 a 200 convidados</option>
              <option value="200 a 300 pessoas">200 a 300 convidados</option>
              <option value="Mais de 300 pessoas">Mais de 300 convidados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-600/50 transition-all flex items-center justify-center gap-2"
        >
          <span>Avançar para Localização</span>
          <span className="text-lg">→</span>
        </button>
      </div>
    </form>
  );
}
