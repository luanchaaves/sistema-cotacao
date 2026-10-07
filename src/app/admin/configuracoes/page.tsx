'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  MapPin,
  Fuel,
  ShieldCheck,
  CircleDollarSign,
  Phone,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { CompanySetting } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminSettingsPage() {
  const [setting, setSetting] = useState<CompanySetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok && data.setting) {
          setSetting(data.setting);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (field: keyof CompanySetting, value: any) => {
    if (!setting) return;
    setSetting({ ...setting, [field]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setting) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Configurações comerciais salvas com sucesso!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Erro ao salvar configurações.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro de conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-fuchsia-400" />
          Configurações Comerciais & Deslocamento
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Ajuste as taxas de frete, consumo de combustível, margens operacionais e links de contato sem mexer no código.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Origem de Deslocamento */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Base de Origem (Robô LED Partner)
          </h2>
          <p className="text-xs text-slate-400">
            Endereço utilizado para calcular a quilometragem até o local do evento do cliente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">CEP de Origem</label>
              <input
                type="text"
                value={setting?.originCep || ''}
                onChange={(e) => handleChange('originCep', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-300">Rua / Logradouro</label>
              <input
                type="text"
                value={setting?.originStreet || ''}
                onChange={(e) => handleChange('originStreet', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Número</label>
              <input
                type="text"
                value={setting?.originNumber || ''}
                onChange={(e) => handleChange('originNumber', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Cidade Base</label>
              <input
                type="text"
                value={setting?.originCity || ''}
                onChange={(e) => handleChange('originCity', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Estado (UF)</label>
              <input
                type="text"
                maxLength={2}
                value={setting?.originState || ''}
                onChange={(e) => handleChange('originState', e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Latitude Base</label>
              <input
                type="number"
                step="0.0001"
                value={setting?.originLat || 0}
                onChange={(e) => handleChange('originLat', parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Longitude Base</label>
              <input
                type="number"
                step="0.0001"
                value={setting?.originLng || 0}
                onChange={(e) => handleChange('originLng', parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Parâmetros de Frete e Combustível */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Fuel className="w-4 h-4 text-amber-400" />
            Parâmetros de Cálculo de Deslocamento & Frete
          </h2>
          <p className="text-xs text-slate-400">
            Fórmula: (Distância Total ÷ Consumo) × Preço Gasolina + Margem Operacional + Pedágios.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Consumo Médio do Veículo</span>
                <span className="text-[11px] text-slate-400">km por Litro</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={setting?.vehicleConsumptionKmL || 10}
                  onChange={(e) => handleChange('vehicleConsumptionKmL', parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">km/L</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Preço Médio da Gasolina</span>
                <span className="text-[11px] text-slate-400">R$ por Litro</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  value={setting?.gasPricePerLiter || 7}
                  onChange={(e) => handleChange('gasPricePerLiter', parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">R$/L</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Margem Operacional Fixa</span>
                <span className="text-[11px] text-slate-400">Deslocamento</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1.0"
                  min="0"
                  value={setting?.displacementMarginFixed || 30}
                  onChange={(e) => handleChange('displacementMarginFixed', parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Valor Mínimo de Frete</span>
                <span className="text-[11px] text-slate-400">Piso de saída</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1.0"
                  min="0"
                  value={setting?.minShippingPrice || 50}
                  onChange={(e) => handleChange('minShippingPrice', parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Capacidade Máxima por Dia</span>
                <span className="text-[11px] text-slate-400">Eventos / dia</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={setting?.maxEventsPerDay || 2}
                  onChange={(e) => handleChange('maxEventsPerDay', parseInt(e.target.value) || 2)}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">eventos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Canais de Contato e Conversão */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            Canais Oficiais de Contato & Redes
          </h2>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                WhatsApp Comercial Oficial (com DDI 55 + DDD + Número)
              </label>
              <input
                type="text"
                placeholder="5511919973647"
                value={setting?.whatsappPhone || ''}
                onChange={(e) => handleChange('whatsappPhone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
                URL do Instagram Oficial
              </label>
              <input
                type="text"
                placeholder="https://www.instagram.com/roboledpartner/"
                value={setting?.instagramUrl || ''}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                URL do Linktree Oficial
              </label>
              <input
                type="text"
                placeholder="https://linktr.ee/roboledpartner"
                value={setting?.linktreeUrl || ''}
                onChange={(e) => handleChange('linktreeUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-fuchsia-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando Alterações...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
