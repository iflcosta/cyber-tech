'use client';
import { Sparkles, RefreshCw } from 'lucide-react';
import type { Lead } from '@/types/lead';

interface LeadsTabProps {
    leads: Lead[];
    loading: boolean;
    inboxEdit: Record<string, { name: string; phone: string }>;
    setInboxEdit: React.Dispatch<React.SetStateAction<Record<string, { name: string; phone: string }>>>;
    onConvertLead: (lead: Lead, type: 'venda' | 'upgrade') => void;
    onDismissLead: (leadId: string) => void;
    onRefresh: () => void;
}

export function LeadsTab({
    leads,
    loading,
    inboxEdit,
    setInboxEdit,
    onConvertLead,
    onDismissLead,
    onRefresh,
}: LeadsTabProps) {
    const inboxLeads = leads.filter(
        l =>
            l.status !== 'dismissed' &&
            !['upgrade', 'venda', 'pc_build', 'compra', 'showroom'].includes(l.interest_type || '')
    );

    const getSourceIcon = (source: string | null) => {
        const sources: Record<string, string> = {
            instagram: '📸',
            facebook: '👥',
            google_ads: '🔍',
            google_organico: '🌱',
            whatsapp: '💬',
            tiktok: '🎵',
            direto: '🔗',
            outros: '🌐',
        };
        return sources[source || ''] || '🔗';
    };

    return (
        <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
            <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-yellow-400" /> Leads Pendentes
                    <span className="ml-2 px-2 py-0.5 text-[9px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded font-mono">{inboxLeads.length}</span>
                </div>
                <button onClick={onRefresh} className="p-2 hover:bg-white/10 rounded-full transition-all" title="Atualizar">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            {inboxLeads.length === 0 ? (
                <div className="p-16 text-center text-slate-500 italic text-sm">Nenhum lead pendente.</div>
            ) : (
                <div className="divide-y divide-white/10">
                    {inboxLeads.map(lead => {
                        const edit = inboxEdit[lead.id] ?? {
                            name: lead.client_name || '',
                            phone: lead.whatsapp || '',
                        };
                        const setEdit = (val: { name: string; phone: string }) =>
                            setInboxEdit(prev => ({ ...prev, [lead.id]: val }));
                        return (
                            <div key={lead.id} className="p-6 flex flex-col md:flex-row md:items-start gap-6 hover:bg-white/5 transition-colors group">
                                {/* Client info editable */}
                                <div className="flex-1 space-y-3">
                                    <input
                                        value={edit.name}
                                        onChange={e => setEdit({ ...edit, name: e.target.value })}
                                        placeholder="Nome do cliente"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-[var(--accent-primary)] transition-all text-[var(--text-primary)] placeholder:text-white/20"
                                    />
                                    <input
                                        value={edit.phone}
                                        onChange={e => setEdit({ ...edit, phone: e.target.value })}
                                        placeholder="WhatsApp"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:border-[var(--accent-primary)] transition-all text-[var(--accent-primary)] placeholder:text-white/20"
                                    />
                                    {lead.description && (
                                        <div className="text-[10px] font-medium bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--text-secondary)] border border-[var(--border-subtle)] italic leading-relaxed max-w-sm">
                                            "{lead.description}"
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--text-muted)] uppercase">
                                        <span>{getSourceIcon(lead.marketing_source)} {lead.marketing_source || 'direct'}</span>
                                        {lead.voucher_code && <span className="text-[var(--accent-primary)]">{lead.voucher_code}</span>}
                                        <span>{new Date(lead.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex flex-col gap-2 md:w-48">
                                    <button
                                        onClick={() => onConvertLead(lead, 'venda')}
                                        className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-black px-4 py-2.5 rounded-lg transition-all uppercase tracking-widest"
                                    >
                                        → Venda
                                    </button>
                                    <button
                                        onClick={() => onConvertLead(lead, 'upgrade')}
                                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-black px-4 py-2.5 rounded-lg transition-all uppercase tracking-widest"
                                    >
                                        → Manutenção
                                    </button>
                                    <button
                                        onClick={() => onDismissLead(lead.id)}
                                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/30 hover:text-white/50 text-[9px] font-bold px-4 py-2 rounded-lg transition-all uppercase tracking-widest"
                                    >
                                        Descartar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
