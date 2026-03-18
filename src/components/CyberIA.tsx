"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Bot, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getGeminiResponse } from "@/lib/gemini";
import { getProducts } from "@/lib/products";

export default function CyberIA() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [productsString, setProductsString] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);

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
                console.error("Erro ao carregar histórico da IA", e);
                setMessages([{ role: 'ai', content: 'Olá! Sou o Cyber IA. Como posso ajudar você a montar seu setup ou consertar seu aparelho hoje?' }]);
            }
        } else {
            setMessages([{ role: 'ai', content: 'Olá! Sou o Cyber IA. Como posso ajudar você a montar seu setup ou consertar seu aparelho hoje?' }]);
        }

        preloadProducts();
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('cyber_ia_messages', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'ai' && lastMessageRef.current) {
                lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        const recentMessages = messages.slice(-4);
        const context = `Você é o consultor Cyber IA da Cyber Informática em Bragança Paulista. 
Seu objetivo principal é ser amigável e resolver o problema do cliente.

HISTÓRICO DA CONVERSA:
${recentMessages.map(m => `${m.role === 'user' ? 'Cliente' : 'Você'}: ${m.content}`).join('\n')}

ESTOQUE ATUAL:
${productsString || "Nenhum produto cadastrado não momento."}

    Instruções:
    1. FOCO NA DOR: Se o cliente fala de manutenção, foque APENAS em como ajudá-lo com o conserto.
    2. MENÇÃO AO VOUCHER: Mencione o voucher SOMENTE UMA VEZ, preferencialmente não final.
    3. RECOMENDAÇÕES: Recomende produtos se o cliente demonstrar interesse.
    4. NATURALIDADE: Responda como um técnico humanão. Seja direto e empático.
    5. LIMITE: Respostas curtas (max 2-3 parágrafos).

    Pergunta atual: ${userMsg}`;

        const aiResponse = await getGeminiResponse(context);
        setMessages(prev => {
            const newMessages = [...prev, { role: 'ai', content: aiResponse }];
            try {
                fetch('/api/extract-lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: newMessages, source: 'Cyber IA Chat' })
                });
            } catch (e) {
                console.error("Erro ao disparar extração de lead", e);
            }
            return newMessages as { role: 'user' | 'ai', content: string }[];
        });
        setLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] h-[550px] bg-white rounded-[2px] flex flex-col overflow-hidden border border-[#D4D2CF] shadow-2xl"
                    >
                        <div className="p-6 bg-[#1A1A1A] flex items-center justify-between">
                            <div className="flex items-center gap-3 text-white font-display font-bold uppercase tracking-tight">
                                <Bot size={20} />
                                Cyber IA
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F7F5]">
                            {messages.map((msg, i) => {
                                const isLastMessage = i === messages.length - 1;
                                return (
                                    <div
                                        key={i}
                                        ref={isLastMessage && msg.role === 'ai' ? lastMessageRef : null}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-4 rounded-[2px] text-sm whitespace-pre-wrap font-medium leading-relaxed ${
                                            msg.role === 'user' 
                                            ? 'bg-[#1A1A1A] text-white' 
                                            : 'bg-white text-[#1A1A1A] border border-[#ECEAE6]'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-[2px] border border-[#ECEAE6] flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin text-[#AAAAAA]" />
                                        <span className="text-[10px] font-bold text-[#AAAAAA] uppercase tracking-widest">PROCESSANDO...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-[#D4D2CF] bg-white">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Como posso ajudar?"
                                    className="w-full bg-[#F8F7F5] border border-[#ECEAE6] rounded-[2px] py-3 pl-4 pr-12 text-sm focus:outline-nãone focus:border-[#1A1A1A] text-[#1A1A1A] transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-2 top-2 w-8 h-8 bg-[#1A1A1A] rounded-[2px] flex items-center justify-center text-white hover:bg-black transition-all"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-[#1A1A1A] rounded-[2px] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all group"
            >
                {isOpen ? <X className="text-white" /> : <Sparkles className="text-white group-hover:animate-pulse" />}
            </button>
        </div>
    );
}
