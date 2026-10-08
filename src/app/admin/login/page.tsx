'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@roboledpartner.com.br');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a10] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glowing circles */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-950/80 to-black p-2 border border-fuchsia-500/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(246,53,244,0.35)]">
            <Image
              src="/images/logo-official.png"
              alt="Robô LED Partner"
              width={72}
              height={72}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider flex items-center justify-center gap-1.5">
            ROBÔ LED <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">PARTNER</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Painel Administrativo & Gestão de Cotações</p>
        </div>

        {/* Login Box */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl bg-[#10121d]/90">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-fuchsia-400" />
                Email do Administrador
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@roboledpartner.com.br"
                className="w-full px-4 py-3 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-fuchsia-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Acessando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hint */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center text-[11px] text-slate-400">
            <span>Acesso Padrão: </span>
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-slate-300">admin@roboledpartner.com.br</code>
            <span> / </span>
            <code className="bg-white/5 px-1.5 py-0.5 rounded text-slate-300">admin123</code>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Voltar para o Gerador de Cotação
          </Link>
        </div>
      </div>
    </div>
  );
}
