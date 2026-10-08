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
  Calendar,
  Lock,
  KeyRound,
  FileText,
  ExternalLink,
  User,
} from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { CompanySetting } from '@/lib/types';

export default function AdminSettingsPage() {
  const [setting, setSetting] = useState<CompanySetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password and credentials state
  const [credForm, setCredForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingCred, setSavingCred] = useState(false);
  const [credSuccessMsg, setCredSuccessMsg] = useState('');
  const [credErrorMsg, setCredErrorMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok && data.setting) {
          setSetting(data.setting);
        }

        // Load current admin info
        const meRes = await fetch('/api/admin/auth/me');
        const meData = await meRes.json();
        if (meRes.ok && meData.user) {
          setCredForm((prev) => ({
            ...prev,
            name: meData.user.name || '',
            email: meData.user.email || '',
          }));
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
      if (res.ok) {
        setSuccessMsg('Configurações operacionais salvas com sucesso!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Falha ao salvar configurações.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de comunicação ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredSuccessMsg('');
    setCredErrorMsg('');

    if (!credForm.currentPassword) {
      setCredErrorMsg('Por favor, informe a senha atual para autorizar as alterações.');
      return;
    }

    if (credForm.newPassword) {
      if (credForm.newPassword.length < 6) {
        setCredErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (credForm.newPassword !== credForm.confirmPassword) {
        setCredErrorMsg('A confirmação da nova senha não confere com a nova senha.');
        return;
      }
    }

    setSavingCred(true);
    try {
      const res = await fetch('/api/admin/auth/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: credForm.currentPassword,
          newEmail: credForm.email,
          newName: credForm.name,
          newPassword: credForm.newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCredSuccessMsg('Credenciais de login alteradas com sucesso! Salve suas novas informações.');
        setCredForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setTimeout(() => setCredSuccessMsg(''), 5000);
      } else {
        setCredErrorMsg(data.error || 'Falha ao atualizar credenciais.');
      }
    } catch (err: any) {
      setCredErrorMsg(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setSavingCred(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-fuchsia-400" />
          Configurações Operacionais & Segurança
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Gerencie o cálculo de frete, origens, canais comerciais, agenda Google Calendar e credenciais de login.
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

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Capacidade Máxima de Eventos por Dia</span>
                <span className="text-[11px] text-slate-400">Bloqueio automático de agenda</span>
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
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">eventos/dia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Google Agenda & Integração Operacional */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-fuchsia-400" />
            Sincronização com Google Agenda (Bloqueio Automático em Tempo Real)
          </h2>
          <p className="text-xs text-slate-400">
            Cole as URLs secretas em formato iCal (.ics) do Google Calendar para bloquear automaticamente datas e horários já ocupados.
          </p>

          <div className="p-3.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-xs text-fuchsia-200 space-y-1.5">
            <p className="font-bold">Como pegar a URL secreta no Google Agenda:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
              <li>Abra o <strong>Google Calendar (calendar.google.com)</strong> no computador;</li>
              <li>Passe o mouse na sua agenda no menu lateral esquerdo, clique nos <strong>3 pontinhos</strong> ➔ <em>Configurações e Compartilhamento</em>;</li>
              <li>Role a página até a seção <strong>"Integrar Agenda"</strong>;</li>
              <li>Copie o link do campo <strong>"Endereço secreto no formato iCal"</strong> (termina com <code className="text-white">.ics</code>) e cole abaixo:</li>
            </ol>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Google Agenda 1 (roboledpartner@gmail.com)</span>
                <span className="text-[11px] text-slate-400">Formato .ics secreto</span>
              </label>
              <input
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/roboledpartner%40gmail.com/private-.../basic.ics"
                value={setting?.googleCalendarUrl1 || ''}
                onChange={(e) => handleChange('googleCalendarUrl1', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Google Agenda 2 (luanchaves1011@gmail.com)</span>
                <span className="text-[11px] text-slate-400">Formato .ics secreto</span>
              </label>
              <input
                type="url"
                placeholder="https://calendar.google.com/calendar/ical/luanchaves1011%40gmail.com/private-.../basic.ics"
                value={setting?.googleCalendarUrl2 || ''}
                onChange={(e) => handleChange('googleCalendarUrl2', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-mono text-[11px]"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>URL do Sistema de Contratos</span>
                <span className="text-[11px] text-cyan-400">Para geração com 1 clique</span>
              </label>
              <input
                type="url"
                placeholder="https://contrato.roboledpartner.com.br"
                value={setting?.sistemaContratoUrl || 'https://contrato.roboledpartner.com.br'}
                onChange={(e) => handleChange('sistemaContratoUrl', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Canais de Contato e Conversão */}
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

        {/* Save Operational Settings CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-fuchsia-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando Configurações...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Configurações Operacionais</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Section 5: Segurança & Alteração de Credenciais Admin */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-red-500/20 bg-gradient-to-b from-[#161224] to-[#10121d] space-y-6 mt-12">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-400" />
            Segurança & Credenciais de Acesso ao Painel Admin
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Altere seu e-mail de administrador e defina uma senha forte e personalizada para proteger seu painel.
          </p>
        </div>

        {credSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{credSuccessMsg}</span>
          </div>
        )}

        {credErrorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{credErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveCredentials} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Nome do Administrador
              </label>
              <input
                type="text"
                value={credForm.name}
                onChange={(e) => setCredForm({ ...credForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                E-mail de Login do Administrador
              </label>
              <input
                type="email"
                value={credForm.email}
                onChange={(e) => setCredForm({ ...credForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-white/5">
            <div className="space-y-1.5">
              <label className="font-semibold text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                Senha Atual * (Obrigatória)
              </label>
              <input
                type="password"
                placeholder="Sua senha atual"
                value={credForm.currentPassword}
                onChange={(e) => setCredForm({ ...credForm, currentPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border-amber-500/30 focus:border-amber-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Nova Senha (Opcional)</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={credForm.newPassword}
                onChange={(e) => setCredForm({ ...credForm, newPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Confirmar Nova Senha</label>
              <input
                type="password"
                placeholder="Repita a nova senha"
                value={credForm.confirmPassword}
                onChange={(e) => setCredForm({ ...credForm, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingCred}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {savingCred ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Atualizando Credenciais...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Atualizar Credenciais com Segurança</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
