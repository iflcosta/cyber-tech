'use client';
import { TrendingUp, Users, Package, AlertTriangle, Eye } from 'lucide-react';
import type { Lead } from '@/types/lead';
import type { Product } from '@/types/product';
import type { MaintenanceOrder } from '@/types/maintenance';
import type { AdminStats } from '@/types/admin';

interface DashboardTabProps {
    stats: AdminStats;
    leads: Lead[];
    products: Product[];
    maintenanceOrders: MaintenanceOrder[];
    onOpenPdv: () => void;
    onEditProduct: (product: Product) => void;
}

export function DashboardTab({
    stats,
    leads,
    products,
    maintenanceOrders,
    onOpenPdv,
    onEditProduct,
}: DashboardTabProps) {
    return (
        <div className="space-y-10">
            <div className="flex justify-end">
                <button
                    onClick={onOpenPdv}
                    className="px-6 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 rounded-xl font-display font-black text-xs tracking-widest uppercase flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                    <Package size={16} />
                    Nova Venda (PDV)
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Receita Total', val: `R$ ${stats.totalLeadValue.toLocaleString('pt-BR')}`, sub: `+${stats.convertedCount} conversões`, color: 'var(--accent-primary)', icon: TrendingUp },
                    { label: 'Leads Ativos', val: leads.length, sub: `${stats.pendingCount} pendentes`, color: 'var(--accent-primary)', icon: Users },
                    { label: 'Ticket Médio', val: `R$ ${stats.avgTicket.toFixed(0)}`, sub: 'Faturamento/Conversão', color: 'var(--accent-primary)', icon: Package },
                    { label: 'Alerta de Estoque', val: products.filter(p => p.stock_alert && p.stock_quantity <= (p.stock_alert_min || 1)).length, sub: 'Produtos sinalizados', color: 'red-500', icon: AlertTriangle },
                ].map((kpi, i) => (
                    <div key={i} className="bg-[var(--bg-elevated)] p-8 rounded-2xl border border-[var(--border-subtle)] relative overflow-hidden group hover:border-[var(--accent-primary)]/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <kpi.icon size={40} />
                        </div>
                        <div className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-3">{kpi.label}</div>
                        <div className="text-3xl font-display font-bold chrome-text mb-2">{kpi.val}</div>
                        <div className="text-[9px] font-mono font-bold text-[var(--accent-primary)] opacity-70 uppercase">{kpi.sub}</div>
                    </div>
                ))}
            </div>

            {/* Secondary View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Breakdown by Type */}
                <div className="bg-[var(--bg-elevated)] p-8 rounded-2xl border border-[var(--border-subtle)]">
                    <h3 className="text-sm font-black uppercase italic mb-6">Volume por Segmento</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Manutenção', key: 'manutencao', color: 'bg-blue-500' },
                            { label: 'PC Builder', key: 'pc_build', color: 'bg-purple-500' },
                            { label: 'Venda Balcão', key: 'venda', color: 'bg-green-500' },
                            { label: 'Showroom', key: 'compra', color: 'bg-orange-500' },
                            { label: 'Cyber IA / Dúvida', key: 'duvida', color: 'bg-yellow-500' },
                        ].map(type => {
                            const count = leads.filter(l => l.interest_type === type.key).length;
                            const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
                            return (
                                <div key={type.key}>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-[var(--text-muted)]">{type.label}</span>
                                        <span className="text-[var(--text-primary)]">{count} ({pct.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`${type.color} h-full transition-all duration-1000`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Marketing Channels */}
                <div className="bg-[var(--bg-elevated)] p-8 rounded-2xl border border-[var(--border-subtle)]">
                    <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2">
                        📡 Canais de Marketing
                    </h3>
                    <div className="space-y-4">
                        {(() => {
                            const channelMap: Record<string, { label: string; color: string; emoji: string }> = {
                                instagram: { label: 'Instagram', color: 'bg-pink-500', emoji: '📸' },
                                facebook: { label: 'Facebook', color: 'bg-blue-600', emoji: '👥' },
                                google_ads: { label: 'Google Ads', color: 'bg-yellow-500', emoji: '🔍' },
                                google_organico: { label: 'Google Orgânico', color: 'bg-green-500', emoji: '🌱' },
                                whatsapp: { label: 'WhatsApp', color: 'bg-green-400', emoji: '💬' },
                                tiktok: { label: 'TikTok', color: 'bg-cyan-400', emoji: '🎵' },
                                direto: { label: 'Acesso Direto', color: 'bg-white/40', emoji: '🔗' },
                                outros: { label: 'Outros', color: 'bg-white/20', emoji: '📍' },
                            };
                            const channels = leads.reduce((acc: Record<string, number>, l) => {
                                const src = l.marketing_source || 'direto';
                                acc[src] = (acc[src] || 0) + 1;
                                return acc;
                            }, {});

                            const sorted = Object.entries(channels).sort((a, b) => b[1] - a[1]);

                            if (sorted.length === 0) {
                                return <div className="text-slate-500 italic text-[10px] font-mono uppercase tracking-widest text-center py-12 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">Sem dados ainda</div>;
                            }

                            return sorted.map(([key, count]) => {
                                const ch = channelMap[key] || { label: key, color: 'bg-white/20', emoji: '📍' };
                                const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
                                return (
                                    <div key={key} className="group/channel">
                                        <div className="flex justify-between text-[10px] font-mono font-black uppercase tracking-widest mb-3 transition-colors group-hover/channel:text-[var(--accent-primary)]">
                                            <span className="flex items-center gap-2 opacity-60">
                                                {ch.emoji} {ch.label}
                                            </span>
                                            <span className="opacity-100">{count} leads <span className="text-[var(--text-muted)] pl-2">// {pct.toFixed(0)}%</span></span>
                                        </div>
                                        <div className="w-full bg-[var(--bg-primary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-subtle)] shadow-inner">
                                            <div className={`${ch.color} h-full transition-all duration-1000 group-hover/channel:opacity-100 opacity-60`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Inventory Alerts List */}
                <div className="bg-[var(--bg-elevated)] p-10 rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-10" />
                    <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-[var(--text-muted)] mb-10 flex items-center gap-3">
                        <Package size={14} className="text-red-500" /> Alerta de Estoque
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {products.filter(p => p.stock_alert && p.stock_quantity <= (p.stock_alert_min || 1)).length > 0 ? (
                            products.filter(p => p.stock_alert && p.stock_quantity <= (p.stock_alert_min || 1)).map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => onEditProduct(p)}
                                    className="flex items-center justify-between p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl group/item hover:border-red-500/30 transition-all cursor-pointer"
                                >
                                    <div>
                                        <div className="text-[11px] font-black uppercase leading-tight italic tracking-tighter group-hover/item:text-red-500 transition-colors">{p.name}</div>
                                        <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-50">{p.category}</div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest border ${p.stock_quantity === 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                        {p.stock_quantity <= 0 ? 'Esgotado' : `${p.stock_quantity} restante`}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center py-10">
                                <div className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 italic opacity-60">Estoque normal — todos os produtos OK</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Financial Breakdown Section */}
            {(() => {
                const convertedLeads = leads.filter(l => l.status === 'converted');
                const totalBruto = convertedLeads.reduce((acc, l) => acc + (l.final_value || 0), 0);
                const totalIago = convertedLeads.reduce((acc, l) => acc + (l.commission_value || 0), 0);
                const totalTecnico = convertedLeads
                    .filter(l => l.performed_by_partner)
                    .reduce((acc, l) => {
                        return acc + (l.interest_type === 'manutencao'
                            ? ((l.final_value || 0) - (l.cost_value || 0)) * 0.5
                            : (l.commission_service ? (l.final_value || 0) * 0.03 : 0));
                    }, 0);
                const totalCusto = convertedLeads.reduce((acc, l) => acc + (l.cost_value || 0), 0);
                const totalLoja = totalBruto - totalIago - totalTecnico - totalCusto;

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-[var(--bg-elevated)] p-10 rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-10" />
                            <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-[var(--text-muted)] mb-10 flex items-center gap-3">
                                <TrendingUp size={14} className="text-green-500" /> Resumo Financeiro
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Loja Card */}
                                <div className="bg-[var(--bg-primary)] p-8 rounded-2xl border border-green-500/20 relative overflow-hidden group/card hover:border-green-500/40 transition-all">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-[0.03] blur-2xl" />
                                    <div className="relative">
                                        <div className="text-[9px] font-mono font-black text-green-400 opacity-60 uppercase tracking-widest mb-3">Loja (Líquido)</div>
                                        <div className="text-3xl font-display font-bold chrome-text leading-tight mb-2">
                                            R$ {totalLoja.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                                            Bruto: {totalBruto.toLocaleString('pt-BR')} // Custo: {totalCusto.toLocaleString('pt-BR')}
                                        </div>
                                    </div>
                                </div>

                                {/* Iago Card */}
                                <div className="bg-[var(--bg-primary)] p-8 rounded-2xl border border-[var(--accent-primary)]/20 relative overflow-hidden group/card hover:border-[var(--accent-primary)]/40 transition-all">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--accent-primary)] opacity-[0.03] blur-2xl" />
                                    <div className="relative">
                                        <div className="text-[9px] font-mono font-black text-[var(--accent-primary)] opacity-60 uppercase tracking-widest mb-3">Comissão Iago (Mkt)</div>
                                        <div className="text-3xl font-display font-bold chrome-text leading-tight mb-2">
                                            R$ {totalIago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                                            Comissão de ecossistema gerenciada
                                        </div>
                                    </div>
                                </div>

                                {/* Tecnico Card */}
                                <div className="bg-[var(--bg-primary)] p-8 rounded-2xl border border-purple-500/20 relative overflow-hidden group/card hover:border-purple-500/40 transition-all">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-[0.03] blur-2xl" />
                                    <div className="relative">
                                        <div className="text-[9px] font-mono font-black text-purple-400 opacity-60 uppercase tracking-widest mb-3">Jefferson (Técnico)</div>
                                        <div className="text-3xl font-display font-bold chrome-text leading-tight mb-2">
                                            R$ {totalTecnico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                                            Fluxo de pagamento de técnico parceiro
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Popular Products Sidebar */}
                        <div className="bg-[var(--bg-elevated)] p-8 rounded-2xl border border-[var(--border-subtle)]">
                            <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2">
                                <Eye size={16} className="text-[var(--accent-primary)]" /> Produtos Populares
                            </h3>
                            <div className="space-y-4">
                                {products.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(p => {
                                    const maxViews = Math.max(...products.map(p => p.views || 0), 1);
                                    const pct = ((p.views || 0) / maxViews) * 100;
                                    return (
                                        <div key={p.id}>
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-[var(--text-muted)] truncate max-w-[150px]">{p.name}</span>
                                                <span className="text-[var(--text-primary)]">{p.views || 0} v.</span>
                                            </div>
                                            <div className="w-full bg-[var(--border-subtle)] h-2 rounded-full overflow-hidden">
                                                <div className="bg-[var(--accent-primary)] h-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
