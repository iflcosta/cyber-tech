'use client';

import { useState } from 'react';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepLogged, setKeepLogged] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createCRMBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
      return;
    }

    window.location.href = '/admin/os';
  }

  return (
    <form onSubmit={onSubmit} className="border-2 border-zinc-950 bg-white p-6">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-700"
          >
            E-mail Operacional
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full border border-zinc-950 bg-zinc-50 px-3 py-2.5 font-mono text-sm text-zinc-950 placeholder-zinc-400 focus:bg-white focus:outline-none"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-700"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete={keepLogged ? 'current-password' : 'off'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 block w-full border border-zinc-950 bg-zinc-50 px-3 py-2.5 font-mono text-sm text-zinc-950 placeholder-zinc-400 focus:bg-white focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 font-mono text-xs text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={keepLogged}
            onChange={(e) => setKeepLogged(e.target.checked)}
            className="h-4 w-4 border border-zinc-950 accent-zinc-950"
          />
          Manter sessão ativa neste terminal
        </label>
        {error && (
          <p className="border border-zinc-950 bg-zinc-100 p-2.5 font-mono text-xs font-bold text-zinc-950">
            [ERRO] {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-950 px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? 'Autenticando…' : 'Acessar Painel ERP →'}
        </button>
      </div>
    </form>
  );
}
