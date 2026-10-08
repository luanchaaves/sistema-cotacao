'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { CharacterItem } from '@/lib/types';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

export default function AdminCharactersPage() {
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Partial<CharacterItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/characters');
      const data = await res.json();
      if (res.ok) {
        setCharacters(data.characters || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleOpenCreate = () => {
    setEditingCharacter({
      name: '',
      slug: '',
      category: 'Infantil',
      imageUrl: '/images/homem-aranha.png',
      isActive: true,
      order: characters.length,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (char: CharacterItem) => {
    setEditingCharacter({ ...char });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleToggleActive = async (char: CharacterItem) => {
    try {
      const res = await fetch('/api/admin/characters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: char.id, isActive: !char.isActive }),
      });
      if (res.ok) {
        setCharacters((prev) =>
          prev.map((c) => (c.id === char.id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este personagem?')) return;
    try {
      const res = await fetch(`/api/admin/characters?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCharacters((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCharacter) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const isEdit = Boolean(editingCharacter.id);
      const res = await fetch('/api/admin/characters', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCharacter),
      });

      const data = await res.json();
      if (res.ok && data.character) {
        setModalOpen(false);
        fetchCharacters();
      } else {
        setErrorMsg(data.error || 'Erro ao salvar personagem.');
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
            <Users className="w-6 h-6 text-fuchsia-400" />
            Personagens Vivos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie o catálogo de personagens disponíveis para seleção na categoria Personagens e Combos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs tracking-wide shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Personagem</span>
        </button>
      </div>

      {/* Grid of characters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 py-20 text-center">
            <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mx-auto" />
          </div>
        ) : (
          characters.map((char) => (
            <div
              key={char.id}
              className={`rounded-2xl p-3.5 border glass-panel transition-all flex flex-col justify-between ${
                char.isActive ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                  {char.imageUrl ? (
                    <Image
                      src={char.imageUrl}
                      alt={char.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <Users className="w-8 h-8" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(char)}
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md ${
                      char.isActive
                        ? 'bg-emerald-500/80 text-white'
                        : 'bg-black/80 text-slate-400'
                    }`}
                  >
                    {char.isActive ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                <div>
                  <span className="font-bold text-sm text-white block truncate">{char.name}</span>
                  <span className="text-[11px] text-slate-400 block truncate">{char.category}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(char)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(char.id)}
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
      {modalOpen && editingCharacter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#10121d] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-fuchsia-400" />
                <span>{editingCharacter.id ? 'Editar Personagem' : 'Novo Personagem'}</span>
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
                <label className="font-semibold text-slate-300">Nome do Personagem *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Homem-Aranha, Mickey, Sonic..."
                  value={editingCharacter.name || ''}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Categoria / Tema</label>
                <input
                  type="text"
                  placeholder="Ex: Infantil, Super-Heróis, Filmes & Séries..."
                  value={editingCharacter.category || ''}
                  onChange={(e) =>
                    setEditingCharacter({ ...editingCharacter, category: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl font-medium"
                />
              </div>

              {/* Image Upload Field */}
              <ImageUploadField
                label="Imagem do Personagem"
                value={editingCharacter.imageUrl || ''}
                onChange={(newUrl) =>
                  setEditingCharacter({ ...editingCharacter, imageUrl: newUrl })
                }
              />

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCharacter.isActive ?? true}
                    onChange={(e) =>
                      setEditingCharacter({ ...editingCharacter, isActive: e.target.checked })
                    }
                    className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span className="font-medium text-slate-300">Personagem Ativo</span>
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
                      <span>Salvar</span>
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
