'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { UploadCloud, Image as ImageIcon, Trash2, Link as LinkIcon, Check, Loader2 } from 'lucide-react';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (newValue: string) => void;
  aspectRatio?: 'video' | 'square' | 'banner';
}

export function ImageUploadField({
  label = 'Imagem da Atração / Combo',
  value,
  onChange,
  aspectRatio = 'video',
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Resize and compress client-side to ensure high performance and persistence
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    setProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChange(dataUrl);
        }
        setProcessing(false);
      };
      img.onerror = () => {
        setProcessing(false);
        alert('Erro ao carregar imagem.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-fuchsia-400" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-slate-400 hover:text-fuchsia-300 flex items-center gap-1 underline transition-all"
        >
          <LinkIcon className="w-2.5 h-2.5" />
          <span>{showUrlInput ? 'Ocultar URL' : 'Digitar URL / Caminho'}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop & Preview Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-3 transition-all flex flex-col items-center justify-center text-center ${
          isDragging
            ? 'border-fuchsia-500 bg-fuchsia-500/10'
            : value
            ? 'border-white/10 bg-black/40'
            : 'border-white/15 bg-black/20 hover:border-white/30 hover:bg-black/30'
        }`}
      >
        {processing ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Otimizando e carregando imagem...</span>
          </div>
        ) : value ? (
          <div className="w-full flex flex-col sm:flex-row items-center gap-4">
            {/* Thumbnail Preview */}
            <div className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-900 border border-white/15 shrink-0 shadow-md">
              <Image
                src={value}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized={value.startsWith('data:')}
              />
            </div>

            {/* Actions */}
            <div className="flex-1 flex flex-col items-start gap-2 w-full">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Imagem anexada com sucesso
              </span>
              <p className="text-[10px] text-slate-400 truncate max-w-full">
                {value.startsWith('data:') ? 'Arquivo anexado do computador/celular' : value}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Trocar Imagem</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="py-6 px-4 cursor-pointer flex flex-col items-center justify-center gap-2 group w-full"
          >
            <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors block">
                Clique para anexar imagem ou arraste aqui
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Formatos suportados: PNG, JPG ou WebP (tamanho livre)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Manual URL Input Fallback */}
      {showUrlInput && (
        <div className="pt-1 space-y-1">
          <input
            type="text"
            placeholder="Ex: /images/robo-hero.png ou https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl font-mono text-[11px] bg-black/40 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-fuchsia-500"
          />
        </div>
      )}
    </div>
  );
}
