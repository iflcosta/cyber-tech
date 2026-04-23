'use client';
import { useState } from 'react';
import { X, Users, Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import type { Lead } from '@/types/lead';

interface LeadAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    leads: Lead[];
}

export function LeadAnalyticsModal({ isOpen, onClose, leads }: LeadAnalyticsModalProps) {
    if (!isOpen) return null;

    // Group leads by date
    const leadsByDate = leads.reduce((acc: Record<string, Lead[]>, lead) => {
        const date = new Date(lead.created_at).toLocaleDateString('pt-BR');
        if (!acc[date]) acc[date] = [];
        acc[date].push(lead);
        return acc;
    }, {});

    const sortedDates = Object.keys(leadsByDate).sort((a, b) => {
        const dateA = new Date(a.split('/').reverse().join('-'));
        const dateB = new Date(b.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
    });

    const today = new Date().toLocaleDateString('pt-BR');
    const todayLeads = leadsByDate[today] || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div 
                className="absolute inset-0 bg-[#020406]/95 backdrop-blur-xl"
                onClick={onClose}
            />
            
            <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                                <TrendingUp size={20} className="text-[var(--accent-primary)]" />
                            </div>
                            <h2 className="text-2xl font-display font-black uppercase italic tracking-tighter">
                                Rastreamento de Leads
                            </h2>
                        </div>
                        <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest pl-[3.25rem]">Fluxo cronológico e volumetria diária</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10"
                    >
                        <X size={24} className="text-white/40" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Timeline Column */}
                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[var(--accent-primary)] mb-6 flex items-center gap-2">
                                    <Clock size={14} /> Atividade Recente
                                </h3>
                                
                                <div className="space-y-4">
                                    {leads.slice(0, 20).map((lead) => {
                                        const date = new Date(lead.created_at);
                                        const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                        const day = date.toLocaleDateString('pt-BR');
                                        
                                        return (
                                            <div key={lead.id} className="group relative flex gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-[var(--accent-primary)]/30 transition-all">
                                                <div className="flex flex-col items-center pt-1">
                                                    <div className="text-[10px] font-mono font-bold text-[var(--accent-primary)] mb-1">{time}</div>
                                                    <div className="w-px h-full bg-white/10 group-last:hidden" />
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-black uppercase italic italic tracking-tight">
                                                            {lead.client_name || 'Usuário Anônimo'}
                                                        </span>
                                                        <span className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase opacity-50">{day}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase tracking-widest border ${
                                                            lead.interest_type === 'pc_build' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                            lead.interest_type === 'upgrade' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-green-500/10 text-green-400 border-green-500/20'
                                                        }`}>
                                                            {lead.interest_type?.replace('_', ' ') || 'Contato'}
                                                        </span>
                                                        <span className="text-[8px] font-mono p-1 bg-white/5 rounded text-[var(--text-muted)]">{lead.voucher_code}</span>
                                                    </div>
                                                    <p className="text-[11px] text-[var(--text-secondary)] italic line-clamp-1 opacity-70">
                                                        {lead.description || 'Interesse direto via botão de consulta.'}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center">
                                                    <div className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                        <ArrowRight size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Daily Summary Column */}
                        <div className="space-y-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
                                    <Calendar size={14} className="text-[var(--accent-primary)]" /> Resumo Diário
                                </h3>
                                
                                <div className="space-y-3">
                                    {sortedDates.slice(0, 10).map((date) => {
                                        const count = leadsByDate[date].length;
                                        const maxLeads = Math.max(...Object.values(leadsByDate).map(l => l.length), 1);
                                        const pct = (count / maxLeads) * 100;
                                        
                                        return (
                                            <div key={date} className="relative overflow-hidden p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all">
                                                <div 
                                                    className="absolute bottom-0 left-0 h-1 bg-[var(--accent-primary)]/20 transition-all duration-1000" 
                                                    style={{ width: `${pct}%` }}
                                                />
                                                <div className="flex justify-between items-center relative z-10">
                                                    <span className="text-[11px] font-mono font-bold text-[var(--text-muted)]">{date}</span>
                                                    <span className="text-lg font-display font-black chrome-text">{count}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-3xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <TrendingUp size={60} />
                                </div>
                                <div className="text-[9px] font-mono font-black text-[var(--accent-primary)] uppercase tracking-widest mb-4">Média Semanal</div>
                                <div className="text-4xl font-display font-black chrome-text mb-2">
                                    {(leads.length / Math.max(sortedDates.length, 1)).toFixed(1)}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Leads por dia</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
