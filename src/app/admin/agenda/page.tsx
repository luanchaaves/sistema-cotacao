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
} from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminAgendaPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [confirmedQuotes, setConfirmedQuotes] = useState<any[]>([]);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<any[]>([]);
  const [setting, setSetting] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [gcalModalOpen, setGcalModalOpen] = useState(false);

  const [gcalUrls, setGcalUrls] = useState({
    googleCalendarUrl1: '',
    googleCalendarUrl2: '',
  });
  const [savingGcal, setSavingGcal] = useState(false);

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

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agenda');
      const data = await res.json();
      if (res.ok) {
        setBlocks(data.blocks || []);
        setConfirmedQuotes(data.confirmedQuotes || []);
        setGoogleCalendarEvents(data.googleCalendarEvents || []);
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
        fetchAgenda();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGcal(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-fuchsia-400" />
            Agenda & Disponibilidade de Eventos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerenciamento de agenda, integração com Google Calendar e bloqueio automático de datas e horários.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGcalModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <CalendarCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google Calendar Sync</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewBlock({
                title: 'Data Bloqueada / Evento',
                date: new Date().toISOString().split('T')[0],
                startTime: '',
                endTime: '',
                isFullDay: true,
                reason: 'Evento confirmado / Sem disponibilidade',
              });
              setErrorMsg('');
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 text-white font-bold text-xs tracking-wide shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Bloquear Data / Horário</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Sync Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-black/40 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <CalendarCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Sincronização Google Calendar</span>
              {gcalUrls.googleCalendarUrl1 || gcalUrls.googleCalendarUrl2 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Ativo ({googleCalendarEvents.length} eventos detectados)
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                  URLs iCal não configuradas
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Contas integradas:{' '}
              <span className="text-slate-300 font-mono">roboledpartner@gmail.com</span> &{' '}
              <span className="text-slate-300 font-mono">luanchaves1011@gmail.com</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchAgenda()}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium border border-white/5 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Agora</span>
        </button>
      </div>

      {/* Grid: 3 Columns (Google Calendar Events + Confirmed Quotes + Manual Blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Google Calendar Sync Feed */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              Google Calendar ({googleCalendarEvents.length})
            </h2>
            <span className="text-[10px] text-slate-400">Sincronizado</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
              </div>
            ) : googleCalendarEvents.length > 0 ? (
              googleCalendarEvents.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-cyan-500/20 hover:border-cyan-500/40 transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[180px]">{ev.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20">
                      {ev.isFullDay ? 'Dia Todo' : `${ev.startTime} às ${ev.endTime || 'fim'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <CalendarIcon className="w-3 h-3 text-cyan-400" />
                      {ev.date}
                    </span>
                    <span className="truncate max-w-[120px] text-[9px] text-slate-500">{ev.calendarSource}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <p>Nenhum evento futuro encontrado nas agendas do Google.</p>
                <button
                  type="button"
                  onClick={() => setGcalModalOpen(true)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Configurar Links iCal (.ics) →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Confirmed Quotes from System */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Cotações Confirmadas ({confirmedQuotes.length})
            </h2>
            <span className="text-[10px] text-slate-400">Sistema</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
              </div>
            ) : confirmedQuotes.length > 0 ? (
              confirmedQuotes.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">{q.clientName}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        #{q.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <CalendarIcon className="w-3 h-3 text-cyan-400" />
                        {q.eventDate} {q.eventTime ? `às ${q.eventTime}` : ''}
                      </span>
                      <span>• {q.addressCity}</span>
                    </div>
                  </div>

                  <span className="font-bold text-xs text-emerald-400">
                    {formatCurrencyBRL(q.totalAmount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum orçamento com status "Confirmado".
              </div>
            )}
          </div>
        </div>

        {/* Manual Date Blocks */}
        <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Bloqueios Manuais ({blocks.length})
            </h2>
            <span className="text-[10px] text-slate-400">Interno</span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
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
                      <span className="text-slate-300">{b.date}</span>
                      {b.reason && <span className="italic truncate max-w-[130px]">— {b.reason}</span>}
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
                <li>Na barra lateral esquerda, passe o mouse na sua agenda e clique nos <strong>3 pontinhos → Configurações</strong>;</li>
                <li>Role até a seção <strong>"Integrar agenda"</strong>;</li>
                <li>Copie o link do campo <strong>"Endereço secreto no formato iCal"</strong> (termina com .ics).</li>
              </ol>
            </div>

            <form onSubmit={handleSaveGcal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>URL iCal (.ics) — roboledpartner@gmail.com</span>
                  <span className="text-[10px] text-slate-500">Google Calendar 1</span>
                </label>
                <input
                  type="url"
                  placeholder="https://calendar.google.com/calendar/ical/roboledpartner%40gmail.com/private-.../basic.ics"
                  value={gcalUrls.googleCalendarUrl1}
                  onChange={(e) => setGcalUrls({ ...gcalUrls, googleCalendarUrl1: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>URL iCal (.ics) — luanchaves1011@gmail.com</span>
                  <span className="text-[10px] text-slate-500">Google Calendar 2</span>
                </label>
                <input
                  type="url"
                  placeholder="https://calendar.google.com/calendar/ical/luanchaves1011%40gmail.com/private-.../basic.ics"
                  value={gcalUrls.googleCalendarUrl2}
                  onChange={(e) => setGcalUrls({ ...gcalUrls, googleCalendarUrl2: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono text-[11px]"
                />
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
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBlock} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Identificação / Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Casamento em Campinas, Manutenção, Folga..."
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Data do Bloqueio *</label>
                <input
                  type="date"
                  required
                  value={newBlock.date}
                  onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBlock.isFullDay}
                    onChange={(e) => setNewBlock({ ...newBlock, isFullDay: e.target.checked })}
                    className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span className="font-semibold text-slate-300">Bloquear o Dia Inteiro</span>
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
                      className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Horário de Término</label>
                    <input
                      type="time"
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Motivo / Mensagem ao Cliente (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Agenda lotada para esta data"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 text-white font-bold tracking-wide shadow-md flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Bloqueio</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
