"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, MessageSquareQuote, CheckCircle2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from './ui/Button';

interface Review {
    id: string;
    client_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newReview, setNewReview] = useState({ name: '', comment: '', rating: 5, voucher: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showAll, setShowAll] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        fetchReviews();
        
        // Capturar parâmetros da URL
        const voucher = searchParams.get('voucher');
        const nome = searchParams.get('nome');
        const avaliar = searchParams.get('avaliar');

        if (avaliar === 'true' || voucher) {
            setNewReview(prev => ({
                ...prev,
                voucher: voucher || prev.voucher,
                name: nome || prev.name
            }));
            setIsModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Erro ao carregar reviews do Supabase.');
                setReviews([]);
            } else {
                setReviews(data || []);
            }
        } catch (err) {
            console.error('Erro ao carregar reviews:', err);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            // Formatar o voucher para garantir o padrão (opcional)
            const voucherCode = newReview.voucher.trim().toUpperCase();

            // 1. Validar se o voucher existe
            const { data: leadData, error: leadError } = await supabase
                .from('leads')
                .select('id')
                .eq('voucher_code', voucherCode)
                .single();

            if (leadError || !leadData) {
                setMessage({ type: 'error', text: 'Código de voucher inválido ou não encontrado.' });
                setSubmitting(false);
                return;
            }

            // 2. Validar se a avaliação já existe para este voucher
            const { data: existingReview } = await supabase
                .from('reviews')
                .select('id')
                .eq('voucher_code', voucherCode)
                .maybeSingle();

            if (existingReview) {
                setMessage({ type: 'error', text: 'Já existe uma avaliação com este código de voucher.' });
                setSubmitting(false);
                return;
            }

            // 3. Inserir a avaliação
            const { error } = await supabase
                .from('reviews')
                .insert([{
                    client_name: newReview.name,
                    comment: newReview.comment,
                    rating: newReview.rating,
                    voucher_code: voucherCode,
                    is_approved: false
                }]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Avaliação enviada com sucesso! Ela será exibida após moderação.' });
            setNewReview({ name: '', comment: '', rating: 5, voucher: '' });
            setTimeout(() => setIsModalOpen(false), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Erro ao enviar avaliação. Tente novamente mais tarde.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="reviews" className="py-24 bg-[var(--bg-primary)] border-y border-[var(--border-subtle)] relative overflow-hidden red-line-top">
            <div className="absolute inset-0 hero-texture opacity-30" />
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                    <div>
                        <div className="text-[10px] font-mono text-[var(--accent-primary)] uppercase tracking-[0.4em] font-black mb-4 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-[var(--accent-primary)]" /> REPUTAÇÃO E CONFIANÇA
                        </div>
                        <h2 className="text-4xl md:text-7xl font-display font-bold mb-4 tracking-tight text-[var(--text-primary)] leading-none uppercase chrome-text">
                            FEEDBACK DOS <br />
                            <span className="opacity-40 italic">CLIENTES</span>
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-xl text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                            A satisfação de quem confia na Cyber Informática para seus setups mais críticos.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary px-10 py-5 text-sm"
                    >
                        DEIXAR MINHA AVALIAÇÃO
                    </button>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-[var(--text-muted)]" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {(showAll ? reviews : reviews.slice(0, 6)).map((review) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                key={review.id}
                                className="card-dark bg-[var(--bg-surface)] p-10 rounded-xl border border-[var(--border-subtle)] relative group h-full flex flex-col hover:border-[var(--accent-primary)] transition-all"
                            >
                                <div className="absolute top-8 right-10 text-[var(--accent-primary)]/5 group-hover:text-[var(--accent-primary)]/10 transition-colors">
                                    <MessageSquareQuote size={56} />
                                </div>
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < review.rating ? "text-[var(--accent-primary)] fill-[var(--accent-primary)]" : "text-[var(--text-muted)] fill-[var(--text-muted)]"} />
                                    ))}
                                </div>
                                <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-8 flex-1 italic">"{review.comment}"</p>
                                <div className="pt-8 border-t border-[var(--border-subtle)] flex items-center justify-between">
                                    <span className="font-display font-bold text-[var(--text-primary)] uppercase tracking-tight">{review.client_name}</span>
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest">{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                            </motion.div>
                        ))}
                        {reviews.length === 0 && (
                            <div className="md:col-span-3 text-center py-24 bg-[var(--bg-secondary)] rounded-lg border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]">
                                Nenhuma avaliação aprovada no momento. Seja o primeiro!
                            </div>
                        )}
                    </div>

                    {!showAll && reviews.length > 6 && (
                        <div className="mt-16 text-center">
                            <button 
                                onClick={() => setShowAll(true)}
                                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors group"
                            >
                                <span className="w-12 h-[1px] bg-[var(--border-subtle)] group-hover:bg-[var(--accent-primary)] transition-colors" />
                                CARREGAR MAIS CLIENTES
                                <ChevronDown size={14} className="group-hover:translate-y-1 transition-transform" />
                                <span className="w-12 h-[1px] bg-[var(--border-subtle)] group-hover:bg-[var(--accent-primary)] transition-colors" />
                            </button>
                        </div>
                    )}
                    </>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card-dark bg-[var(--bg-surface)] w-full max-w-xl p-10 rounded-2xl border border-[var(--border-subtle)] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="absolute inset-0 hero-texture opacity-30 pointer-events-none" />
                            <h3 className="text-3xl font-display font-bold text-[var(--text-primary)] uppercase tracking-tight mb-8 relative z-10 chrome-text">SUA AVALIAÇÃO</h3>

                            {message.text ? (
                                <div className={cn(
                                    "p-6 mb-8 rounded-[2px] border flex items-center gap-4 text-xs font-bold uppercase tracking-widest",
                                    message.type === 'success' ? "bg-green-950/50 border-green-900/50 text-green-400" : "bg-red-950/50 border-red-900/50 text-red-400"
                                )}>
                                    {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
                                    {message.text}
                                </div>
                            ) : null}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative z-10">
                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Código do Voucher</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Digite o código (ex: BPC-XXXX)"
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium placeholder:opacity-20 uppercase"
                                        value={newReview.voucher}
                                        onChange={(e) => setNewReview({ ...newReview, voucher: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="relative z-10">
                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Como devemos te chamar?</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Seu nome"
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium placeholder:opacity-20"
                                        value={newReview.name}
                                        onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                                    />
                                </div>

                                <div className="relative z-10">
                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Nota (1 a 5 estrelas)</label>
                                    <div className="flex gap-4 p-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                className="transition-transform active:scale-90"
                                            >
                                                <Star
                                                    size={32}
                                                    className={cn(
                                                        "transition-colors",
                                                        star <= newReview.rating ? "text-[var(--accent-primary)] fill-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Seu Depoimento</label>
                                    <textarea
                                        required
                                        placeholder="Conte como foi sua experiência conosco..."
                                        rows={4}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-6 py-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all font-medium placeholder:opacity-20 resize-none"
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4 relative z-10">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsModalOpen(false);
                                        }}
                                        className="btn-ghost flex-1 py-5"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary flex-1 py-5 disabled:opacity-40 disabled:grayscale"
                                    >
                                        {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'ENVIAR AGORA'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
