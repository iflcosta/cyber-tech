'use client';
import { ShoppingCart, RefreshCw } from 'lucide-react';
import type { Lead } from '@/types/lead';
import type { CommissionForm } from '@/types/admin';

interface VendasTabProps {
    leads: Lead[];
    loading: boolean;
    onRefresh: () => void;
    onOpenCommission: (lead: Lead, preset: Partial<CommissionForm>) => void;
    onUpdateStatus: (leadId: string, newStatus: string) => void;
    onUpdatePaymentStatus: (leadId: string, newPaymentStatus: string) => void;
    onShowSocialCard: (lead: Lead) => void;
}

export function VendasTab({
    leads,
    loading,
    onRefresh,
    onOpenCommission,
    onUpdateStatus,
    onUpdatePaymentStatus,
    onShowSocialCard,
}: VendasTabProps) {
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

    const salesLeads = leads.filter(l =>
        ['venda', 'pc_build', 'compra', 'showroom'].includes(l.interest_type || '')
    );

    return (
        <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
            <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                <div className="flex items-center gap-2">
                    <ShoppingCart size={20} className="text-green-500" /> Vendas
                </div>
                <button
                    onClick={onRefresh}
                    className="p-2 hover:bg-white/10 rounded-full transition-all"
                    title="Atualizar dados"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                            <th className="p-6">Cliente / Dados</th>
                            <th className="p-6">Tipo</th>
                            <th className="p-6">Origem</th>
                            <th className="p-6 text-center">Voucher</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Pagamento</th>
                            <th className="p-6 text-right">Resultado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {salesLeads.length > 0 ? salesLeads.map(lead => (
                            <tr key={lead.id} className="hover:bg-[var(--bg-elevated)]/[0.5] transition-colors group">
                                <td className="p-6">
                                    <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{lead.client_name || 'Cliente'}</div>
                                    <div className="font-mono text-[10px] text-[var(--accent-primary)] mb-3">{lead.whatsapp || lead.session_id}</div>
                                    {lead.description && (
                                        <div className="text-[10px] font-medium bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--text-secondary)] border border-[var(--border-subtle)] max-w-xs italic leading-relaxed relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-0.5 h-full bg-[var(--accent-primary)] opacity-40" />
                                            "{lead.description}"
                                        </div>
                                    )}
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col gap-2">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit ${
                                            lead.interest_type === 'pc_build' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                            lead.interest_type === 'upgrade' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            'bg-green-500/10 text-green-400 border border-green-500/20'
                                        }`}>
                                            {lead.interest_type}
                                        </span>
                                        {lead.intent_type && (
                                            <span className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                                                Intenção: {lead.intent_type}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl opacity-70 group-hover:opacity-100 transition-opacity">
                                            {getSourceIcon(lead.marketing_source)}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-tighter">{lead.marketing_source || 'direct'}</span>
                                            {(lead.utm_parameters as any)?.utm_campaign && (
                                                <span className="text-[8px] font-mono text-[var(--accent-primary)]/60 font-bold uppercase truncate max-w-[80px]">{(lead.utm_parameters as any).utm_campaign}</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 text-center">
                                    {lead.voucher_code ? (
                                        <div className="font-mono text-[10px] font-black bg-[var(--bg-primary)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg text-[var(--accent-primary)] shadow-sm inline-block">
                                            {lead.voucher_code}
                                        </div>
                                    ) : <span className="opacity-20">—</span>}
                                </td>
                                <td className="p-6">
                                    <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold tracking-widest">Progresso</div>
                                    <select
                                        value={lead.status}
                                        onChange={e => onUpdateStatus(lead.id, e.target.value)}
                                        className={`w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none transition-all ${lead.status === 'converted' ? 'text-green-400 border-green-500/20' :
                                            lead.status === 'ready' ? 'text-blue-400 border-blue-500/20' :
                                                lead.status === 'upgrade' || lead.status === 'building' ? 'text-purple-400 border-purple-500/20' :
                                                    'text-yellow-500 border-yellow-500/20'
                                            }`}
                                    >
                                        {lead.interest_type === 'upgrade' ? (
                                            <>
                                                <option value="pending" className="bg-black">PENDENTE</option>
                                                <option value="upgrade" className="bg-black">EM UPGRADE</option>
                                                <option value="testing" className="bg-black">EM TESTES</option>
                                                <option value="ready" className="bg-black">PRONTO</option>
                                                <option value="converted" className="bg-black">FINALIZADO</option>
                                            </>
                                        ) : lead.interest_type === 'pc_build' ? (
                                            <>
                                                <option value="pending" className="bg-black">PENDENTE</option>
                                                <option value="building" className="bg-black">EM MONTAGEM</option>
                                                <option value="testing" className="bg-black">TESTES STRESS</option>
                                                <option value="ready" className="bg-black">PRONTO</option>
                                                <option value="converted" className="bg-black">FINALIZADO</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="pending" className="bg-black">PENDENTE</option>
                                                <option value="separating" className="bg-black">SEPARANDO</option>
                                                <option value="ready" className="bg-black">PRONTO / ENVIADO</option>
                                                <option value="converted" className="bg-black">FINALIZADO</option>
                                            </>
                                        )}
                                    </select>
                                </td>
                                <td className="p-6">
                                    <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold tracking-widest">Pagamento</div>
                                    <select
                                        value={lead.payment_status || 'pending'}
                                        onChange={e => onUpdatePaymentStatus(lead.id, e.target.value)}
                                        className={`w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none transition-all ${lead.payment_status === 'paid' ? 'text-green-400 border-green-500/20 bg-green-500/5' :
                                            lead.payment_status === 'awaiting_payment' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' :
                                                'text-white/40 border-white/5'
                                            }`}
                                    >
                                        <option value="pending" className="bg-black">PENDENTE</option>
                                        <option value="awaiting_payment" className="bg-black">AGUARDANDO PAGTO</option>
                                        <option value="paid" className="bg-black">PAGO CONFIRMADO</option>
                                    </select>
                                    {lead.payment_status === 'awaiting_payment' && (
                                        <div className="mt-1 text-[8px] text-yellow-500/60 uppercase">Link Cliente Liberado</div>
                                    )}
                                </td>
                                <td className="p-6">
                                    {lead.status === 'converted' ? (
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-[10px] text-white/40 uppercase font-bold">Total:</span>
                                                <span className="font-bold">R$ {(lead.final_value || 0).toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-1">
                                                <span className="text-[10px] text-blue-400 font-bold">Iago:</span>
                                                <span className="text-[10px] font-bold text-blue-400">R$ {(lead.commission_value || 0).toLocaleString('pt-BR')}</span>
                                            </div>
                                            {lead.performed_by_partner && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[10px] text-purple-400 font-bold">Jeff.:</span>
                                                    <span className="text-[10px] font-bold text-purple-400">
                                                        R$ {(lead.interest_type === 'upgrade'
                                                            ? ((lead.final_value || 0) - (lead.cost_value || 0)) * 0.5
                                                            : (lead.final_value || 0) * 0.03).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-1 opacity-60 italic">
                                                <span className="text-[10px] text-white/40">Loja:</span>
                                                <span className="text-[10px] text-white/40">
                                                    R$ {((lead.final_value || 0) - (lead.commission_value || 0) - (lead.performed_by_partner ? (lead.interest_type === 'upgrade' ? ((lead.final_value || 0) - (lead.cost_value || 0)) * 0.5 : (lead.final_value || 0) * 0.03) : 0)).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                            {(lead.utm_parameters as any)?.executor && (
                                                <div className="text-[8px] font-mono text-white/30 pt-1 border-t border-white/5">
                                                    executor: {(lead.utm_parameters as any).executor}
                                                </div>
                                            )}
                                            {lead.converted_at && (
                                                <div className="text-[8px] font-mono text-white/30">
                                                    {new Date(lead.converted_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    ) : '--'}
                                </td>
                                <td className="p-6 space-y-2">
                                    {lead.status !== 'converted' && lead.payment_status === 'paid' && (
                                        <button
                                            onClick={() => {
                                                const autoProducts = (lead.utm_parameters as any)?.product_ids
                                                    ?.map((id: string) => {
                                                        return { product_id: id, quantity: 1 };
                                                    })
                                                    .filter(Boolean) || [];
                                                onOpenCommission(lead, {
                                                    finalValue: '',
                                                    costValue: '',
                                                    ecosystemCaptured: true,
                                                    isAssembly: false,
                                                    executor: 'owner',
                                                    customCommissionType: 'percent',
                                                    customCommissionAmount: '',
                                                    consumedProducts: autoProducts,
                                                });
                                            }}
                                            className="w-full bg-white hover:bg-slate-200 text-[#121216] text-[10px] font-black px-4 py-2 rounded-lg transition-all block"
                                        >
                                            FINALIZAR COMO VENDIDO
                                        </button>
                                    )}
                                    {lead.status === 'converted' && (
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => onShowSocialCard(lead)}
                                                className="w-full bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/20 text-pink-400 text-[10px] font-black px-4 py-2 rounded-lg transition-all block"
                                            >
                                                📸 GERAR CARD
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const message = encodeURIComponent(`Olá ${lead.client_name || 'amigo'}, tudo bem? Aqui é o Iago da Cyber Informática. Passando para saber se o seu aparelho está funcionando perfeitamente e se ficou satisfeito com o serviço!\nAcabamos de inaugurar nosso novo site e sua opinião seria muito importante para nós. Poderia dedicar 30 segundos para deixar uma avaliação sobre o seu atendimento?\n\nLink para avaliar: https://cyber-tech-seven.vercel.app/?avaliar=true&nome=${encodeURIComponent(lead.client_name || '')}&voucher=${lead.voucher_code}`);
                                                    const phone = lead.whatsapp?.replace(/\D/g, '');
                                                    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                                                }}
                                                className="w-full bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/20 text-yellow-500 text-[10px] font-black px-4 py-2 rounded-lg transition-all block"
                                            >
                                                ⭐ PEDIR AVALIAÇÃO
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                                    {loading ? 'Carregando dados...' : 'Nenhum lead encontrado.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
