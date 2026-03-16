"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getTinyPaymentLink } from '@/lib/tiny';
import { Search, Loader2, Clock, CheckCircle2, AlertCircle, Wrench, PackageCheck, Send, QrCode, Copy, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_MANUTENCAO = [
    { id: 'pending', label: 'Pendente', icon: Clock, desc: 'Aguardando início' },
    { id: 'analysis', label: 'Em Análise', icon: Search, desc: 'Técnico avaliando' },
    { id: 'parts', label: 'Aguardando Peça', icon: AlertCircle, desc: 'Pedido de componentes' },
    { id: 'maintenance', label: 'Em Manutenção', icon: Wrench, desc: 'Trabalho em progresso' },
    { id: 'testing', label: 'Em Testes', icon: Loader2, desc: 'Homologação final' },
    { id: 'ready', label: 'Pronto', icon: PackageCheck, desc: 'Disponível para retirada' },
    { id: 'converted', label: 'Finalizado', icon: CheckCircle2, desc: 'Entrega concluída' }
];

const STATUS_VENDA = [
    { id: 'pending', label: 'Pendente', icon: Clock, desc: 'Aguardando Início' },
    { id: 'separating', label: 'Separando', icon: PackageCheck, desc: 'Preparando pedido' },
    { id: 'ready', label: 'Pronto/Enviado', icon: Send, desc: 'Pronto para entrega' },
    { id: 'converted', label: 'Finalizado', icon: CheckCircle2, desc: 'Entrega concluída' }
];

const STATUS_PC = [
    { id: 'pending', label: 'Pendente', icon: Clock, desc: 'Aguardando Orçamento' },
    { id: 'building', label: 'Em Montagem', icon: Wrench, desc: 'Montando o Setup' },
    { id: 'testing', label: 'Testes de Stress', icon: Loader2, desc: 'Benchmark' },
    { id: 'ready', label: 'Pronto', icon: PackageCheck, desc: 'Disponível para retirada' },
    { id: 'converted', label: 'Finalizado', icon: CheckCircle2, desc: 'Entrega concluída' }
];

export default function ServiceSearch() {
    const [searchMode, setSearchMode] = useState<'voucher' | 'whatsapp'>('voucher');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentInfo, setPaymentInfo] = useState<{ pixCode: string, checkoutUrl: string } | null>(null);
    const [copiedPix, setCopiedPix] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchMode === 'voucher' && !code.trim()) return;
        if (searchMode === 'whatsapp' && (!name.trim() || !whatsapp.trim())) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setPaymentInfo(null);
        setCopiedPix(false);

        let query = supabase
            .from('leads')
            .select('client_name, interest_type, status, payment_status, created_at, description, order_id_tiny')
            .order('created_at', { ascending: false })
            .limit(1);

        if (searchMode === 'voucher') {
            query = query.eq('voucher_code', code.toUpperCase());
        } else {
            query = query.ilike('client_name', `%${name.trim()}%`).eq('whatsapp', whatsapp.trim());
        }

        const { data, error: sbError } = await query.maybeSingle();

        if (sbError || !data) {
            setError(searchMode === 'voucher' ? 'Código não encontrado. Verifique se digitou corretamente.' : 'Nenhum serviço encontrado para este nome e WhatsApp.');
        } else {
            setResult(data);
            if (data.payment_status === 'awaiting_payment' && data.order_id_tiny) {
                const pInfo = await getTinyPaymentLink(data.order_id_tiny);
                if (pInfo) setPaymentInfo(pInfo);
            }
        }
        setLoading(false);
    };

    const getStatusArray = (type: string) => {
        if (type === 'manutencao') return STATUS_MANUTENCAO;
        if (type === 'pc_build') return STATUS_PC;
        return STATUS_VENDA;
    };

    const currentStatusArray = result ? getStatusArray(result.interest_type) : STATUS_MANUTENCAO;
    const currentStatusIdx = currentStatusArray.findIndex(s => s.id === result?.status);

    return (
        <section id="consultar-status" className="py-20 bg-black relative">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">
                        CONSULTAR <span className="text-blue-500">STATUS</span>
                    </h2>
                    <p className="text-white/40">Insira o código do seu voucher ou ordem de serviço.</p>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="bg-white/5 p-1 rounded-xl inline-flex">
                        <button
                            type="button"
                            onClick={() => setSearchMode('voucher')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${searchMode === 'voucher' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            BUSCAR POR CÓDIGO
                        </button>
                        <button
                            type="button"
                            onClick={() => setSearchMode('whatsapp')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${searchMode === 'whatsapp' ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}
                        >
                            ESQUECI MEU CÓDIGO
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="mb-12">
                    {searchMode === 'voucher' ? (
                        <div className="relative group">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="EX: BPC-XXXX"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-8 pr-32 text-2xl font-black tracking-widest uppercase focus:outline-none focus:border-blue-500/50 transition-all text-white"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-black transition-all flex items-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                                <span className="hidden sm:inline">BUSCAR</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu Nome"
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-lg font-bold focus:outline-none focus:border-blue-500/50 transition-all text-white"
                                required
                            />
                            <input
                                type="text"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                placeholder="Seu WhatsApp (Ex: 11999999999)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-lg font-bold focus:outline-none focus:border-blue-500/50 transition-all text-white"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                                <span className="hidden md:inline">BUSCAR</span>
                            </button>
                        </div>
                    )}
                </form>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center font-bold mb-8"
                        >
                            {error}
                        </motion.div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass p-8 md:p-12 rounded-[40px] border-white/10 shadow-2xl"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-white/5">
                                <div>
                                    <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Cliente</div>
                                    <div className="text-2xl font-black italic text-white">{result.client_name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Tipo de Serviço</div>
                                    <div className="px-4 py-1.5 bg-blue-600/10 text-blue-500 rounded-full text-xs font-black uppercase border border-blue-500/20">
                                        {result.interest_type === 'manutencao' ? 'Manutenção Técnica'
                                            : result.interest_type === 'pc_build' ? 'Montagem de PC'
                                                : 'Ordem de Venda'}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar View */}
                            <div className="relative mb-16 px-4">
                                <div className="absolute top-5 left-8 right-8 h-1 bg-white/5 -z-10" />
                                <div
                                    className="absolute top-5 left-8 h-1 bg-blue-500 transition-all duration-1000 -z-10"
                                    style={{ width: `${Math.max(0, (currentStatusIdx / (currentStatusArray.length - 1)) * 100)}%` }}
                                />

                                <div className="flex justify-between">
                                    {currentStatusArray.map((step, idx) => {
                                        const Icon = step.icon;
                                        const isActive = idx <= currentStatusIdx;
                                        const isCurrent = idx === currentStatusIdx;

                                        return (
                                            <div key={step.id} className="flex flex-col items-center gap-4 relative group">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${isCurrent ? 'bg-blue-600 border-blue-400 scale-125 shadow-[0_0_20px_rgba(37,99,235,0.5)]' :
                                                    isActive ? 'bg-blue-600/40 border-blue-500/50' : 'bg-black border-white/10'
                                                    }`}>
                                                    <Icon size={16} className={isActive ? 'text-white' : 'text-white/20'} />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-white' : 'text-white/20'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Informações de Pagamento (Paralelo) */}
                            {result.payment_status === 'paid' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-8 flex items-center justify-center gap-3 text-green-400 font-bold uppercase tracking-widest text-sm">
                                    <CheckCircle2 size={24} /> PAGAMENTO CONFIRMADO
                                </motion.div>
                            )}

                            {result.payment_status === 'awaiting_payment' && paymentInfo && (
                                <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden flex flex-col items-center">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <QrCode size={120} />
                                    </div>
                                    <h3 className="text-2xl font-black italic uppercase mb-2 text-center z-10">PAGAMENTO <span className="text-blue-500">LIBERADO</span></h3>
                                    <p className="text-sm font-medium text-white/60 mb-8 max-w-lg text-center mx-auto z-10">
                                        Seu pedido está pronto para o próximo passo. Escolha a melhor forma para finalizar:
                                    </p>

                                    <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl z-10">
                                        <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl p-6 relative transition-all hover:bg-white/10 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="p-2 bg-green-500/20 text-green-500 rounded-lg"><QrCode size={20} /></div>
                                                    <h4 className="font-bold text-sm uppercase tracking-widest text-green-500 whitespace-nowrap">Pix Copia e Cola</h4>
                                                </div>
                                                <div className="bg-black/50 p-3 rounded-lg flex items-center gap-2 border border-white/5 w-full overflow-hidden">
                                                    <span className="text-sm font-mono text-white/80 truncate flex-1">{paymentInfo.pixCode}</span>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(paymentInfo.pixCode); setCopiedPix(true); setTimeout(() => setCopiedPix(false), 2000); }}
                                                        className="text-white hover:text-green-500 transition-colors p-2 shrink-0 bg-white/5 rounded-md" title="Copiar Chave PIX"
                                                    >
                                                        {copiedPix ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl p-6 relative transition-all hover:bg-white/10 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg"><CreditCard size={20} /></div>
                                                    <h4 className="font-bold text-sm uppercase tracking-widest text-blue-500 whitespace-nowrap">Cartão de Crédito</h4>
                                                </div>
                                            </div>
                                            <a
                                                href={paymentInfo.checkoutUrl}
                                                target="_blank" rel="noreferrer"
                                                className="block w-full text-center py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black tracking-widest uppercase transition-colors"
                                            >
                                                PAGAR ONLINE
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <p className="text-xs text-white/40 max-w-sm text-left">
                                            <strong>Prefere pagar na retirada?</strong><br />
                                            Aceitamos dinheiro e cartão maquininha direto na nossa loja. O status será atualizado após o pagamento presencial.
                                        </p>
                                        <a href="https://wa.me/5511999999999?text=Oi%20Iago,%20estou%20indo%20pagar/retirar%20na%20loja!" target="_blank" rel="noreferrer" className="text-xs text-green-500 font-bold hover:underline">
                                            Avisar no WhatsApp &rarr;
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                <div className="text-xs text-white/40 mb-2 uppercase font-black tracking-widest">Informação Técnica:</div>
                                <p className="text-white/80 font-medium">
                                    {result.description || "Iniciando processo de avaliação técnica."}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
