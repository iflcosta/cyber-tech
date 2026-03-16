"use client";
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGeminiResponse } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { getProducts } from '@/lib/products';

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
            const products = await getProducts();
            const str = products.map(p =>
                `- ${p.name}: R$ ${p.price} (${p.category})`
            ).join('\n');
            setProductsString(str);
        }

        // Carregar histórico do LocalStorage
        const savedMessages = localStorage.getItem('cyber_ia_messages');
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) {
                console.error("Erro ao carregar histórico da IA", e);
                setMessages([{ role: 'ai', content: 'Olá! Sou o Cyber IA. Como posso ajudar você a montar seu setup ou consertar seu aparelho hoje?' }]);
            }
        } else {
            setMessages([{ role: 'ai', content: 'Olá! Sou o Cyber IA. Como posso ajudar você a montar seu setup ou consertar seu aparelho hoje?' }]);
        }

        preloadProducts();
    }, []);

    // Salvar no LocalStorage sempre que as mensagens mudarem
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('cyber_ia_messages', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'ai' && lastMessageRef.current) {
                // Scrolla para o topo da última mensagem da IA
                lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (scrollRef.current) {
                // Caso contrário (mensagem do usuário), scrolla para o final normal
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

        // Contexto para a IA
        const recentMessages = messages.slice(-4);
        const context = `Você é o consultor Cyber IA da Cyber Tech em Bragança Paulista. 
Seu objetivo principal é ser amigável e resolver o problema do cliente.

HISTÓRICO DA CONVERSA:
${recentMessages.map(m => `${m.role === 'user' ? 'Cliente' : 'Você'}: ${m.content}`).join('\n')}

ESTOQUE ATUAL (Para consulta se o cliente perguntar por produtos):
${productsString || "Nenhum produto cadastrado no momento."}

    Instruções de Personalidade e Comportamento:
    1. FOCO NA DOR: Se o cliente fala de manutenção, foque APENAS em como ajudá-lo com o conserto. Não tente vender PCs ou Smartphones se ele está preocupado com um aparelho quebrado.
    2. MENÇÃO AO VOUCHER: Mencione o brinde/voucher SOMENTE UMA VEZ em toda a conversa, de preferência no final quando o atendimento estiver sendo concluído, ou se ele demonstrar interesse em comprar algo. Não repita isso em todas as mensagens.
    3. RECOMENDAÇÕES: Só recomende produtos do estoque se o cliente demonstrar interesse em COMPRAR ou em UPGRADES. 
    4. NATURALIDADE: Responda como um técnico humano de Bragança. Seja direto, empático e evite textos que pareçam propaganda de rádio.
    5. LIMITE: Respostas curtas (max 2-3 parágrafos).

    Pergunta atual do cliente: ${userMsg}`;

        const aiResponse = await getGeminiResponse(context);
        setMessages(prev => {
            const newMessages = [...prev, { role: 'ai', content: aiResponse }];

            // Disparar extração de lead em background (não bloqueia a UI)
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
                        className="mb-4 w-[350px] h-[500px] glass rounded-3xl flex flex-col overflow-hidden border-white/20 shadow-2xl"
                    >
                        {/* Header Chat */}
                        <div className="p-4 bg-blue-600 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Bot size={20} />
                                Cyber IA
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/80">
                            {messages.map((msg, i) => {
                                const isLastMessage = i === messages.length - 1;
                                return (
                                    <div
                                        key={i}
                                        ref={isLastMessage && msg.role === 'ai' ? lastMessageRef : null}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/10 p-3 rounded-2xl animate-pulse text-white/40 text-xs">Pensando...</div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 bg-black">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Como posso ajudar?"
                                    className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:border-blue-500 text-white"
                                />
                                <button
                                    onClick={handleSend}
                                    className="absolute right-1 top-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-all"
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
                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-110 active:scale-95 transition-all animate-float"
            >
                {isOpen ? <X className="text-white" /> : <Sparkles className="text-white" />}
            </button>
        </div>
    );
}
