'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Users,
  Flame,
  CircleDollarSign,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Menu,
  X,
  Loader2,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setUser(data.user);
        } else {
          router.push('/admin/login');
        }
      } catch (err) {
        console.error(err);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Orçamentos', href: '/admin/orcamentos', icon: FileSpreadsheet },
    { label: 'Agenda & Datas', href: '/admin/agenda', icon: Calendar },
    { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
    { label: 'Serviços & Atrações', href: '/admin/servicos', icon: Sparkles },
    { label: 'Personagens Vivos', href: '/admin/personagens', icon: Users },
    { label: 'Combos Promocionais', href: '/admin/combos', icon: Flame },
    { label: 'Pedágios', href: '/admin/pedagios', icon: CircleDollarSign },
  ];

  return (
    <div className="min-h-screen bg-[#090a10] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-[#090a10]/95 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-purple-950/60 p-0.5 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
            <Image src="/images/logo-official.png" alt="Logo" width={32} height={32} className="object-contain" />
          </div>
          <span className="font-extrabold text-sm text-white">ROBÔ LED <span className="text-fuchsia-400">ADMIN</span></span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/5 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-white/10 p-5 flex flex-col justify-between bg-[#0b0d16] transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-purple-950/80 to-black p-1 border border-fuchsia-500/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(246,53,244,0.3)]">
              <Image src="/images/logo-official.png" alt="Robô LED Partner" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-wider block">
                ROBÔ LED <span className="text-fuchsia-400">ADMIN</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">Gestão Comercial</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Cotação Online</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">Site</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
