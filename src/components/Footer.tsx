'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Globe, MessageCircle, Shield } from 'lucide-react';
import { InstagramIcon } from '@/components/InstagramIcon';
import { CompanySetting } from '@/lib/types';

interface FooterProps {
  setting?: Partial<CompanySetting> | null;
}

export function Footer({ setting }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const whatsappPhone = setting?.whatsappPhone || '5511919973647';
  const instagramUrl = setting?.instagramUrl || 'https://www.instagram.com/roboledpartner/';
  const linktreeUrl = setting?.linktreeUrl || 'https://linktr.ee/roboledpartner';
  const cityOrigin = setting?.originCity || 'São Bernardo do Campo';
  const stateOrigin = setting?.originState || 'SP';

  return (
    <footer className="w-full bg-[#07070b] border-t border-white/5 py-12 px-4 sm:px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand statement */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-wider">ROBÔ LED PARTNER</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 font-medium">
              Eventos & Shows
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            Transformando casamentos, formaturas, aniversários e eventos corporativos em momentos inesquecíveis.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Base Operacional: {cityOrigin} - {stateOrigin}</span>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-pink-400 transition-colors"
          >
            <InstagramIcon className="w-4 h-4 text-pink-400" />
            <span>Instagram</span>
          </a>

          <a
            href={`https://api.whatsapp.com/send/?phone=${whatsappPhone}&type=phone_number&app_absent=0`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Comercial</span>
          </a>

          <a
            href={linktreeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Linktree Oficial</span>
          </a>

          <Link
            href="/admin"
            className="flex items-center gap-1 hover:text-slate-200 transition-colors text-slate-400"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Painel Admin</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <span>&copy; {currentYear} Robô LED Partner. Todos os direitos reservados.</span>
        <span>Sistema de Cotação Automática Comercial</span>
      </div>
    </footer>
  );
}
