'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  Clock,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { ServiceItem } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingService({
      name: '',
      slug: '',
      description: '',
      price: 0,
      priceType: 'hourly',
      category: 'attraction',
      imageUrl: '/images/robo-led-1.jpg',
      isActive: true,
      order: services.length,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (svc: ServiceItem) => {
    setEditingService({ ...svc });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleToggleActive = async (svc: ServiceItem) => {
    try {
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: svc.id, isActive: !svc.isActive }),
      });
      if (res.ok) {
        setServices((prev) =>
          prev.map((s) => (s.id === svc.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setServices((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const isEdit = Boolean(editingService.id);
      const res = await fetch('/api/admin/services', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingService),
      });

      const data = await res.json();
      if (res.ok && data.service) {
        setModalOpen(false);
        fetchServices();
      } else {
        setErrorMsg(data.error || 'Erro ao salvar serviço.');
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
            <Sparkles className="w-6 h-6 text-fuchsia-400" />
            Serviços & Atrações
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre e edite os valores de hora e taxas fixas das atrações disponíveis na cotação.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs tracking-wide shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Grid of services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 py-20 text-center">
            <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mx-auto" />
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className={`rounded-2xl p-5 border glass-panel transition-all flex flex-col justify-between ${
                svc.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                  {svc.imageUrl ? (
                    <Image
                      src={svc.imageUrl}
                      alt={svc.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-white">{svc.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(svc)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        svc.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {svc.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{svc.description}</p>
                  <div className="pt-2 flex items-baseline gap-1">
                    <span className="text-base font-black text-fuchsia-400">
                      {formatCurrencyBRL(svc.price)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {svc.priceType === 'hourly' ? '/ hora' : ' (taxa fixa)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">slug: {svc.slug}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(svc)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(svc.id)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                <span>{editingService.id ? 'Editar Serviço' : 'Novo Serviço'}</span>
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

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Robô de LED 2.80m"
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Preço (R$) *</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={editingService.price || 0}
                    onChange={(e) =>
                      setEditingService({ ...editingService, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Tipo de Cobrança</label>
                  <select
                    value={editingService.priceType || 'hourly'}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        priceType: e.target.value as 'hourly' | 'fixed',
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl font-medium bg-black/40"
                  >
                    <option value="hourly">Por Hora (multiplica duração)</option>
                    <option value="fixed">Fixo (taxa única)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Descrição Comercial</label>
                <textarea
                  rows={2}
                  placeholder="Breve descrição dos diferenciais e impacto no evento..."
                  value={editingService.description || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Caminho da Imagem</label>
                <input
                  type="text"
                  placeholder="/images/robo-led-1.jpg"
                  value={editingService.imageUrl || ''}
                  onChange={(e) =>
                    setEditingService({ ...editingService, imageUrl: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingService.isActive ?? true}
                    onChange={(e) =>
                      setEditingService({ ...editingService, isActive: e.target.checked })
                    }
                    className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span className="font-medium text-slate-300">Serviço Ativo na Cotação</span>
                </label>

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
                      <span>Salvar Serviço</span>
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
