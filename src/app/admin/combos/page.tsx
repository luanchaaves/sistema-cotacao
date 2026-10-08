'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Flame,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { ComboItem } from '@/lib/types';
import { formatCurrencyBRL } from '@/lib/calculator';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

export default function AdminCombosPage() {
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Partial<ComboItem> | null>(null);
  const [newItemInput, setNewItemInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/combos');
      const data = await res.json();
      if (res.ok) {
        setCombos(data.combos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const handleOpenCreate = () => {
    setEditingCombo({
      name: '',
      slug: '',
      description: '',
      imageUrl: '/images/robo-led-2.jpg',
      regularPrice: 640,
      promoPrice: 590,
      durationHours: 1.0,
      includedItems: ['Robô de LED (1h show)', 'Cilindro de CO2', 'Fogos Indoor Gerb (2x)'],
      badgeText: 'Mais Vendido',
      isActive: true,
      order: combos.length,
    });
    setNewItemInput('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (combo: ComboItem) => {
    setEditingCombo({
      ...combo,
      includedItems: Array.isArray(combo.includedItems) ? [...combo.includedItems] : [],
    });
    setNewItemInput('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleAddItem = () => {
    if (!newItemInput.trim() || !editingCombo) return;
    const current = editingCombo.includedItems || [];
    setEditingCombo({
      ...editingCombo,
      includedItems: [...current, newItemInput.trim()],
    });
    setNewItemInput('');
  };

  const handleRemoveItem = (index: number) => {
    if (!editingCombo) return;
    const current = [...(editingCombo.includedItems || [])];
    current.splice(index, 1);
    setEditingCombo({ ...editingCombo, includedItems: current });
  };

  const handleToggleActive = async (combo: ComboItem) => {
    try {
      const res = await fetch('/api/admin/combos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: combo.id, isActive: !combo.isActive }),
      });
      if (res.ok) {
        setCombos((prev) =>
          prev.map((c) => (c.id === combo.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este combo?')) return;
    try {
      const res = await fetch(`/api/admin/combos?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCombos((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const isEdit = Boolean(editingCombo.id);
      const res = await fetch('/api/admin/combos', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCombo),
      });

      const data = await res.json();
      if (res.ok && data.combo) {
        setModalOpen(false);
        fetchCombos();
      } else {
        setErrorMsg(data.error || 'Erro ao salvar combo.');
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
            <Flame className="w-6 h-6 text-amber-400" />
            Combos Promocionais
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Crie pacotes especiais de atrações com desconto para aumentar a conversão de orçamentos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 text-white font-bold text-xs tracking-wide shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Combo</span>
        </button>
      </div>

      {/* Grid of combos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-20 text-center">
            <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mx-auto" />
          </div>
        ) : (
          combos.map((combo) => (
            <div
              key={combo.id}
              className={`rounded-2xl p-5 border glass-panel transition-all flex flex-col justify-between ${
                combo.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Image */}
                <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                  {combo.imageUrl ? (
                    <Image
                      src={combo.imageUrl}
                      alt={combo.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Flame className="w-6 h-6" />
                    </div>
                  )}

                  {combo.badgeText && (
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white text-[10px] font-bold tracking-wide shadow">
                      {combo.badgeText}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleActive(combo)}
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md ${
                      combo.isActive
                        ? 'bg-emerald-500/80 text-white'
                        : 'bg-black/80 text-slate-400'
                    }`}
                  >
                    {combo.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">{combo.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                    {combo.description}
                  </p>
                </div>

                {/* Items checklist */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Itens Inclusos:
                  </span>
                  {(combo.includedItems || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Price */}
                <div className="pt-2 flex items-baseline justify-between">
                  <div>
                    {combo.regularPrice > combo.promoPrice && (
                      <span className="text-xs text-slate-400 line-through block">
                        De {formatCurrencyBRL(combo.regularPrice)}
                      </span>
                    )}
                    <span className="text-lg font-black text-white">
                      {formatCurrencyBRL(combo.promoPrice)}
                    </span>
                  </div>
                  <span className="text-xs text-cyan-300 font-semibold">
                    {combo.durationHours}h show
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(combo)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(combo.id)}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && editingCombo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{editingCombo.id ? 'Editar Combo' : 'Novo Combo Promocional'}</span>
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
                <label className="font-semibold text-slate-300">Nome do Combo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combo Master: Robô + Cilindro + Gerb"
                  value={editingCombo.name || ''}
                  onChange={(e) => setEditingCombo({ ...editingCombo, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Preço Regular (R$)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={editingCombo.regularPrice || 0}
                    onChange={(e) =>
                      setEditingCombo({ ...editingCombo, regularPrice: parseFloat(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Preço Promo (R$) *</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={editingCombo.promoPrice || 0}
                    onChange={(e) =>
                      setEditingCombo({ ...editingCombo, promoPrice: parseFloat(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Duração (h)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={editingCombo.durationHours || 1.0}
                    onChange={(e) =>
                      setEditingCombo({ ...editingCombo, durationHours: parseFloat(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Texto do Selo / Destaque</label>
                <input
                  type="text"
                  placeholder="Ex: Mais Escolhido, 15% OFF"
                  value={editingCombo.badgeText || ''}
                  onChange={(e) =>
                    setEditingCombo({ ...editingCombo, badgeText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              {/* Image Upload Field */}
              <ImageUploadField
                label="Imagem do Combo Promocional"
                value={editingCombo.imageUrl || ''}
                onChange={(newUrl) => setEditingCombo({ ...editingCombo, imageUrl: newUrl })}
              />

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Descrição Comercial</label>
                <textarea
                  rows={2}
                  value={editingCombo.description || ''}
                  onChange={(e) =>
                    setEditingCombo({ ...editingCombo, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium resize-none"
                />
              </div>

              {/* Included items checklist manager */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                <label className="font-semibold text-slate-300 block">Itens Inclusos no Pacote:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar item (Ex: Robô de LED 1h, Cilindro...)"
                    value={newItemInput}
                    onChange={(e) => setNewItemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs shrink-0"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {(editingCombo.includedItems || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCombo.isActive ?? true}
                    onChange={(e) =>
                      setEditingCombo({ ...editingCombo, isActive: e.target.checked })
                    }
                    className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span className="font-medium text-slate-300">Combo Ativo na Cotação</span>
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
                      <span>Salvar Combo</span>
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
