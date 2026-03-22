"use client";
import { useState, useEffect, useRef } from "react";
import { Send, X, Bot, Sparkles, Loader2, Monitor, Smartphone, Cpu, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getGeminiResponse } from "@/lib/gemini";
import { getProducts } from "@/lib/products";
import { useLeadModal } from "@/contexts/LeadModalContext";
import { useWhatsAppLead } from "@/hooks/useWhatsAppLead";
import { useVoucherSession } from "@/hooks/useVoucherSession";

type Message = { role: 'user' | 'ai', content: string };
type IntentType = 'compra_imediata' | 'pesquisando_preco' | 'manutencao_urgente' | 'duvida_tecnica';


const GUIDED_PROMPTS = [
    { label: "Meu PC não liga", icon: Monitor, prompt: "Olá! Meu computador parou de ligar hoje. O que pode ser?" },
    { label: "Notebook lento", icon: Cpu, prompt: "Meu notebook está muito lento ultimamente, demora pra abrir tudo. Tem como melhorar?" },
    { label: "iPhone quebrado", icon: Smartphone, prompt: "Quebrei a tela do meu iPhone, vocês trocam em quanto tempo?" },
    { label: "Orçamento PC Gamer", icon: Sparkles, prompt: "Quero montar um PC Gamer pra jogar CS2 e Valorant. Qual o orçamento inicial?" }
];

export default function CyberIA() {
    const { openModal } = useLeadModal();
    const { openWhatsApp } = useWhatsAppLead({ serviceType: 'outro' });
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { voucherCode } = useVoucherSession();
    const [productsString, setProductsString] = useState('');
    const [summarizing, setSummarizing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function preloadProducts() {
            try {
                const data = await getProducts();
                const simplified = data.map((p: any) => `- ${p.name}: R$ ${p.price} (${p.category})`).join('\n');
                setProductsString(simplified);
            } catch (e) {
                console.error("Erro ao carregar produtos para a IA", e);
            }
        }

        const saved = localStorage.getItem('cyber_ia_messages');
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                setMessages([{ role: 'ai', content: 'Fala! Sou o Cyber IA, seu consultor técnico aqui em Bragança Paulista. Como posso salvar seu dia (ou seu dispositivo) hoje?' }]);
            }
        } else {
            setMessages([{ role: 'ai', content: 'Fala! Sou o Cyber IA, seu consultor técnico aqui em Bragança Paulista. Como posso salvar seu dia (ou seu dispositivo) hoje?' }]);
        }

        preloadProducts();
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('cyber_ia_messages', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (customPrompt?: string) => {
        const userMsg = customPrompt || input;
        if (!userMsg.trim() || loading) return;

        if (!customPrompt) setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        const recentMessages = messages.slice(-6);
        const context = `Você é a Cyber IA, assistente técnica da Cyber Informática em Bragança Paulista, SP.

REGRAS CRÍTICAS:
- Seja direto e técnico (industrial refined). Use sotaque leve do interior paulista, mas mantenha o profissionalismo.
- MÁXIMO 3 perguntas antes de dar um diagnóstico provável ou estimativa.
- Nunca diga que não sabe. Se incerto, dê uma faixa de preço ("entre R$80 e R$150") baseada nos preços de mão de obra.
- Sempre termine com uma ação clara: visitar a loja, orçamento via WhatsApp ou previsão de preço.
- Conheça o contexto: a loja conserta notebooks, PCs, celulares e vende hardware de alta performance.

FLUXO PARA MANUTENÇÃO:
1. Identifique o dispositivo e sintoma.
2. Faça no máximo 2 perguntas sobre o comportamento específico.
3. Forneça o diagnóstico provável + faixa de preço + CTA WhatsApp.

FLUXO PARA COMPRA:
1. Pergunte o uso principal (games, trabalho, etc.) e o orçamento do cliente.
2. Sugira opções do estoque real disponível (abaixo).
3. Se houver poucas unidades, mencione a urgência ("temos apenas X unidades").
4. CTA WhatsApp ou convite para visitar a loja em Bragança.

ESTOQUE ATUAL:
${productsString || "Consulte-nos sobre disponibilidade imediata."}

PREÇOS DE MÃO DE OBRA (BASE):
- Celulares: R$ 80 - R$ 350
- Notebooks: R$ 120 - R$ 450
- PCs/Desktop: R$ 150 - R$ 500
- Limpeza/Formatação: R$ 150

HISTÓRICO DA CONVERSA:
${recentMessages.map(m => `${m.role === 'user' ? 'Cliente' : 'Cyber IA'}: ${m.content}`).join('\n')}

PERGUNTA ATUAL DO CLIENTE: ${userMsg}`;

        const aiResponse = await getGeminiResponse(context);
        
        // Identificação automática de intenção baseada no Prompt Master
        const determineIntent = (text: string): IntentType => {
            const t = text.toLowerCase();
            if (t.includes('comprar') || t.includes('preço') || t.includes('estoque') || t.includes('disponível')) return 'compra_imediata';
            if (t.includes('consertar') || t.includes('quebrado') || t.includes('não liga') || t.includes('ajuda técnica')) return 'manutencao_urgente';
            if (t.includes('pesquisando') || t.includes('olhando') || t.includes('comparando')) return 'pesquisando_preco';
            return 'duvida_tecnica';
        };

        const currentIntent = determineIntent(userMsg + " " + aiResponse);

        setMessages(prev => {
            const newMessages: Message[] = [...prev, { role: 'ai', content: aiResponse }];
            try {
                fetch('/api/extract-lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: newMessages, 
                        source: 'Cyber IA',
                        intent_type: currentIntent,
                        session_voucher_code: voucherCode
                    })
                });
            } catch (e) {}
            return newMessages;
        });
        setLoading(false);
    };

    const handleDirectWhatsApp = async () => {
        setSummarizing(true);
        try {
            const lastMessages = messages.slice(-8);
            const summaryContext = `Abaixo está uma conversa entre um cliente e a Cyber IA. 
            Extraia SOMENTE o objetivo principal do cliente (ex: "Conserto de tela de iPhone" ou "Orçamento de PC Gamer") em uma frase curta de no máximo 80 caracteres.
            Seja direto e não adicione saudações.
            
            Conversa:
            ${lastMessages.map(m => `${m.role === 'user' ? 'Cliente' : 'IA'}: ${m.content}`).join('\n')}
            
            Objetivo em uma linha:`;
            
            const rawSummary = await getGeminiResponse(summaryContext);
            const summary = rawSummary.trim().replace(/^Objetivo:\s*/i, '').replace(/["']/g, '');
            
            const text = `Olá! Vi a Cyber IA no site e gostaria de continuar o atendimento.\n\n*Assunto:* ${summary}\n\n*Voucher:* ${voucherCode || 'N/A'}`;
            openWhatsApp(text);
        } catch (e) {
            console.error("Erro ao resumir conversa para WA", e);
            openWhatsApp(`Olá! Vi a Cyber IA no site e gostaria de continuar o atendimento.\n\nMeu voucher: *${voucherCode || 'N/A'}*`);
        } finally {
            setSummarizing(false);
        }
    };

    const renderContent = (content: string) => {
        return content.split('\n\n').map((paragraph, pIndex) => {
            const parts = paragraph.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={pIndex} className={pIndex > 0 ? 'mt-3' : ''}>
                    {parts.map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <strong key={index} className="text-white font-black">
                                    {part.slice(2, -2)}
                                </strong>
                            );
                        }
                        return part.split('\n').map((line, lIndex) => (
                            <span key={lIndex}>
                                {line}
                                {lIndex < part.split('\n').length - 1 && <br />}
                            </span>
                        ));
                    })}
                </p>
            );
        });
    };

    return (
        <div className="card-dark fixed bottom-6 right-6 z-[100] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[calc(100vw-3rem)] max-w-[380px] h-[600px] max-h-[80vh] bg-[var(--bg-surface)] rounded-2xl flex flex-col overflow-hidden border border-[var(--border-subtle)] shadow-2xl"
                    >
                        {/* Chrome Header */}
                        <div className="p-5 bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--accent-glow)] rounded-lg border border-[var(--accent-success)]/20 shadow-[0_0_15px_rgba(46,204,113,0.2)]">
                                    <Bot size={20} className="text-[var(--accent-success)]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-display font-bold uppercase tracking-widest chrome-text">Cyber IA</h3>
                                    <p className="text-[10px] font-mono text-[var(--accent-success)] opacity-80 uppercase tracking-tighter flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-[var(--accent-success)] rounded-full animate-pulse" /> Operacional
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--bg-primary)] scrollbar-thin scrollbar-thumb-[var(--border-subtle)]">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3.5 rounded-xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-white text-zinc-950 font-bold border border-zinc-200 shadow-sm'
                                        : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/50 shadow-sm'
                                    }`}>
                                        {renderContent(msg.content)}
                                        {msg.role === 'ai' && (msg.content.toLowerCase().includes('whatsapp') || msg.content.toLowerCase().includes('chama no')) && (
                                            <div className="mt-4 pt-4 border-t border-zinc-700/30">
                                                <button 
                                                    onClick={() => handleDirectWhatsApp()}
                                                    disabled={summarizing}
                                                    className="inline-flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg border border-zinc-200 disabled:opacity-50"
                                                >
                                                    {summarizing ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <Sparkles size={12} fill="currentColor" />
                                                    )}
                                                    {summarizing ? 'Resumindo...' : 'Gerar Voucher & Chamar WhatsApp'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)] flex items-center gap-3">
                                        <Loader2 size={16} className="animate-spin text-[var(--accent-success)]" />
                                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Diagnosticando...</span>
                                    </div>
                                </div>
                            )}

                            {messages.length <= 1 && !loading && (
                                <div className="pt-4 space-y-3">
                                    <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 text-center">Diagnósticos Rápidos</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {GUIDED_PROMPTS.map((gp, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => handleSend(gp.prompt)}
                                                className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--accent-primary)] transition-all text-left group"
                                            >
                                                <gp.icon size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-success)]" />
                                                <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{gp.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => openModal()}
                                    className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white hover:bg-zinc-700 transition-all flex-shrink-0"
                                    title="Gerar Voucher"
                                >
                                    <Sparkles size={20} />
                                </button>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Digite aqui sua dúvida..."
                                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)] font-sans"
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={loading}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-lg flex items-center justify-center text-zinc-950 hover:bg-zinc-100 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                                    >
                                        <Send size={16} className="ml-0.5 -mt-0.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] border border-[var(--border-subtle)] hover:border-[var(--accent-success)] hover:shadow-[0_0_20px_rgba(46,204,113,0.3)] active:scale-95 transition-all group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-success)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? (
                    <X className="text-[var(--text-primary)]" size={24} />
                ) : (
                    <div className="relative">
                        <MessageSquare className="text-[var(--text-primary)] group-hover:text-[var(--accent-success)] transition-colors" size={24} />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent-success)] rounded-full animate-ping" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent-success)] rounded-full" />
                    </div>
                )}
            </button>
        </div>
    );
}
