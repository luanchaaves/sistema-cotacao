'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Search,
  Filter,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuotes, setTotalQuotes] = useState(0);

  // Selected quote for detail modal
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        status: statusFilter,
        eventType: eventTypeFilter,
      });

      const res = await fetch(`/api/admin/quotes?${query}`);
      const data = await res.json();
      if (res.ok) {
        setQuotes(data.quotes || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalQuotes(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [page, statusFilter, eventTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuotes();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setQuotes((prev) =>
          prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
        );
        if (selectedQuote && selectedQuote.id === id) {
          setSelectedQuote((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-fuchsia-400" />
            Histórico de Orçamentos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerenciamento completo de cotações automáticas recebidas ({totalQuotes} registradas).
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          {/* Search text */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, nome do cliente, WhatsApp ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Status select */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl text-xs font-medium bg-black/40 border border-white/10"
          >
            <option value="">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="contacted">Contatado</option>
            <option value="confirmed">Confirmado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {/* Event type select */}
          <select
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2.5 rounded-xl text-xs font-medium bg-black/40 border border-white/10"
          >
            <option value="">Todos os Tipos de Evento</option>
            <option value="Casamento">Casamento</option>
            <option value="15 anos">15 anos</option>
            <option value="Aniversário">Aniversário</option>
            <option value="Festa infantil">Festa infantil</option>
            <option value="Evento corporativo">Evento corporativo</option>
            <option value="Formatura">Formatura</option>
            <option value="Outro">Outro</option>
          </select>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs tracking-wide shadow-md"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Main Quotes Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Código</th>
                <th className="p-3.5">Data/Hora</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">WhatsApp</th>
                <th className="p-3.5">Evento</th>
                <th className="p-3.5">Data Evento</th>
                <th className="p-3.5">Local / Km</th>
                <th className="p-3.5">Valor Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center">
                    <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : quotes.length > 0 ? (
                quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-fuchsia-400">#{q.code}</td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(q.createdAt).toLocaleDateString('pt-BR')} {new Date(q.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 font-semibold text-white">{q.clientName}</td>
                    <td className="p-3.5 font-mono text-slate-300">{q.clientWhatsapp}</td>
                    <td className="p-3.5">
                      <span className="font-medium text-white">{q.eventType}</span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {q.eventDate} {q.eventTime ? `às ${q.eventTime}` : ''}
                    </td>
                    <td className="p-3.5">
                      <span className="block truncate max-w-[120px]" title={q.addressCity || q.addressFull}>
                        {q.addressCity || 'N/A'}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-semibold">{q.distanceOneWayKm} km</span>
                    </td>
                    <td className="p-3.5 font-black text-white">
                      {formatCurrencyBRL(q.totalAmount)}
                    </td>
                    <td className="p-3.5">
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-wider ${
                          q.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : q.status === 'contacted'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : q.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <option value="pending" className="bg-[#10121d] text-white">Pendente</option>
                        <option value="contacted" className="bg-[#10121d] text-white">Contatado</option>
                        <option value="confirmed" className="bg-[#10121d] text-white">Confirmado</option>
                        <option value="cancelled" className="bg-[#10121d] text-white">Cancelado</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedQuote(q)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                          title="Ver Detalhes do Orçamento"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`https://api.whatsapp.com/send/?phone=${q.clientWhatsapp.replace(/\D/g, '')}&text=Olá ${encodeURIComponent(q.clientName)}, tudo bem? Falamos da Robô LED Partner sobre o seu orçamento %23${q.code}!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                          title="Abrir WhatsApp do Cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <Link
                          href={`/orcamento/${q.code}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/30"
                          title="Abrir Proposta Pública"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Nenhum orçamento localizado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>
              Página <strong className="text-white">{page}</strong> de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL DRAWER */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl p-6 space-y-6 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs text-slate-400 font-medium">Detalhes do Orçamento</span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-fuchsia-400">#{selectedQuote.code}</span>
                  <span>— {selectedQuote.clientName}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="w-8 h-8 rounded-lg bg-white/10 text-slate-300 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status atual:</span>
                <select
                  value={selectedQuote.status}
                  onChange={(e) => handleStatusChange(selectedQuote.id, e.target.value)}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider bg-black/40"
                >
                  <option value="pending">Pendente</option>
                  <option value="contacted">Contatado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`http://192.168.12.7:3001/?cliente=${encodeURIComponent(
                    selectedQuote.clientName
                  )}&telefone=${encodeURIComponent(
                    selectedQuote.clientWhatsapp
                  )}&evento=${encodeURIComponent(
                    selectedQuote.eventType
                  )}&data=${encodeURIComponent(
                    selectedQuote.eventDate
                  )}&horario=${encodeURIComponent(
                    selectedQuote.eventTime || ''
                  )}&local=${encodeURIComponent(
                    selectedQuote.addressFull
                  )}&valor=${encodeURIComponent(
                    selectedQuote.totalAmount
                  )}&proposta=${encodeURIComponent(selectedQuote.code)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  title="Abrir no Sistema de Contratos (Porta 3001)"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>📄 Gerar Contrato (Sistema Robô LED)</span>
                </a>

                <a
                  href={`https://api.whatsapp.com/send/?phone=${selectedQuote.clientWhatsapp.replace(/\D/g, '')}&text=Olá ${encodeURIComponent(selectedQuote.clientName)}, tudo bem? Falamos da Robô LED Partner!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <Link
                  href={`/orcamento/${selectedQuote.code}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver Proposta</span>
                </Link>
              </div>
            </div>

            {/* Customer & Event Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block font-medium">Nome do Cliente:</span>
                <span className="font-bold text-white text-sm">{selectedQuote.clientName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-medium">WhatsApp:</span>
                <span className="font-mono text-white text-sm">{selectedQuote.clientWhatsapp}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-medium">Tipo de Evento:</span>
                <span className="font-semibold text-white">{selectedQuote.eventType}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-medium">Data e Horário:</span>
                <span className="font-semibold text-white">
                  {selectedQuote.eventDate} {selectedQuote.eventTime ? `às ${selectedQuote.eventTime}` : ''}
                </span>
              </div>
              <div className="col-span-2 space-y-1">
                <span className="text-slate-400 block font-medium">Endereço do Local:</span>
                <span className="font-medium text-slate-200 block">{selectedQuote.addressFull}</span>
              </div>
            </div>

            {/* Attractions Itemized Breakdown */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Atrações Contratadas
              </span>
              <div className="rounded-xl border border-white/5 p-3.5 space-y-2 text-xs bg-black/20">
                {selectedQuote.selectedComboData && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-fuchsia-300 font-semibold">
                      Combo: {selectedQuote.selectedComboData.name} ({selectedQuote.selectedComboData.durationHours}h)
                    </span>
                    <span className="font-bold text-white">
                      {formatCurrencyBRL(selectedQuote.selectedComboData.promoPrice)}
                    </span>
                  </div>
                )}
                {selectedQuote.selectedServicesData?.map((svc: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-white/5">
                    <span>
                      {svc.name} {svc.priceType === 'hourly' ? `(${svc.durationHours}h)` : ''}
                    </span>
                    <span className="font-bold text-white">{formatCurrencyBRL(svc.itemTotal)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 font-bold text-white">
                  <span>Subtotal Serviços:</span>
                  <span>{formatCurrencyBRL(selectedQuote.servicesSubtotal)}</span>
                </div>
              </div>
            </div>

            {/* Freight and Logistics Breakdown */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Deslocamento & Frete ({selectedQuote.distanceTotalKm} km ida e volta)
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-black/20 border border-white/5 text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Combustível:</span>
                  <span className="font-semibold">{formatCurrencyBRL(selectedQuote.fuelCost)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Margem Fixa:</span>
                  <span className="font-semibold">{formatCurrencyBRL(selectedQuote.marginCost)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pedágios:</span>
                  <span className="font-semibold">{formatCurrencyBRL(selectedQuote.tollsCost)}</span>
                </div>
              </div>
              <div className="flex justify-between px-1 text-xs font-bold text-cyan-300">
                <span>Frete Final Aplicado:</span>
                <span>{formatCurrencyBRL(selectedQuote.finalShipping)}</span>
              </div>
            </div>

            {/* Total Grand Highlight */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-fuchsia-950/40 to-cyan-950/40 border border-fuchsia-500/30 flex justify-between items-center">
              <span className="font-extrabold text-sm text-white">VALOR TOTAL DO ORÇAMENTO:</span>
              <span className="text-2xl font-black text-white">
                {formatCurrencyBRL(selectedQuote.totalAmount)}
              </span>
            </div>

            {/* Notes */}
            {selectedQuote.notes && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">Observações do Cliente:</span>
                <p className="text-slate-200 italic">{selectedQuote.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
