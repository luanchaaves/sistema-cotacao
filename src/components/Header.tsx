'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { CompanySetting } from '@/lib/types';

interface HeaderProps {
  setting?: Partial<CompanySetting> | null;
}

export function Header({ setting }: HeaderProps) {
  const whatsappPhone = setting?.whatsappPhone || '5511919973647';
  const instagramUrl = setting?.instagramUrl || 'https://www.instagram.com/roboledpartner/';

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 bg-[#090a10]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-600/30 to-purple-900/40 p-1 border border-fuchsia-500/30 flex items-center justify-center shadow-lg group-hover:border-fuchsia-500/60 transition-all">
            <Image
              src="/images/logo-header.png"
              alt="Robô LED Partner"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
              ROBÔ LED <span className="text-fuchsia-400">PARTNER</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            </span>
            <span className="text-xs text-slate-400 tracking-wide font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              Experiências & Atrações para Eventos
            </span>
          </div>
        </Link>

        {/* Quick Social & Admin Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all text-xs font-medium flex items-center gap-1.5"
            title="Siga no Instagram"
          >
            <InstagramIcon className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Instagram</span>
          </a>

          <a
            href={`https://api.whatsapp.com/send/?phone=${whatsappPhone}&type=phone_number&app_absent=0`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
}
