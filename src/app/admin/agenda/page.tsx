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
  X,
} from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminAgendaPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [confirmedQuotes, setConfirmedQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-fuchsia-400" />
            Agenda & Disponibilidade de Datas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie datas bloqueadas e visualize eventos confirmados para evitar choque de horários na cotação online.
          </p>
        </div>

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
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 text-white font-bold text-xs tracking-wide shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Bloquear Data / Horário</span>
        </button>
      </div>

      {/* Grid: 2 Columns (Confirmed Events + Blocked Dates) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confirmed Quotes from System */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Eventos Confirmados via Sistema ({confirmedQuotes.length})
            </h2>
            <span className="text-[10px] text-slate-400">Orçamentos fechados</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto" />
              </div>
            ) : confirmedQuotes.length > 0 ? (
              confirmedQuotes.map((q) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{q.clientName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        #{q.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <CalendarIcon className="w-3 h-3 text-cyan-400" />
                        {q.eventDate} {q.eventTime ? `às ${q.eventTime}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-fuchsia-400" />
                        {q.addressCity}
                      </span>
                    </div>
                  </div>

                  <span className="font-bold text-xs text-emerald-400">
                    {formatCurrencyBRL(q.totalAmount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum orçamento com status "Confirmado" até o momento.
              </div>
            )}
          </div>
        </div>

        {/* Manual Date Blocks */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Bloqueios Manuais de Agenda ({blocks.length})
            </h2>
            <span className="text-[10px] text-slate-400">Datas indisponíveis</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto" />
              </div>
            ) : blocks.length > 0 ? (
              blocks.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{b.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                        {b.isFullDay ? 'Dia Inteiro' : `${b.startTime} - ${b.endTime}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <CalendarIcon className="w-3 h-3 text-cyan-400" />
                        {b.date}
                      </span>
                      {b.reason && <span className="italic">— {b.reason}</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(b.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    title="Remover Bloqueio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum bloqueio manual cadastrado. As datas estarão abertas conforme capacidade.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
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
