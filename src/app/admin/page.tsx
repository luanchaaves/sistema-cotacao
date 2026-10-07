'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MessageCircle,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Painel Comercial Robô LED Partner
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão geral de cotações automáticas, receitas estimadas e conversão de leads.
          </p>
        </div>

        <Link
          href="/admin/orcamentos"
          className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs tracking-wide shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition-all"
        >
          <span>Ver Todos os Orçamentos</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotes */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total de Cotações</span>
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.totalQuotes || 0}</div>
          <span className="text-[11px] text-slate-400 block">
            {stats?.quotesToday || 0} novas cotações hoje
          </span>
        </div>

        {/* Total Estimated Revenue */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Volume Estimado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {formatCurrencyBRL(stats?.totalEstimatedRevenue || 0)}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Este Mês: {stats?.quotesThisMonth || 0} cotações
          </span>
        </div>

        {/* Average Ticket */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-cyan-300">
            {formatCurrencyBRL(stats?.averageQuoteTicket || 0)}
          </div>
          <span className="text-[11px] text-slate-400 block">Média por proposta comercial</span>
        </div>

        {/* Confirmed Quotes */}
        <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Confirmados</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-300">
            {stats?.confirmedQuotes || 0}
          </div>
          <span className="text-[11px] text-slate-400 block">Eventos fechados com sucesso</span>
        </div>
      </div>

      {/* Recent Quotes Section */}
      <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-fuchsia-400" />
            Últimos Orçamentos Recebidos
          </h2>
          <Link
            href="/admin/orcamentos"
            className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-semibold"
          >
            Ver todos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Evento & Data</th>
                <th className="p-3">Cidade</th>
                <th className="p-3">Valor Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {stats?.recentQuotes?.length > 0 ? (
                stats.recentQuotes.map((q: any) => (
                  <tr key={q.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono font-bold text-fuchsia-400">#{q.code}</td>
                    <td className="p-3">
                      <span className="font-semibold text-white block">{q.clientName}</span>
                      <span className="text-slate-400 text-[11px]">{q.clientWhatsapp}</span>
                    </td>
                    <td className="p-3">
                      <span className="block text-white font-medium">{q.eventType}</span>
                      <span className="text-slate-400 text-[11px]">{q.eventDate}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-300">{q.addressCity || 'N/A'}</td>
                    <td className="p-3 font-extrabold text-white">{formatCurrencyBRL(q.totalAmount)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          q.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : q.status === 'contacted'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : q.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {q.status === 'confirmed'
                          ? 'Confirmado'
                          : q.status === 'contacted'
                          ? 'Contatado'
                          : q.status === 'cancelled'
                          ? 'Cancelado'
                          : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://api.whatsapp.com/send/?phone=${q.clientWhatsapp.replace(/\D/g, '')}&text=Olá ${encodeURIComponent(q.clientName)}, tudo bem? Falamos da Robô LED Partner a respeito do seu orçamento %23${q.code}!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                          title="Falar no WhatsApp com o cliente"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <Link
                          href={`/orcamento/${q.code}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                          title="Ver Proposta"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Nenhum orçamento registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
