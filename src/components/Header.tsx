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
        <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
          <div className="relative w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-300">
            <Image
              src="/images/logo-white.png"
              alt="Robô LED Partner"
              width={52}
              height={52}
              className="object-contain w-full h-full filter drop-shadow-[0_0_8px_rgba(255,255,255,0.25)]"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base sm:text-lg tracking-wider text-white flex items-center gap-1.5">
              ROBÔ LED <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">PARTNER</span>
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 tracking-wide font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              <span>Atrações & Personagens para Eventos</span>
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
