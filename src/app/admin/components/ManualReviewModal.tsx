'use client';
import { useState } from 'react';
import { X, Star, RefreshCw, Send, CheckCircle2, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateVoucherCode } from '@/lib/voucher';

interface ManualReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ManualReviewModal({ isOpen, onClose, onSuccess }: ManualReviewModalProps) {
    const [clientName, setClientName] = useState('');
    const [voucher, setVoucher] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleGenerateVoucher = () => {
        setVoucher(generateVoucherCode());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Para que a avaliação funcione, precisamos que o voucher exista no banco (leads ou maintenance_orders)
            // Vamos inserir como um lead convertido para manter a simplicidade e integridade
            const { error } = await supabase.from('leads').insert({
                client_name: clientName,
                whatsapp: whatsapp || null,
                voucher_code: voucher.toUpperCase(),
                interest_type: 'venda_fisica',
                status: 'converted',
                converted_at: new Date().toISOString(),
                marketing_source: 'direto'
            });

            if (error) throw error;

            const message = `Olá ${clientName || 'amigo'}, tudo bem? Aqui é o Iago da Cyber Informática. Passando para saber se o seu aparelho está funcionando perfeitamente e se ficou satisfeito com o serviço!\nAcabamos de inaugurar nosso novo site e sua opinião seria muito importante para nós. Poderia dedicar 30 segundos para deixar uma avaliação sobre o seu atendimento?\n\nLink para avaliar: https://cyber-tech-seven.vercel.app/?avaliar=true&nome=${encodeURIComponent(clientName)}&voucher=${voucher.toUpperCase()}`;
            
            setGeneratedLink(message);
            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Erro ao gerar link manual:', err);
            alert('Erro ao salvar no banco de dados. Verifique a conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
        alert('Mensagem copiada para a área de transferência!');
    };

    const handleOpenWhatsApp = () => {
        const phone = whatsapp.replace(/\D/g, '');
        const encodedMsg = encodeURIComponent(generatedLink);
        window.open(`https://wa.me/55${phone}?text=${encodedMsg}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden relative shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-display font-black uppercase italic italic tracking-tighter flex items-center gap-2">
                            <Star className="text-yellow-500 fill-yellow-500" size={24} /> Gerar Avaliação Manual
                        </h2>
                        <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Para clientes físicos / balcão</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-white/40" />
                    </button>
                </div>

                <div className="p-8">
                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Nome do Cliente</label>
                                <input
                                    required
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-yellow-500/50 transition-all text-white placeholder:text-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">WhatsApp (Opcional)</label>
                                <input
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    placeholder="Ex: 11999999999"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono outline-none focus:border-yellow-500/50 transition-all text-white placeholder:text-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Voucher de Identificação</label>
                                <div className="flex gap-2">
                                    <input
                                        required
                                        value={voucher}
                                        onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                                        placeholder="BPC-XXXX"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono font-bold outline-none focus:border-yellow-500/50 transition-all text-yellow-500 placeholder:text-white/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateVoucher}
                                        className="px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all group"
                                        title="Gerar Voucher Aleatório"
                                    >
                                        <RefreshCw size={20} className="text-white/40 group-hover:text-yellow-500 transition-colors" />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-display font-black uppercase tracking-widest text-xs py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                GERAR LINK E SALVAR NO BANCO
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-8 py-4">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold">Link Pronto!</h3>
                                <p className="text-sm text-[var(--text-muted)]">O voucher <span className="text-yellow-500 font-mono font-bold">{voucher}</span> foi validado.</p>
                            </div>

                            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                                <p className="text-[10px] text-white/60 leading-relaxed italic">
                                    {generatedLink}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={handleOpenWhatsApp}
                                    className="w-full bg-[#25D366] hover:bg-[#22c35e] text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={16} /> ENVIAR VIA WHATSAPP
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Copy size={16} /> COPIAR MENSAGEM
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setSuccess(false);
                                    setClientName('');
                                    setVoucher('');
                                    setWhatsapp('');
                                }}
                                className="w-full text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] hover:text-white transition-colors"
                            >
                                ← Gerar outro link
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
