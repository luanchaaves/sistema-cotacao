'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Check,
  Plus,
  Flame,
  Users,
  Clock,
  Tag,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ComboItem, ServiceItem, CharacterItem, QuoteFormData } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/calculator';

interface StepAttractionsProps {
  formData: QuoteFormData;
  updateFormData: (fields: Partial<QuoteFormData>) => void;
  services: ServiceItem[];
  combos: ComboItem[];
  characters: CharacterItem[];
  onNext: () => void;
  onBack: () => void;
}

export function StepAttractions({
  formData,
  updateFormData,
  services,
  combos,
  characters,
  onNext,
  onBack,
}: StepAttractionsProps) {
  const [activeTab, setActiveTab] = useState<'combos' | 'individual'>(
    formData.selectedComboId ? 'combos' : 'combos'
  );
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper to toggle a combo
  const handleSelectCombo = (combo: ComboItem) => {
    if (formData.selectedComboId === combo.id) {
      // Deselect combo
      updateFormData({ selectedComboId: null });
    } else {
      updateFormData({
        selectedComboId: combo.id,
        durationHours: combo.durationHours || formData.durationHours || 1.0,
      });

      // If combo includes characters and no character is selected, open character selector
      const includesCharacters = (combo.includedItems || []).some(
        (item) =>
          item.toLowerCase().includes('personagem') ||
          item.toLowerCase().includes('personagens')
      );
      if (includesCharacters && formData.selectedCharacterIds.length === 0) {
        setShowCharacterModal(true);
      }
    }
  };

  // Helper to toggle an individual service
  const handleToggleService = (service: ServiceItem) => {
    const currentMap = { ...(formData.selectedServices || {}) };
    const currentSetting = currentMap[service.id] || {
      selected: false,
      durationHours: formData.durationHours || 1.0,
      selectedCharacters: [],
    };

    const newSelected = !currentSetting.selected;

    currentMap[service.id] = {
      ...currentSetting,
      selected: newSelected,
    };

    updateFormData({ selectedServices: currentMap });

    // If toggled on Character service, open character selection
    if (
      newSelected &&
      (service.category === 'character' || service.slug === 'personagens')
    ) {
      setShowCharacterModal(true);
    }
  };

  // Helper to toggle character selection
  const handleToggleCharacter = (char: CharacterItem) => {
    const current = [...formData.selectedCharacterIds];
    const index = current.indexOf(char.id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(char.id);
    }
    updateFormData({ selectedCharacterIds: current });
  };

  // Find active combo
  const selectedCombo = combos.find((c) => c.id === formData.selectedComboId);

  // Check if at least one service or combo is chosen
  const hasSelectedAny =
    Boolean(formData.selectedComboId) ||
    Object.values(formData.selectedServices || {}).some((s) => s.selected);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSelectedAny) {
      setErrorMsg('Por favor, selecione pelo menos um Combo ou Atração para continuar.');
      return;
    }

    // Check if character is needed
    const needsCharacter =
      (selectedCombo &&
        (selectedCombo.includedItems || []).some((item) =>
          item.toLowerCase().includes('personagem')
        )) ||
      Object.entries(formData.selectedServices || {}).some(
        ([sId, val]) => {
          if (!val.selected) return false;
          const svc = services.find((s) => s.id === sId);
          return svc?.category === 'character' || svc?.slug === 'personagens';
        }
      );

    if (needsCharacter && formData.selectedCharacterIds.length === 0) {
      setErrorMsg('Por favor, escolha qual personagem você deseja para o evento.');
      setShowCharacterModal(true);
      return;
    }

    onNext();
  };

  return (
    <form onSubmit={handleContinue} className="space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Etapa 3 de 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Escolha suas <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-400 to-cyan-400">Atrações</span>
        </h2>
        <p className="text-sm text-slate-400">
          Aproveite nossos <strong>Combos Promocionais</strong> com desconto especial ou monte sua experiência personalizada item a item.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('combos')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'combos'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Combos Promocionais</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-extrabold uppercase">
              Econômico
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'individual'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Atrações Individuais</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COMBOS */}
      {activeTab === 'combos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {combos.map((combo) => {
              const isSelected = formData.selectedComboId === combo.id;
              const savings = combo.regularPrice - combo.promoPrice;

              return (
                <div
                  key={combo.id}
                  onClick={() => handleSelectCombo(combo)}
                  className={`relative rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'glass-card-selected bg-gradient-to-b from-fuchsia-950/40 to-[#141525]'
                      : 'glass-card bg-[#121420]/80 hover:border-fuchsia-500/40'
                  }`}
                >
                  {/* Top Badge */}
                  {combo.badgeText && (
                    <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white text-[11px] font-bold tracking-wide shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{combo.badgeText}</span>
                    </div>
                  )}

                  <div className="space-y-4 pt-1">
                    {/* Image */}
                    {combo.imageUrl && (
                      <div className="relative h-40 w-full rounded-xl overflow-hidden border border-white/10 group">
                        <Image
                          src={combo.imageUrl}
                          alt={combo.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white font-medium">
                          <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {combo.durationHours} hora show
                          </span>
                          {savings > 0 && (
                            <span className="bg-emerald-500/80 backdrop-blur-md px-2 py-1 rounded-md text-[11px] font-bold text-white">
                              Economize {formatCurrencyBRL(savings)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-between">
                        <span>{combo.name}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {combo.description}
                      </p>
                    </div>

                    {/* Included items checklist */}
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Itens Inclusos no Combo:
                      </span>
                      {combo.includedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Select CTA */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      {combo.regularPrice > combo.promoPrice && (
                        <span className="text-xs text-slate-400 line-through block">
                          De {formatCurrencyBRL(combo.regularPrice)}
                        </span>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-fuchsia-400 font-bold">Por</span>
                        <span className="text-xl sm:text-2xl font-black text-white">
                          {formatCurrencyBRL(combo.promoPrice)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-fuchsia-500 text-white shadow-md'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Selecionado</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Escolher</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extra add-ons banner if combo is selected */}
          {selectedCombo && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-purple-950/30 to-cyan-950/40 border border-fuchsia-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {selectedCombo.name} selecionado!
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Deseja adicionar mais atrações ou efeitos extras ao combo? Alterne para a aba <strong>Atrações Individuais</strong>.
                </p>
              </div>

              {(selectedCombo.includedItems || []).some((i) =>
                i.toLowerCase().includes('personagem')
              ) && (
                <button
                  type="button"
                  onClick={() => setShowCharacterModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {formData.selectedCharacterIds.length > 0
                      ? `Personagem: ${characters.find((c) => formData.selectedCharacterIds.includes(c.id))?.name || 'Escolhido'}`
                      : 'Escolher Personagem do Combo'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INDIVIDUAL ATTRACTIONS */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {services.map((service) => {
              const isSelected = formData.selectedServices?.[service.id]?.selected;
              const isCharacter = service.category === 'character' || service.slug === 'personagens';

              return (
                <div
                  key={service.id}
                  onClick={() => handleToggleService(service)}
                  className={`rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'glass-card-selected bg-gradient-to-b from-fuchsia-950/40 to-[#141525]'
                      : 'glass-card bg-[#121420]/80 hover:border-fuchsia-500/40'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Image & Price Tag */}
                    <div className="relative h-44 w-full rounded-xl overflow-hidden border border-white/10 group">
                      {service.imageUrl ? (
                        <Image
                          src={service.imageUrl}
                          alt={service.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
                        <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md font-semibold">
                          {service.priceType === 'hourly' ? 'Cobrança por hora' : 'Taxa fixa'}
                        </span>
                        <span className="bg-fuchsia-600/90 backdrop-blur-md px-2.5 py-1 rounded-md font-extrabold text-white">
                          {formatCurrencyBRL(service.price)}
                          {service.priceType === 'hourly' ? '/h' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-between">
                        <span>{service.name}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    {/* If character is selected, show chosen character preview */}
                    {isCharacter && isSelected && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCharacterModal(true);
                        }}
                        className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-400" />
                          <span>
                            {formData.selectedCharacterIds.length > 0
                              ? `${formData.selectedCharacterIds.length} Personagem(ns) selecionado(s)`
                              : 'Clique para escolher os personagens'}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold underline">Alterar</span>
                      </div>
                    )}
                  </div>

                  {/* Toggle Button */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {isSelected ? 'Item adicionado à cotação' : 'Clique para adicionar'}
                    </span>

                    <button
                      type="button"
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-fuchsia-500 text-white shadow-md'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Adicionado</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Adicionar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CHARACTER SELECTION MODAL */}
      {showCharacterModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-fuchsia-400" />
                  Escolha o(s) Personagem(ns) Vivo(s)
                </h3>
                <p className="text-xs text-slate-400">
                  Selecione os personagens que irão encantar seus convidados
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCharacterModal(false)}
                className="w-8 h-8 rounded-lg bg-white/10 text-slate-300 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Character Grid */}
            <div className="p-5 overflow-y-auto max-h-[60vh] grid grid-cols-2 sm:grid-cols-4 gap-3">
              {characters.map((char) => {
                const isCharSelected = formData.selectedCharacterIds.includes(char.id);
                return (
                  <div
                    key={char.id}
                    onClick={() => handleToggleCharacter(char)}
                    className={`relative rounded-xl p-2.5 cursor-pointer border text-center transition-all ${
                      isCharSelected
                        ? 'bg-fuchsia-500/20 border-fuchsia-500 ring-2 ring-fuchsia-500/60 shadow-lg'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-800 mb-2">
                      {char.imageUrl ? (
                        <Image
                          src={char.imageUrl}
                          alt={char.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                      {isCharSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-xs text-white block truncate">
                      {char.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {char.category}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
              <span className="text-xs text-slate-300 font-medium">
                {formData.selectedCharacterIds.length} selecionado(s)
              </span>
              <button
                type="button"
                onClick={() => setShowCharacterModal(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-md"
              >
                Confirmar Seleção
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span>Avançar para Duração</span>
          <span className="text-lg">→</span>
        </button>
      </div>
    </form>
  );
}
