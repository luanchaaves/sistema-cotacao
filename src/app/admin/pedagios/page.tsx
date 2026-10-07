'use client';

import React, { useEffect, useState } from 'react';
import {
  CircleDollarSign,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TollItem } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/calculator';

export default function AdminTollsPage() {
  const [tolls, setTolls] = useState<TollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingToll, setEditingToll] = useState<Partial<TollItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTolls = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tolls');
      const data = await res.json();
      if (res.ok) {
        setTolls(data.tolls || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTolls();
  }, []);

  const handleOpenCreate = () => {
    setEditingToll({
      name: '',
      highway: '',
      price: 0,
      region: 'SP',
      direction: 'Ambos',
      isActive: true,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (toll: TollItem) => {
    setEditingToll({ ...toll });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleToggleActive = async (toll: TollItem) => {
    try {
      const res = await fetch('/api/admin/tolls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: toll.id, isActive: !toll.isActive }),
      });
      if (res.ok) {
        setTolls((prev) =>
          prev.map((t) => (t.id === toll.id ? { ...t, isActive: !t.isActive } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este pedágio cadastrado?')) return;
    try {
      const res = await fetch(`/api/admin/tolls?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTolls((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingToll) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const isEdit = Boolean(editingToll.id);
      const res = await fetch('/api/admin/tolls', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingToll),
      });

      const data = await res.json();
      if (res.ok && data.toll) {
        setModalOpen(false);
        fetchTolls();
      } else {
        setErrorMsg(data.error || 'Erro ao salvar pedágio.');
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
            <CircleDollarSign className="w-6 h-6 text-cyan-400" />
            Cadastro de Pedágios
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre praças de pedágio conhecidas por rodovia/região para consulta e integração.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 text-white font-bold text-xs tracking-wide shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Pedágio</span>
        </button>
      </div>

      {/* Table of Tolls */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/5 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Nome da Praça</th>
                <th className="p-3.5">Rodovia</th>
                <th className="p-3.5">Região</th>
                <th className="p-3.5">Sentido</th>
                <th className="p-3.5">Tarifa</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <Loader2 className="w-6 h-6 text-fuchsia-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : tolls.length > 0 ? (
                tolls.map((toll) => (
                  <tr key={toll.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-bold text-white">{toll.name}</td>
                    <td className="p-3.5 font-medium text-cyan-300">{toll.highway}</td>
                    <td className="p-3.5 text-slate-400">{toll.region}</td>
                    <td className="p-3.5 text-slate-400">{toll.direction}</td>
                    <td className="p-3.5 font-extrabold text-white">{formatCurrencyBRL(toll.price)}</td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(toll)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          toll.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {toll.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(toll)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(toll.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum pedágio cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && editingToll && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-cyan-400" />
                <span>{editingToll.id ? 'Editar Pedágio' : 'Cadastrar Pedágio'}</span>
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
                <label className="font-semibold text-slate-300">Nome da Praça *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Praça Riacho Grande, Praça Piratininga..."
                  value={editingToll.name || ''}
                  onChange={(e) => setEditingToll({ ...editingToll, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Rodovia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SP-160 Imigrantes, SP-150 Anchieta..."
                    value={editingToll.highway || ''}
                    onChange={(e) => setEditingToll({ ...editingToll, highway: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Valor da Tarifa (R$) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={editingToll.price || 0}
                    onChange={(e) =>
                      setEditingToll({ ...editingToll, price: parseFloat(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Região / UF</label>
                  <input
                    type="text"
                    value={editingToll.region || 'SP'}
                    onChange={(e) => setEditingToll({ ...editingToll, region: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Sentido</label>
                  <select
                    value={editingToll.direction || 'Ambos'}
                    onChange={(e) => setEditingToll({ ...editingToll, direction: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl font-medium bg-black/40"
                  >
                    <option value="Ambos">Ambos (Ida e Volta)</option>
                    <option value="Ida">Apenas Ida</option>
                    <option value="Volta">Apenas Volta</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingToll.isActive ?? true}
                    onChange={(e) =>
                      setEditingToll({ ...editingToll, isActive: e.target.checked })
                    }
                    className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span className="font-medium text-slate-300">Pedágio Ativo</span>
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
                      <span>Salvar Pedágio</span>
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
