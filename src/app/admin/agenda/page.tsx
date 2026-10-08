'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldAlert,
  MapPin,
  RefreshCw,
  ExternalLink,
  Info,
  CalendarCheck2,
  Check,
  Search,
} from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminAgendaPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [confirmedQuotes, setConfirmedQuotes] = useState<any[]>([]);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<any[]>([]);
  const [contractEvents, setContractEvents] = useState<any[]>([]);
  const [setting, setSetting] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [gcalModalOpen, setGcalModalOpen] = useState(false);

  const [gcalUrls, setGcalUrls] = useState({
    googleCalendarUrl1: '',
    googleCalendarUrl2: '',
  });
  const [savingGcal, setSavingGcal] = useState(false);
  const [testingUrl1, setTestingUrl1] = useState(false);
  const [testingUrl2, setTestingUrl2] = useState(false);
  const [testResult1, setTestResult1] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testResult2, setTestResult2] = useState<{ success?: boolean; message?: string } | null>(null);

  const [newBlock, setNewBlock] = useState({
    title: 'Data Bloqueada / Evento',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    isFullDay: true,
    reason: 'Evento já confirmado na agenda',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAgenda = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await fetch('/api/admin/agenda', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setBlocks(data.blocks || []);
        setConfirmedQuotes(data.confirmedQuotes || []);
        setGoogleCalendarEvents(data.googleCalendarEvents || []);
        setContractEvents(data.contractEvents || []);
        if (data.setting) {
          setSetting(data.setting);
          setGcalUrls({
            googleCalendarUrl1: data.setting.googleCalendarUrl1 || '',
            googleCalendarUrl2: data.setting.googleCalendarUrl2 || '',
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Deseja realmente remover este bloqueio de data?')) return;
    try {
      const res = await fetch(`/api/admin/agenda?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlock),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setModalOpen(false);
        fetchAgenda();
      } else {
        setErrorMsg(data.error || 'Erro ao salvar bloqueio.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro de conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestUrl = async (urlNumber: 1 | 2) => {
    const url = urlNumber === 1 ? gcalUrls.googleCalendarUrl1 : gcalUrls.googleCalendarUrl2;
    if (!url) {
      alert('Por favor, cole a URL do Google Agenda antes de testar.');
      return;
    }

    if (urlNumber === 1) {
      setTestingUrl1(true);
      setTestResult1(null);
    } else {
      setTestingUrl2(true);
      setTestResult2(null);
    }

    try {
      const res = await fetch('/api/admin/agenda/test-gcal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (urlNumber === 1) {
          setTestResult1({ success: true, message: data.message });
        } else {
          setTestResult2({ success: true, message: data.message });
        }
      } else {
        if (urlNumber === 1) {
          setTestResult1({ success: false, message: data.error || 'Erro ao conectar.' });
        } else {
          setTestResult2({ success: false, message: data.error || 'Erro ao conectar.' });
        }
      }
    } catch (err: any) {
      const errorStr = `Falha de conexão: ${err.message}`;
      if (urlNumber === 1) setTestResult1({ success: false, message: errorStr });
      else setTestResult2({ success: false, message: errorStr });
    } finally {
      if (urlNumber === 1) setTestingUrl1(false);
      else setTestingUrl2(false);
    }
  };

  const handleSaveGcal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGcal(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gcalUrls),
      });
      if (res.ok) {
        setGcalModalOpen(false);
        fetchAgenda(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGcal(false);
    }
  };

  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-fuchsia-400" />
            Agenda & Disponibilidade de Eventos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerenciamento de agenda, integração com Google Calendar, Sistema de Contratos e bloqueios de datas e horários.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setGcalModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <CalendarCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Google Calendar Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-fuchsia-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Bloquear Data / Horário</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#10121d] to-cyan-950/30 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <CalendarCheck2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Sincronização Google Calendar</span>
              {gcalUrls.googleCalendarUrl1 || gcalUrls.googleCalendarUrl2 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Ativo ({googleCalendarEvents.length} eventos detectados)
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                  Link iCal não configurado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Eventos cadastrados no Google Agenda e Sistema de Contratos bloqueiam datas e horários no site de cotação.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchAgenda(true)}
          disabled={refreshing}
          className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/5 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{refreshing ? 'Atualizando...' : 'Atualizar Agora'}</span>
        </button>
      </div>

      {/* 4-Columns Grid: Google Calendar | Sistema Contratos | Cotações Confirmadas | Bloqueios Manuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Google Calendar Feed */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              Google Calendar ({googleCalendarEvents.length})
            </h2>
            <span className="text-[10px] text-cyan-400 font-semibold">iCal Feed</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 flex-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
              </div>
            ) : googleCalendarEvents.length > 0 ? (
              googleCalendarEvents.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-white text-xs line-clamp-1">{ev.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20 shrink-0">
                      {ev.isFullDay ? 'Dia Todo' : `${ev.startTime || ''} às ${ev.endTime || 'fim'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300 font-mono">
                      <CalendarIcon className="w-3 h-3 text-cyan-400" />
                      {formatDateBR(ev.date)}
                    </span>
                    <span className="truncate max-w-[90px] text-[9px] text-slate-500">{ev.calendarSource}</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                      <MapPin className="w-3 h-3 text-fuchsia-400 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <p>Nenhum evento detectado no Google Calendar.</p>
                <button
                  type="button"
                  onClick={() => setGcalModalOpen(true)}
                  className="text-[11px] text-cyan-400 hover:underline font-semibold"
                >
                  Configurar Links iCal (.ics) →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sistema de Contratos Feed */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              Sistema Contratos ({contractEvents.length})
            </h2>
            <span className="text-[10px] text-fuchsia-400 font-semibold">Contratos</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 flex-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-5 h-5 text-fuchsia-400 animate-spin mx-auto" />
              </div>
            ) : contractEvents.length > 0 ? (
              contractEvents.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-white text-xs truncate max-w-[140px]">{c.clientName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 font-semibold border border-fuchsia-500/20 shrink-0">
                      {c.eventTime || 'Horário agendado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300 font-mono">
                      <CalendarIcon className="w-3 h-3 text-fuchsia-400" />
                      {formatDateBR(c.eventDate)}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold">{c.status}</span>
                  </div>
                  {c.location && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                      <MapPin className="w-3 h-3 text-fuchsia-400 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <p>Nenhum contrato ativo sincronizado no momento.</p>
                <a
                  href="https://contrato.roboledpartner.com.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-fuchsia-400 hover:underline font-semibold inline-block"
                >
                  Abrir Sistema Contratos ↗
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Cotações Confirmadas */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Cotações Confirmadas ({confirmedQuotes.length})
            </h2>
            <span className="text-[10px] text-emerald-400 font-semibold">Cotações</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 flex-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
              </div>
            ) : confirmedQuotes.length > 0 ? (
              confirmedQuotes.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-white text-xs truncate max-w-[140px]">{q.clientName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20 shrink-0">
                      {q.eventTime || 'Horário Definido'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300 font-mono">
                      <CalendarIcon className="w-3 h-3 text-emerald-400" />
                      {formatDateBR(q.eventDate)}
                    </span>
                    <span className="text-emerald-400 font-bold">{formatCurrencyBRL(q.totalAmount)}</span>
                  </div>
                  {q.eventCity && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{q.eventCity} - {q.eventState}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum orçamento com status &quot;Confirmado&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Bloqueios Manuais */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Bloqueios Manuais ({blocks.length})
            </h2>
            <span className="text-[10px] text-amber-400 font-semibold">Manual</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 flex-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin mx-auto" />
              </div>
            ) : blocks.length > 0 ? (
              blocks.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">{b.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                        {b.isFullDay ? 'Dia Todo' : `${b.startTime} - ${b.endTime}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="text-slate-300 font-mono">{formatDateBR(b.date)}</span>
                      {b.reason && <span className="italic truncate max-w-[110px]">— {b.reason}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(b.id)}
                    className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    title="Remover Bloqueio"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum bloqueio manual ativo.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: GOOGLE CALENDAR CONFIGURATION */}
      {gcalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-cyan-400" />
                <span>Configurar Sincronização Google Calendar</span>
              </h3>
              <button
                type="button"
                onClick={() => setGcalModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 text-slate-300 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Como pegar o link secreto iCal (.ics) no Google Agenda:
              </div>
              <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-cyan-200/90">
                <li>Abra o <strong>Google Agenda</strong> (calendar.google.com);</li>
                <li>Clique na agenda <strong>Robo Led Partner</strong> no menu lateral esquerdo;</li>
                <li>Role a página até a seção <strong>&quot;Integrar agenda&quot;</strong>;</li>
                <li>Copie o campo <strong>&quot;Endereço secreto no formato iCal&quot;</strong> (termina com .ics).</li>
              </ol>
            </div>

            <form onSubmit={handleSaveGcal} className="space-y-4 text-xs">
              {/* Google Calendar 1 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    URL iCal (.ics) — Robo Led Partner
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestUrl(1)}
                    disabled={testingUrl1 || !gcalUrls.googleCalendarUrl1}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 disabled:opacity-50"
                  >
                    {testingUrl1 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    <span>Testar Link</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                  value={gcalUrls.googleCalendarUrl1}
                  onChange={(e) => {
                    setGcalUrls({ ...gcalUrls, googleCalendarUrl1: e.target.value.trim() });
                    setTestResult1(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono text-[11px] bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                {testResult1 && (
                  <div
                    className={`p-2 rounded-lg text-[11px] border flex items-center gap-1.5 ${
                      testResult1.success
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-300 border-red-500/30'
                    }`}
                  >
                    {testResult1.success ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    <span>{testResult1.message}</span>
                  </div>
                )}
              </div>

              {/* Google Calendar 2 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    URL iCal (.ics) — 2ª Agenda (Opcional)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTestUrl(2)}
                    disabled={testingUrl2 || !gcalUrls.googleCalendarUrl2}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 disabled:opacity-50"
                  >
                    {testingUrl2 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    <span>Testar Link</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                  value={gcalUrls.googleCalendarUrl2}
                  onChange={(e) => {
                    setGcalUrls({ ...gcalUrls, googleCalendarUrl2: e.target.value.trim() });
                    setTestResult2(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono text-[11px] bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                {testResult2 && (
                  <div
                    className={`p-2 rounded-lg text-[11px] border flex items-center gap-1.5 ${
                      testResult2.success
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-300 border-red-500/30'
                    }`}
                  >
                    {testResult2.success ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    <span>{testResult2.message}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGcalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingGcal}
                  className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide shadow-md flex items-center gap-1.5"
                >
                  {savingGcal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar e Sincronizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL DATE BLOCK */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Bloquear Data na Agenda</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 text-slate-300 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBlock} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Título / Motivo do Bloqueio *</label>
                <input
                  type="text"
                  required
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Data do Evento / Bloqueio *</label>
                <input
                  type="date"
                  required
                  value={newBlock.date}
                  onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fullDay"
                  checked={newBlock.isFullDay}
                  onChange={(e) => setNewBlock({ ...newBlock, isFullDay: e.target.checked })}
                  className="w-4 h-4 rounded text-fuchsia-600 bg-black/40 border-white/10 focus:ring-0"
                />
                <label htmlFor="fullDay" className="text-slate-300 cursor-pointer">
                  Bloquear o dia inteiro
                </label>
              </div>

              {!newBlock.isFullDay && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Horário de Início</label>
                    <input
                      type="time"
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Horário de Término</label>
                    <input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Observações adicionais (opcional)</label>
                <textarea
                  rows={2}
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-fuchsia-600/30 flex items-center gap-1.5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Bloqueio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
