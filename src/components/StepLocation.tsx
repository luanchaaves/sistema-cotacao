'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Fuel,
  ShieldCheck,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { CompanySetting, QuoteFormData, ShippingBreakdown, TollItem } from '@/lib/types';
import { fetchAddressByCep } from '@/lib/distance';
import { formatCurrencyBRL } from '@/lib/calculator';

interface StepLocationProps {
  formData: QuoteFormData;
  updateFormData: (fields: Partial<QuoteFormData>) => void;
  setting: CompanySetting;
  tollsList: TollItem[];
  onNext: () => void;
  onBack: () => void;
}

export function StepLocation({
  formData,
  updateFormData,
  setting,
  tollsList,
  onNext,
  onBack,
}: StepLocationProps) {
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distanceOneWayKm: number;
    distanceTotalKm: number;
    durationMinutes: number;
    shipping: ShippingBreakdown | null;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle CEP input with auto-formatting
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);

    let formatted = val;
    if (val.length > 5) {
      formatted = `${val.slice(0, 5)}-${val.slice(5)}`;
    }

    updateFormData({ addressCep: formatted });

    if (val.length === 8) {
      await searchCep(val);
    }
  };

  const searchCep = async (cleanCep: string) => {
    setIsSearchingCep(true);
    setErrorMsg('');
    try {
      const data = await fetchAddressByCep(cleanCep);
      if (data && !data.erro) {
        const fullAddr = `${data.logradouro || ''}, ${formData.addressNumber || 'S/N'} - ${data.bairro || ''}, ${data.localidade} - ${data.uf}`;
        updateFormData({
          addressStreet: data.logradouro || '',
          addressNeighborhood: data.bairro || '',
          addressCity: data.localidade || '',
          addressState: data.uf || '',
        });

        // Auto trigger route calculation with updated city/state
        calculateRoute({
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        });
      } else {
        setErrorMsg('CEP não encontrado. Por favor, preencha o endereço manualmente.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao consultar CEP. Preencha os campos abaixo.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const calculateRoute = async (customAddress?: {
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }) => {
    const street = customAddress?.street ?? formData.addressStreet;
    const number = formData.addressNumber;
    const neighborhood = customAddress?.neighborhood ?? formData.addressNeighborhood;
    const city = customAddress?.city ?? formData.addressCity;
    const state = customAddress?.state ?? formData.addressState;

    if (!city) {
      setErrorMsg('Informe ao menos a Cidade e Estado do evento para calcular a distância.');
      return;
    }

    setIsCalculatingRoute(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/public/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cep: formData.addressCep,
          street,
          number,
          neighborhood,
          city,
          state,
          manualTollAmount: formData.manualTollAmount || 0,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const full = `${street || ''} ${number ? `nº ${number}` : ''}, ${neighborhood ? `${neighborhood}, ` : ''}${city} - ${state}`.trim();
        updateFormData({
          distanceOneWayKm: data.distanceOneWayKm,
          destinationLat: data.destination.lat,
          destinationLng: data.destination.lng,
          addressFull: full,
          addressCity: city,
          addressState: state,
        });

        setRouteInfo({
          distanceOneWayKm: data.distanceOneWayKm,
          distanceTotalKm: data.distanceTotalKm,
          durationMinutes: data.durationMinutes,
          shipping: data.shipping,
        });
      } else {
        setErrorMsg(data.error || 'Não foi possível traçar a rota para este endereço.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro de conexão ao calcular rota. Tente novamente.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // If we already had distance in formData on mount, initialize route info
  useEffect(() => {
    if (formData.distanceOneWayKm > 0 && formData.addressCity && !routeInfo) {
      calculateRoute();
    }
  }, []);

  const handleManualTollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    updateFormData({ manualTollAmount: val });
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.addressCity) {
      setErrorMsg('Por favor, informe a cidade do evento.');
      return;
    }
    if (!formData.distanceOneWayKm || formData.distanceOneWayKm <= 0) {
      setErrorMsg('Por favor, clique em "Calcular Rota e Frete" para validar a distância.');
      return;
    }
    onNext();
  };

  const originCity = setting?.originCity || 'São Bernardo do Campo';
  const originState = setting?.originState || 'SP';

  return (
    <form onSubmit={handleContinue} className="space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          Etapa 2 de 5
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Onde será o <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Evento?</span>
        </h2>
        <p className="text-sm text-slate-400">
          Calculamos o deslocamento real a partir de nossa base em <strong className="text-white">{originCity} - {originState}</strong> com transparência e sem surpresas.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6">
        {/* CEP search bar */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              CEP do Local do Evento
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Preenchimento automático</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="00000-000"
              value={formData.addressCep}
              onChange={handleCepChange}
              className="w-full max-w-xs px-4 py-3 rounded-xl text-sm font-medium tracking-wider"
            />
            <button
              type="button"
              onClick={() => searchCep(formData.addressCep.replace(/\D/g, ''))}
              disabled={isSearchingCep || formData.addressCep.replace(/\D/g, '').length < 8}
              className="px-5 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-semibold text-xs tracking-wide transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSearchingCep ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar CEP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Full Address Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-300">Rua / Avenida / Espaço</label>
            <input
              type="text"
              placeholder="Ex: Buffet Spazio Reale, Av. Paulista..."
              value={formData.addressStreet}
              onChange={(e) => updateFormData({ addressStreet: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Número</label>
            <input
              type="text"
              placeholder="123 ou S/N"
              value={formData.addressNumber}
              onChange={(e) => updateFormData({ addressNumber: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Bairro</label>
            <input
              type="text"
              placeholder="Ex: Jardim das Flores"
              value={formData.addressNeighborhood}
              onChange={(e) => updateFormData({ addressNeighborhood: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Cidade *</label>
            <input
              type="text"
              placeholder="Ex: São Paulo, Embu das Artes..."
              value={formData.addressCity}
              onChange={(e) => updateFormData({ addressCity: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Estado (UF) *</label>
            <input
              type="text"
              placeholder="SP"
              maxLength={2}
              value={formData.addressState}
              onChange={(e) => updateFormData({ addressState: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium uppercase"
            />
          </div>
        </div>

        {/* Calculate button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => calculateRoute()}
            disabled={isCalculatingRoute || !formData.addressCity}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/40 text-cyan-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {isCalculatingRoute ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Calculando trajeto e distância em tempo real...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Calcular Rota & Deslocamento</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Route & Displacement Results Card */}
        {routeInfo && routeInfo.shipping && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#121420] to-[#181b2e] border border-cyan-500/30 space-y-4 shadow-xl">
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Deslocamento Calculado</h4>
                  <p className="text-xs text-slate-400">
                    Origem: <span className="text-slate-300">{originCity}</span> ➔ Destino: <span className="text-cyan-300 font-medium">{formData.addressCity} - {formData.addressState}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Frete Total Estimado</span>
                <span className="text-lg sm:text-xl font-extrabold text-white">
                  {formatCurrencyBRL(routeInfo.shipping.finalShipping)}
                </span>
              </div>
            </div>

            {/* Distance Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Distância de Ida</span>
                <span className="text-sm font-bold text-white">
                  {routeInfo.shipping.distanceOneWayKm} km
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[11px] text-slate-400 block">Ida + Volta Total</span>
                <span className="text-sm font-bold text-cyan-300">
                  {routeInfo.shipping.distanceTotalKm} km
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 block">Tempo Estimado de Viagem</span>
                <span className="text-sm font-bold text-white">
                  ~{routeInfo.durationMinutes} min
                </span>
              </div>
            </div>

            {/* Minimum shipping notice if triggered */}
            {routeInfo.shipping.appliedMinShipping && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Valor ajustado para a taxa de frete mínimo de {formatCurrencyBRL(routeInfo.shipping.minShippingPrice)}.
                </span>
              </div>
            )}

            {/* Collapsible Details */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>{showDetails ? 'Ocultar detalhes do cálculo' : 'Ver detalhes do cálculo de deslocamento'}</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDetails && (
                <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-400" />
                      Combustível ({routeInfo.shipping.litersNeeded}L @ {formatCurrencyBRL(setting.gasPricePerLiter)}/L):
                    </span>
                    <span className="font-semibold">{formatCurrencyBRL(routeInfo.shipping.fuelCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-fuchsia-400" />
                      Margem Operacional de Deslocamento:
                    </span>
                    <span className="font-semibold">{formatCurrencyBRL(routeInfo.shipping.marginCost)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CircleDollarSign className="w-3.5 h-3.5 text-cyan-400" />
                      Pedágios estimados:
                    </span>
                    <span className="font-semibold">{formatCurrencyBRL(routeInfo.shipping.tollsCost)}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-white">
                    <span>Subtotal Deslocamento:</span>
                    <span>{formatCurrencyBRL(routeInfo.shipping.calculatedShipping)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Manual Toll input */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Seu trajeto possui pedágio conhecido? (Opcional):
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0,00"
                  value={formData.manualTollAmount || ''}
                  onChange={handleManualTollChange}
                  className="w-24 px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
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
          disabled={!formData.distanceOneWayKm || formData.distanceOneWayKm <= 0}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-fuchsia-600/30 hover:shadow-fuchsia-600/50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <span>Avançar para Atrações</span>
          <span className="text-lg">→</span>
        </button>
      </div>
    </form>
  );
}
