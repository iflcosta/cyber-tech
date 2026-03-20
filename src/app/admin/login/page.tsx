"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Verifica se já está logado
        async function checkSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push('/admin');
            }
        }
        checkSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
            setLoading(false);
        } else {
            router.push('/admin');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] -z-10 rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass w-full max-w-md p-8 md:p-12 rounded-[40px] border-white/10 shadow-2xl relative"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(192,192,192,0.15)]">
                        <Lock className="text-[var(--accent-primary)]" size={32} />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">
                        Cyber <span className="text-[var(--accent-primary)]">Access</span>
                    </h1>
                    <p className="text-white/80 mt-2 text-sm font-medium">Área Restrita Administrativa</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 flex items-center gap-3 text-sm"
                    >
                        <ShieldAlert size={18} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/90 ml-4">E-mail Administrativo</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@cybertech.com"
                                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[var(--accent-primary)]/50 transition-all font-bold group-hover:bg-white/[0.15] text-white placeholder:text-white/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/90 ml-4">Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[var(--accent-primary)]/50 transition-all font-bold group-hover:bg-white/[0.15] text-white placeholder:text-white/30"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        type="submit"
                        className="w-full bg-white hover:bg-slate-200 text-[#121216] font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>ACESSAR SISTEMA</>
                        )}
                    </button>
                </form>

                <p className="text-center text-white/40 text-xs mt-10 font-bold uppercase tracking-widest">
                    Authorized Personnel Only
                </p>
            </motion.div>
        </div>
    );
}
