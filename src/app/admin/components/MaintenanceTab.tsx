'use client';
import { RefreshCw } from 'lucide-react';
import { sourceLabel } from '@/lib/tracking/sources';
import type { Lead } from '@/types/lead';
import type { MaintenanceOrder } from '@/types/maintenance';
import type { CommissionForm } from '@/types/admin';

interface MaintenanceTabProps {
    maintenanceOrders: MaintenanceOrder[];
    leads: Lead[];
    loading: boolean;
    onUpdateStatus: (orderId: string, newStatus: string) => void;
    onUpdatePaymentStatus: (orderId: string, newPaymentStatus: string) => void;
    onOpenCommission: (item: any, preset: Partial<CommissionForm>) => void;
    onRefresh: () => void;
}

export function MaintenanceTab({
    maintenanceOrders,
    leads,
    loading,
    onUpdateStatus,
    onUpdatePaymentStatus,
    onOpenCommission,
    onRefresh,
}: MaintenanceTabProps) {
    // Deduplicate by voucher_code: if a code exists in maintenanceOrders, skip it from leads.
    const seenCodes = new Set(maintenanceOrders.map(o => o.voucher_code.toUpperCase()));

    const merged = [
        ...maintenanceOrders.map(o => ({
            id: o.id,
            voucher_code: o.voucher_code,
            customer_name: (o as any).customer_name,
            customer_phone: (o as any).customer_phone || (o as any).customer_email,
            equipment_type: (o as any).equipment_type,
            problem_description: (o as any).problem_description || (o as any).description,
            source: (o as any).source ?? 'organic',
            status: o.status,
            payment_status: o.payment_status,
            final_value: o.final_value,
            commission_value: o.commission_value,
            cost_value: o.cost_value,
            performed_by_partner: o.performed_by_partner,
            created_at: o.created_at,
            isLead: false,
        })),
        ...leads
            .filter(l => l.interest_type === 'manutencao' && !seenCodes.has((l.voucher_code || '').toUpperCase()))
            .map(l => ({
                id: l.id,
                voucher_code: l.voucher_code,
                customer_name: l.client_name,
                customer_phone: l.whatsapp,
                equipment_type: 'manutenção',
                problem_description: l.description,
                source: l.marketing_source ?? 'form',
                status: l.status,
                payment_status: l.payment_status,
                final_value: l.final_value,
                commission_value: l.commission_value,
                cost_value: l.cost_value,
                performed_by_partner: l.performed_by_partner,
                created_at: l.created_at,
                isLead: true,
            })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
            <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                <div className="flex items-center gap-2">
                    <RefreshCw size={20} className="text-blue-500" /> Ordens de Manutenção
                </div>
                <button onClick={onRefresh} className="p-2 hover:bg-white/10 rounded-full transition-all">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                            <th className="p-6">Ordem / Cliente</th>
                            <th className="p-6">Equipamento</th>
                            <th className="p-6">Origem</th>
                            <th className="p-6">Progresso</th>
                            <th className="p-6">Pagamento</th>
                            <th className="p-6 text-right">Finalização</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                        {merged.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-500 italic">Nenhuma ordem encontrada.</td>
                            </tr>
                        ) : merged.map(order => (
                            <tr key={order.id} className="hover:bg-[var(--bg-elevated)]/[0.5] transition-colors group">
                                <td className="p-6">
                                    <div className="font-mono text-[var(--accent-primary)] font-black text-xs mb-1 tracking-tight">{order.voucher_code}</div>
                                    <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{order.customer_name || 'Cliente'}</div>
                                    <div className="font-mono text-[10px] text-[var(--text-muted)] mb-3">{order.customer_phone || (order as any).customer_email}</div>
                                    {order.problem_description && (
                                        <div className="text-[10px] font-medium bg-[var(--bg-primary)] p-3 rounded-xl text-[var(--text-secondary)] border border-[var(--border-subtle)] max-w-xs italic leading-relaxed relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-0.5 h-full bg-[var(--accent-primary)] opacity-40" />
                                            "{order.problem_description}"
                                        </div>
                                    )}
                                </td>
                                <td className="p-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full">
                                        {order.equipment_type}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <span className="text-[10px] font-mono font-black text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-1 rounded-full whitespace-nowrap">
                                        {sourceLabel(order.source)}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest mb-2">Status da Ordem</div>
                                    <select
                                        value={order.status || 'pending'}
                                        onChange={e => onUpdateStatus(order.id, e.target.value)}
                                        className={`w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-widest outline-none transition-all ${order.status === 'converted' ? 'text-green-500 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                                            order.status === 'ready' ? 'text-[var(--accent-primary)] border-[var(--accent-primary)]/30' :
                                                'text-[var(--text-muted)]'
                                            }`}
                                    >
                                        <option value="pending" className="bg-black">PENDENTE</option>
                                        <option value="analysis" className="bg-black">EM ANÁLISE</option>
                                        <option value="parts" className="bg-black">AGUARD. PEÇA</option>
                                        <option value="maintenance" className="bg-black">MANUTENÇÃO</option>
                                        <option value="testing" className="bg-black">EM TESTES</option>
                                        <option value="ready" className="bg-black">PRONTO</option>
                                        <option value="converted" className="bg-black">FINALIZADO</option>
                                    </select>
                                </td>
                                <td className="p-6">
                                    <div className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest mb-2">Status de Pagamento</div>
                                    <select
                                        value={order.payment_status || 'pending'}
                                        onChange={e => onUpdatePaymentStatus(order.id, e.target.value)}
                                        className={`w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-widest outline-none transition-all ${order.payment_status === 'paid' ? 'text-green-500 border-green-500/30 bg-green-500/5 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                                            order.payment_status === 'awaiting_payment' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' :
                                                'text-[var(--text-muted)]'
                                            }`}
                                    >
                                        <option value="pending" className="bg-black">PENDENTE</option>
                                        <option value="awaiting_payment" className="bg-black">AGUARDANDO PAGTO</option>
                                        <option value="paid" className="bg-black">PAGO CONFIRMADO</option>
                                    </select>
                                </td>
                                <td className="p-6">
                                    {order.status === 'converted' ? (
                                        <div className="space-y-4">
                                            <div className="space-y-1 bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)]">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase">Bruto:</span>
                                                    <span className="font-display font-bold text-sm">R$ {(order.final_value || 0).toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5 mt-1.5">
                                                    <span className="text-[9px] font-mono font-black text-[var(--accent-primary)] uppercase tracking-tighter">Ope:</span>
                                                    <span className="text-[10px] font-mono font-black text-[var(--accent-primary)]">R$ {(order.commission_value || 0).toLocaleString('pt-BR')}</span>
                                                </div>
                                                {order.performed_by_partner && (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-[9px] font-mono font-black text-purple-400 uppercase tracking-tighter">Jeff.:</span>
                                                        <span className="text-[10px] font-mono font-black text-purple-400">
                                                            R$ {(((order.final_value || 0) - (order.cost_value || 0)) * 0.5).toLocaleString('pt-BR')}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5 mt-1.5 opacity-40 italic">
                                                    <span className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase">Líq:</span>
                                                    <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">
                                                        R$ {((order.final_value || 0) - (order.commission_value || 0) - (order.performed_by_partner ? ((order.final_value || 0) - (order.cost_value || 0)) * 0.5 : 0)).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="w-full h-8 text-[9px] font-mono font-black uppercase tracking-widest bg-[var(--bg-elevated)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)] transition-all"
                                                onClick={() => {
                                                    onOpenCommission(order, {
                                                        finalValue: order.final_value?.toString() || '',
                                                        costValue: order.cost_value?.toString() || '',
                                                        ecosystemCaptured: (order as any).commission_ecosystem ?? true,
                                                        isAssembly: (order as any).commission_service ?? false,
                                                        executor: order.performed_by_partner ? 'partner' : (['smartphone', 'celular', 'tablet', 'mobile'].includes(((order as any).equipment_type || (order as any).interest_type || '').toLowerCase()) ? 'partner' : 'owner'),
                                                        customCommissionType: 'percent',
                                                        customCommissionAmount: '',
                                                        consumedProducts: [],
                                                    });
                                                }}
                                            >
                                                Ajustar Log
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <button
                                                className="w-full h-9 text-[9px] font-mono font-black uppercase tracking-widest bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg hover:opacity-90 transition-all shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.2)]"
                                                onClick={() => {
                                                    onOpenCommission(order, {
                                                        finalValue: '',
                                                        costValue: '',
                                                        ecosystemCaptured: true,
                                                        isAssembly: false,
                                                        executor: ['smartphone', 'celular', 'tablet', 'mobile'].includes(((order as any).equipment_type || (order as any).interest_type || '').toLowerCase()) ? 'partner' : 'owner',
                                                        customCommissionType: 'percent',
                                                        customCommissionAmount: '',
                                                        consumedProducts: [],
                                                    });
                                                }}
                                            >
                                                Finalizar Ordem
                                            </button>
                                            <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] text-center uppercase tracking-widest mt-2">
                                                Aberto em: {new Date(order.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
