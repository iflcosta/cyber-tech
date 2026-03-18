"use client";

import { useState } from "react";
import { Search, Loader2, Package, Clock, CheckCircle2, AlertCircle, QrCode, Copy, CreditCard, Laptop, Smartphone, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { brand } from "@/lib/brand";

const statusSteps = [
    { id: 'pending', label: 'Recebido', icon: Package },
    { id: 'analyzing', label: 'Análise', icon: Search },
    { id: 'in_progress', label: 'Reparo', icon: Clock },
    { id: 'testing', label: 'Testes', icon: CheckCircle2 },
    { id: 'ready', label: 'Pronto', icon: CheckCircle2 },
];

export default function ServiceSearch() {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [copiedPix, setCopiedPix] = useState(false);

    // Mapeamento Unificado de Status para os 5 passos da UI
    const unifiedStatusMap: Record<string, string> = {
        // Status Comuns e de Manutenção
        'pending': 'pending',
        'analysis': 'analyzing',
        'parts': 'analyzing',
        'maintenance': 'in_progress',
        'testing': 'testing',
        'ready': 'ready',
        'converted': 'ready',
        // Status de Vendas/Leads
        'separating': 'analyzing',
        'building': 'in_progress',
        'shipping': 'testing'
    };

    const formatDate = (dateString: any) => {
        if (!dateString) return 'Informação indisponível';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Informação indisponível';
            return date.toLocaleString('pt-BR');
        } catch {
            return 'Informação indisponível';
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const searchId = orderId.trim().toUpperCase();
        if (!searchId) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // 1. Tenta buscar em manutenção
            const { data: maintenanceData } = await supabase
                .from('maintenance_orders')
                .select('*')
                .eq('order_id', searchId)
                .single();

            if (maintenanceData) {
                setResult({
                    ...maintenanceData,
                    id: maintenanceData.order_id,
                    customer_name: maintenanceData.customer_name,
                    type: 'maintenance',
                    status: unifiedStatusMap[maintenanceData.status] || 'pending',
                    display_status: maintenanceData.status,
                    description: maintenanceData.problem_description || maintenanceData.description,
                    updated_at: maintenanceData.updated_at || maintenanceData.created_at
                });
                return;
            }

            // 2. Tenta buscar em leads (vouchers/vendas)
            const { data: leadData } = await supabase
                .from('leads')
                .select('*')
                .eq('voucher_code', searchId)
                .single();

            if (leadData) {
                setResult({
                    ...leadData,
                    id: leadData.voucher_code,
                    customer_name: leadData.client_name,
                    type: leadData.interest_type,
                    status: unifiedStatusMap[leadData.status] || 'pending',
                    display_status: leadData.status,
                    description: leadData.description || "Pedido em processamento.",
                    updated_at: leadData.updated_at || leadData.created_at,
                    payment_info: leadData.payment_info || (leadData.payment_status === 'awaiting_payment' ? {
                        pixCode: '00020126360014br.gov.bcb.pix0114+55119999999995204000053039865802BR5915Nexus Tech6009Sao Paulo62070503***6304A1B2',
                        checkoutUrl: '#'
                    } : null)
                });
                return;
            }

            setError('Pedido não encontrado.');
        } catch (err) {
            console.error("Erro na busca:", err);
            setError('Pedido não encontrado. Verifique o código e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const currentStatusIdx = result ? statusSteps.findIndex(s => s.id === result.status) : -1;
    const paymentInfo = result?.payment_info;

    return (
        <section id="consultar-status" className="py-24 bg-[var(--bg-primary)] border-y border-[var(--border-subtle)]">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-7xl font-display font-bold mb-6 tracking-tight text-[var(--text-primary)] leading-none uppercase">
                        RASTREIO DE <br />
                        <span className="opacity-40 italic">MANUTENÇÃO</span>
                    </h2>
                    <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                        Acompanhe o status do seu equipamento em tempo real com transparência total e segurança digital.
                    </p>
                </div>

                <div className="bg-[var(--bg-surface)] p-10 rounded-xl border border-[var(--border-subtle)] shadow-xl mb-12 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--chrome-light)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                            <input
                                type="text"
                                placeholder="CÓDIGO DO PEDIDO OU VOUCHER..."
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg py-4 pl-12 pr-4 text-[var(--text-primary)] font-display font-bold uppercase tracking-tight focus:outline-none focus:border-[var(--accent-primary)] transition-all placeholder:opacity-30"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !orderId.trim()}
                            className="btn-primary px-8 py-4 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                            CONSULTAR
                        </button>
                    </form>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-6 bg-red-50 border border-red-100 text-red-600 rounded-[2px] flex items-center gap-3 text-xs font-bold uppercase tracking-widest">
                            <AlertCircle size={20} /> {error}
                        </motion.div>
                    )}
                </div>

                <AnimatePresence>
                    {result && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--bg-surface)] p-10 rounded-xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--accent-primary)]" />
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-[var(--border-subtle)] pb-8">
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">
                                        {result.type === 'maintenance' ? 'ORDEM DE SERVIÇO' : 'CÓDIGO DO PEDIDO'}
                                    </div>
                                    <h3 className="text-3xl font-display font-bold text-[var(--text-primary)] uppercase tracking-tight chrome-text">{result.id}</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">CLIENTE</div>
                                    <div className="text-sm font-bold text-[var(--text-primary)] uppercase mb-2">{result.customer_name}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">ÚLTIMA ATUALIZAÇÃO</div>
                                    <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                                        {formatDate(result.updated_at)}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-16 relative">
                                <div className="absolute top-5 left-0 w-full h-[1px] bg-[var(--border-subtle)] hidden md:block" />
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 relative z-10">
                                    {statusSteps.map((step, idx) => {
                                        const Icon = step.icon;
                                        const isActive = idx <= currentStatusIdx;
                                        const isCurrent = idx === currentStatusIdx;

                                        return (
                                            <div key={step.id} className="flex flex-col items-center gap-4 relative group">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 border ${
                                                    isCurrent ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--bg-primary)] shadow-[0_0_20px_var(--border-glow)]' :
                                                    isActive ? 'bg-[var(--bg-elevated)] border-[var(--accent-primary)] text-[var(--accent-primary)]' : 
                                                    'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                                                }`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {result.payment_status === 'paid' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--bg-elevated)] border border-[var(--accent-success)]/30 rounded-xl p-6 mb-12 flex items-center justify-center gap-4 text-[var(--accent-success)] font-display font-bold uppercase tracking-tight">
                                    <CheckCircle2 size={24} /> PAGAMENTO CONFIRMADO
                                </motion.div>
                            )}

                            {result.payment_status === 'awaiting_payment' && paymentInfo && (
                                <div className="bg-[var(--bg-elevated)] border border-[var(--border-active)] rounded-2xl p-10 mb-12 relative overflow-hidden">
                                    <h3 className="text-2xl font-display font-bold uppercase mb-4 text-[var(--text-primary)]">PAGAMENTO <span className="chrome-text">LIBERADO</span></h3>
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] mb-10 uppercase tracking-widest max-w-lg">
                                        Seu pedido está pronto para o próximo passo. Escolha a melhor forma para finalizar:
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8 flex flex-col justify-between shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="p-3 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)]"><QrCode size={24} /></div>
                                                    <h4 className="font-display font-bold uppercase tracking-tight text-[var(--text-primary)]">PIX COPIA E COLA</h4>
                                                </div>
                                                <div className="bg-[var(--bg-primary)] p-4 rounded-lg flex items-center gap-3 border border-[var(--border-subtle)] overflow-hidden group">
                                                    <span className="text-xs font-mono text-[var(--text-secondary)] truncate flex-1">{paymentInfo.pixCode}</span>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(paymentInfo.pixCode); setCopiedPix(true); setTimeout(() => setCopiedPix(false), 2000); }}
                                                        className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors p-2"
                                                    >
                                                        {copiedPix ? <CheckCircle2 size={18} className="text-[var(--accent-success)]" /> : <Copy size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8 flex flex-col justify-between shadow-sm">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)]"><CreditCard size={24} /></div>
                                                <h4 className="font-display font-bold uppercase tracking-tight text-[var(--text-primary)]">CARTÃO DE CRÉDITO</h4>
                                            </div>
                                            <a
                                                href={paymentInfo.checkoutUrl}
                                                target="_blank" rel="noreferrer"
                                                className="btn-primary w-full py-5 text-center"
                                            >
                                                PAGAR ONLINE
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-10 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-6">
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest max-w-sm leading-relaxed">
                                            <strong className="text-[var(--text-secondary)]">Prefere pagar na retirada?</strong><br />
                                            Aceitamos dinheiro e cartão maquininha direto na nossa loja.
                                        </p>
                                        <a href={`https://wa.me/${brand.whatsapp}?text=Oi, estou indo retirar meu pedido ${result.id}!`} target="_blank" rel="noreferrer" className="text-[10px] text-[var(--accent-primary)] font-bold uppercase tracking-[0.2em] border-b border-[var(--accent-primary)]/30 pb-1 hover:border-[var(--accent-primary)] transition-all">
                                            AVISAR NO WHATSAPP &rarr;
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="bg-[var(--bg-elevated)] rounded-xl p-8 border border-[var(--border-subtle)]">
                                <div className="text-[10px] text-[var(--text-muted)] mb-4 uppercase font-bold tracking-[0.3em]">INFORMAÇÃO TÉCNICA:</div>
                                <p className="text-[var(--text-primary)] font-medium leading-relaxed italic opacity-80">
                                    "{result.description || "Iniciando processo de avaliação técnica."}"
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
