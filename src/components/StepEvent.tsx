'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User,
  Phone,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Heart,
  Gift,
  Crown,
  Briefcase,
  GraduationCap,
  PartyPopper,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Zap,
  Flame,
  Wine,
  Layers,
  Bot,
  ArrowRight,
} from 'lucide-react';
import { QuoteFormData, ServiceItem, ComboItem, CharacterItem } from '@/lib/types';

interface StepEventProps {
  formData: QuoteFormData;
  updateFormData: (fields: Partial<QuoteFormData>) => void;
  services?: ServiceItem[];
  combos?: ComboItem[];
  characters?: CharacterItem[];
  onNext: () => void;
}

export function StepEvent({
  formData,
  updateFormData,
  services = [],
  combos = [],
  characters = [],
  onNext,
}: StepEventProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState<{
    checked: boolean;
    available: boolean;
    isFullDayUnavailable?: boolean;
    isTimeUnavailable?: boolean;
    reason?: string;
    bookedTimes?: string[];
  }>({ checked: false, available: true });

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

  // Vitrine de atrações em destaque para o cliente visualizar logo no início
  const attractionsShowcase = [
    {
      id: 'robo-led',
      title: 'Robôs de LED Gigantes',
      badge: 'Atração Principal',
      badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
      image: '/images/Robo1.jpg',
      icon: Bot,
      tags: ['Canhão CO2', 'Fogo Sparkular', 'Laser Show'],
      description: 'Gigante futurista de 2.80m com armadura de LED multicolorida, jatos de fumaça gelada e efeitos na pista.',
    },
    {
      id: 'tequileiro',
      title: 'Robô Tequileiro',
      badge: 'Mais Pedido na Balada',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      image: '/images/tequileiro.png',
      icon: Wine,
      tags: ['Rodadas de Shots', 'Animação Total', 'Pista Fervendo'],
      description: 'A sensação para casamentos e 15 anos. O robô interage com convidados servindo shots eletrizantes na pista.',
    },
    {
      id: 'personagens',
      title: 'Personagens Vivos & Heróis',
      badge: 'Infantil & Família',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      image: '/images/h-aranha.png',
      icon: Zap,
      tags: ['Homem-Aranha', 'Sonic', 'Mickey Gala', 'Marshmello'],
      description: 'Personagens temáticos com fantasias de alta qualidade para fotos memoráveis, recepção e momentos especiais.',
    },
    {
      id: 'efeitos',
      title: 'Efeitos Especiais de Palco',
      badge: 'Cenografia Premium',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      image: '/images/2.png',
      icon: Flame,
      tags: ['CO2 Criogênico', 'Fogo Frio Sparkular', 'Bastões LED'],
      description: 'Centelhas pirotécnicas frias 100% seguras para salões fechados sem queimar e canhões de CO2 de alta pressão.',
    },
    {
      id: 'combos',
      title: 'Combos Promocionais',
      badge: 'Melhor Custo-Benefício',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      image: '/images/BK.png',
      icon: Layers,
      tags: ['Robô + Efeitos', 'Robô + Tequileiro', 'Descontos Especiais'],
      description: 'Pacotes completos combinando múltiplas atrações com desconto exclusivo aplicado automaticamente.',
    },
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

  // Live availability check on date/time change
  useEffect(() => {
    if (!formData.eventDate) {
      setAvailability({ checked: false, available: true });
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingAvailability(true);
      try {
        const query = new URLSearchParams({
          date: formData.eventDate,
          time: formData.eventTime || '',
        });
        const res = await fetch(`/api/public/calendar/availability?${query.toString()}`);
        const data = await res.json();
        setAvailability({
          checked: true,
          available: Boolean(data.available),
          isFullDayUnavailable: Boolean(data.isFullDayUnavailable),
          isTimeUnavailable: Boolean(data.isTimeUnavailable),
          reason: data.reason,
          bookedTimes: data.bookedTimes || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingAvailability(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.eventDate, formData.eventTime]);

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

    if (availability.checked && !availability.available && availability.isFullDayUnavailable) {
      errs.eventDate = 'Esta data está indisponível na nossa agenda. Escolha outra data.';
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
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Etapa 1 de 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Conte sobre o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-500">Evento</span>
        </h2>
        <p className="text-sm text-slate-400">
          Preencha os dados do seu evento para verificarmos a agenda e calcularmos o frete sob medida.
        </p>
      </div>

      {/* ===================================================================
          VITRINE DE ATRAÇÕES DISPONÍVEIS (NOVA SEÇÃO DE DESTAQUE)
          =================================================================== */}
      <div className="glass-panel rounded-2xl p-5 sm:p-7 space-y-4 border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/[0.04] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Atrações Disponíveis para o seu Evento
              </h3>
              <p className="text-xs text-slate-400">
                Você poderá escolher e personalizar todas elas na <strong>Etapa 3</strong>:
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-fuchsia-300 bg-fuchsia-500/10 px-2.5 py-1 rounded-full self-start sm:self-center border border-fuchsia-500/20">
            Catálogo 100% Atualizado
          </span>
        </div>

        {/* Grid de Atrações em Destaque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {attractionsShowcase.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group relative rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-fuchsia-500/40 p-3.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-fuchsia-400 group-hover:bg-fuchsia-500/20 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-fuchsia-300 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300/90 leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
          <span>
            Ao preencher o formulário abaixo, você seguirá para a <strong>Localização</strong> e em seguida poderá <strong>selecionar suas atrações e combos</strong> com cálculo de valor em tempo real.
          </span>
        </div>
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Data do Evento *
              </label>
              {checkingAvailability && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-fuchsia-400" />
                  Verificando agenda...
                </span>
              )}
            </div>
            <input
              type="date"
              value={formData.eventDate}
              onChange={(e) => updateFormData({ eventDate: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium ${
                errors.eventDate ? 'border-red-500 ring-1 ring-red-500' : ''
              }`}
            />
            {errors.eventDate && (
              <p className="text-xs text-red-400 mt-1">{errors.eventDate}</p>
            )}

            {/* Live Availability Status */}
            {availability.checked && formData.eventDate && !checkingAvailability && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                  availability.available
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                }`}
              >
                {availability.available ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Data com Vagas Disponíveis!</span>
                      <span className="text-[11px] text-emerald-400/80">
                        Podemos atender seu evento nesta data. Preencha o restante para simular.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Atenção sobre esta data:</span>
                      <span className="text-[11px] text-amber-300/80">
                        {availability.reason ||
                          'Já temos eventos confirmados. Consulte horários específicos ou fale com nosso suporte.'}
                      </span>
                    </div>
                  </>
                )}
              </div>
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
            <p className="text-[11px] text-slate-400">
              Horário de início da atração na festa.
            </p>
          </div>

          {/* Guests Count */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Qtd. Estimada de Convidados
            </label>
            <select
              value={formData.guestCount}
              onChange={(e) => updateFormData({ guestCount: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-[#111220]"
            >
              <option value="">Selecione (opcional)</option>
              <option value="Até 50 pessoas">Até 50 convidados</option>
              <option value="50 a 100 pessoas">50 a 100 convidados</option>
              <option value="100 a 200 pessoas">100 a 200 convidados</option>
              <option value="200 a 400 pessoas">200 a 400 convidados</option>
              <option value="Mais de 400 pessoas">Mais de 400 convidados</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Ajuda a dimensionar o show ideal.
            </p>
          </div>
        </div>

        {/* Submit / Next Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white shadow-lg shadow-fuchsia-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Avançar para Localização</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
