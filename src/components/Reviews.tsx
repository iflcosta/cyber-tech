"use client";
import { useState, useEffect } from 'react';
import { Star, MessageSquareQuote, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Review {
    id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [voucherCode, setVoucherCode] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews() {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

        if (data) setReviews(data);
        setLoading(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitLoading(true);

        // 1. Validar Voucher no Supabase
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('id, status')
            .eq('voucher_code', voucherCode.toUpperCase())
            .single();

        if (leadError || !lead) {
            setError('Código de Voucher não encontrado. Verifique se digitou corretamente.');
            setSubmitLoading(false);
            return;
        }

        // 2. Verificar se o status é convertido/finalizado (pode ser 'converted' ou 'ready' etc)
        // O usuário quer que apenas quem finalizou avalie.
        const validStatuses = ['converted', 'ready', 'finalizado', 'concluido'];
        if (!validStatuses.includes(lead.status)) {
            setError('Seu pedido ainda não foi finalizado. Você poderá avaliar assim que o serviço for concluído!');
            setSubmitLoading(false);
            return;
        }

        // 3. Enviar Review
        const { error: reviewError } = await supabase
            .from('reviews')
            .insert({
                lead_id: lead.id,
                voucher_code: voucherCode.toUpperCase(),
                user_name: name,
                rating,
                comment,
                is_approved: false // Requer moderação do Admin
            });

        if (reviewError) {
            if (reviewError.code === '23505') {
                setError('Este voucher já foi utilizado para uma avaliação.');
            } else {
                setError('Erro ao enviar avaliação. Tente novamente mais tarde.');
            }
        } else {
            setSuccess(true);
            setTimeout(() => {
                setShowForm(false);
                setSuccess(false);
                setName('');
                setComment('');
                setVoucherCode('');
            }, 3000);
        }

        setSubmitLoading(false);
    };

    return (
        <section className="py-12 md:py-24 bg-black/50 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
                    <div>
                        <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
                            O QUE DIZEM NOSSOS <span className="text-blue-500">CLIENTES</span>
                        </h2>
                        <p className="text-white/40 max-w-xl">
                            Depoimentos reais de quem já utilizou nossos serviços. A transparência é a nossa base.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        DEIXAR MEU DEPOIMENTO
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        {reviews.length > 0 ? reviews.map((review) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                key={review.id}
                                className="glass p-8 rounded-3xl border-white/5 relative group h-full flex flex-col"
                            >
                                <div className="absolute top-6 right-8 text-blue-500/20 group-hover:text-blue-500/40 transition-colors">
                                    <MessageSquareQuote size={48} />
                                </div>
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"} />
                                    ))}
                                </div>
                                <p className="text-white/70 italic mb-6 flex-1">"{review.comment}"</p>
                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                    <span className="font-bold text-white uppercase text-sm">{review.user_name}</span>
                                    <span className="text-[10px] text-white/30 uppercase font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="md:col-span-3 text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-white/20 italic">
                                Nenhuma avaliação aprovada no momento. Seja o primeiro!
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Avaliação */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass w-full max-w-lg rounded-3xl overflow-hidden border-white/20 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowForm(false)}
                                className="absolute top-6 right-6 text-white/40 hover:text-white"
                            >
                                <X size={24} />
                            </button>

                            <div className="p-10">
                                {success ? (
                                    <div className="text-center py-10">
                                        <div className="flex justify-center mb-6 text-green-500">
                                            <CheckCircle2 size={64} />
                                        </div>
                                        <h3 className="text-2xl font-black mb-2 uppercase italic">Avaliação Enviada!</h3>
                                        <p className="text-white/40">Seu depoimento passará por uma rápida moderação e em breve estará no ar. Obrigado!</p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-black mb-2 uppercase italic">SUA <span className="text-blue-500">OPINIÃO</span> É TUDO</h3>
                                        <p className="text-white/40 text-sm mb-8">Precisamos do seu código do voucher para validar que você realmente utilizou nossos serviços.</p>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block text-left">Código do Voucher</label>
                                                <input required value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Ex: BPC-XXXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none uppercase font-mono" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block text-left">Seu Nome</label>
                                                    <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamado?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block text-left">Nota (1 a 5)</label>
                                                    <div className="flex gap-2 h-12 items-center bg-white/5 rounded-xl border border-white/10 px-4">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <button
                                                                key={star}
                                                                type="button"
                                                                onClick={() => setRating(star)}
                                                                className={`transition-colors ${star <= rating ? 'text-yellow-500' : 'text-white/10'}`}
                                                            >
                                                                <Star size={20} fill={star <= rating ? 'currentColor' : 'none'} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block text-left">Depoimento</label>
                                                <textarea required value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Conte como foi sua experiência conosco..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none h-32" />
                                            </div>

                                            {error && (
                                                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                                                    <AlertCircle size={16} /> {error}
                                                </div>
                                            )}

                                            <button
                                                disabled={submitLoading}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 mt-4 uppercase italic"
                                            >
                                                {submitLoading ? <Loader2 className="animate-spin" size={20} /> : 'ENVIAR MINHA AVALIAÇÃO'}
                                            </button>
                                        </form>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}

// Extra icons
function X({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}
