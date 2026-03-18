// Redeploy triggered after author fix
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, TrendingUp, CheckCircle, Clock, Package, Plus, Trash2, Edit, RefreshCw, LogOut, X, CheckCircle2, Eye, Star, Sparkles, Smartphone, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { syncTinyProductsToSupabase } from '@/lib/tiny';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'products' | 'reviews'>('dashboard');
    const [leads, setLeads] = useState<any[]>([]);
    const [maintenanceOrders, setMaintenanceOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
      totalLeadValue: 0,
      convertedCount: 0,
      pendingCount: 0,
      avgTicket: 0
    });

    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // Modal de Comissões
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [selectedLeadForCommission, setSelectedLeadForCommission] = useState<any>(null);
    const [commissionForm, setCommissionForm] = useState({
        finalValue: '',
        costValue: '',
        ecosystemCaptured: true,
        executor: 'owner' // 'owner', 'iago', 'partner'
    });

    // Modal de Card Social
    const [showSocialCard, setShowSocialCard] = useState(false);
    const [socialCardLead, setSocialCardLead] = useState<any>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [sentimentAnalysis, setSentimentAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [installable, setInstallable] = useState(false);
    const router = useRouter();

    async function fetchMaintenanceOrders() {
        const { data } = await supabase
            .from('maintenance_orders')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setMaintenanceOrders(data);
    }

    async function fetchLeads() {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar leads não Admin:", error.message);
        }
        if (data) {
            console.log("Leads carregados:", data.length);
            setLeads(data);
        }
        setLoading(false);
    }

    async function fetchProducts() {
        const { data } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setProducts(data);
    }

    async function fetchReviews() {
        const { data } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setReviews(data);
    }

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? null);
            }
        }
        checkUser();
        fetchLeads();
        fetchMaintenanceOrders();
        fetchProducts();
        fetchReviews();

        // Inscreve para atualizaÃ§Ãµes em tempo real nãos leads
        const channel = supabase
            .channel('db-leads-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                () => {
                    fetchLeads();
                }
            )
            .subscribe();

        const handleInstallable = () => setInstallable(true);
        window.addEventListener('pwa-installable', handleInstallable);
        if ((window as any).deferredPrompt) setInstallable(true);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('pwa-installable', handleInstallable);
        };
    }, []);

    const handleInstallPWA = async () => {
        const promptEvent = (window as any).deferredPrompt;
        if (!promptEvent) return;
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
            (window as any).deferredPrompt = null;
            setInstallable(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    const submitCommissionForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeadForCommission) return;

        const val = parseFloat(commissionForm.finalValue) || 0;
        const cost = parseFloat(commissionForm.costValue) || 0;

        let iagoEcosystemPart = commissionForm.ecosystemCaptured ? (val * 0.05) : 0;
        let iagoServicePart = (commissionForm.executor === 'iago') ? (val * 0.03) : 0;

        const totalIagoEarnings = iagoEcosystemPart + iagoServicePart;
        const updateData = {
            status: 'converted',
            final_value: val,
            cost_value: cost,
            commission_value: totalIagoEarnings,
            commission_ecosystem: commissionForm.ecosystemCaptured,
            commission_service: commissionForm.executor === 'iago',
            performed_by_partner: commissionForm.executor === 'partner',
            converted_at: new Date().toISOString()
        };

        // Determine which table to update
        const isLead = leads.some(l => l.id === selectedLeadForCommission.id);
        const tableName = isLead ? 'leads' : 'maintenance_orders';

        const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', selectedLeadForCommission.id);

        if (!error) {
            setShowCommissionModal(false);
            fetchLeads();
            fetchMaintenanceOrders();
        } else {
            console.error("Supabase Error Details:", error);
            // If it's a maintenance_order and failed, maybe columns missing, but we assume schema parity as requested "like leads"
            alert("Erro do Banco de Dados: " + JSON.stringify(error, null, 2));
        }
    };

    const updateStatus = async (leadId: string, newStatus: string) => {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', leadId);
        if (!error) fetchLeads();
    };

    const updatePaymentStatus = async (leadId: string, newPaymentStatus: string) => {
        const { error } = await supabase
            .from('leads')
            .update({ payment_status: newPaymentStatus })
            .eq('id', leadId);
        if (!error) fetchLeads();
    };

    const updateMaintenanceStatus = async (orderId: string, newStatus: string) => {
        // Try updating in leads table first (if it's a lead)
        const { data: leadData } = await supabase.from('leads').select('id').eq('id', orderId).single();
        if (leadData) {
            await updateStatus(orderId, newStatus);
            return;
        }

        const { error } = await supabase
            .from('maintenance_orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        if (!error) fetchMaintenanceOrders();
    };

    const updateMaintenancePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
        // Try updating in leads table first (if it's a lead)
        const { data: leadData } = await supabase.from('leads').select('id').eq('id', orderId).single();
        if (leadData) {
            await updatePaymentStatus(orderId, newPaymentStatus);
            return;
        }

        const { error } = await supabase
            .from('maintenance_orders')
            .update({ payment_status: newPaymentStatus })
            .eq('id', orderId);
        if (!error) fetchMaintenanceOrders();
    };

    const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            const imageUrlsRaw = formData.get('image_urls') as string;
            const imageUrls = imageUrlsRaw ? imageUrlsRaw.split('\n').map(url => url.trim()).filter(url => url.length > 0) : [];

            const productData = {
                name: formData.get('name'),
                category: formData.get('category'),
                price: parseFloat(formData.get('price') as string),
                stock_quantity: parseInt(formData.get('stock') as string),
                specs: JSON.parse(formData.get('specs') as string || "{}"),
                image_urls: imageUrls,
                sku: formData.get('sku')
            };

            let error;
            if (editingProduct) {
                const res = await supabase.from('products').update(productData).eq('id', editingProduct.id);
                error = res.error;
            } else {
                const res = await supabase.from('products').insert(productData);
                error = res.error;
            }

            if (error) throw error;

            alert("â Produto salvo com sucesso!");
            setShowProductForm(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err: any) {
            console.error("Erro ao salvar produto:", err);
            alert("❌ Erro ao salvar produto: " + (err.message || "Verifique as permissões do banco."));
        } finally {
            setLoading(false);
        }
    };

    // Olist synchronization logic removed as per user request (automated stock management preferred)

    const deleteProduct = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            setLoading(true);
            try {
                const { error } = await supabase.from('products').delete().eq('id', id);
                if (error) throw error;
                alert("â Produto excluÃ­do!");
                fetchProducts();
            } catch (err: any) {
                console.error("Erro ao excluir produto:", err);
                alert("â Erro ao excluir: " + (err.message || "Erro desconhecido."));
            } finally {
                setLoading(false);
            }
        }
    };

    const approveReview = async (id: string) => {
        const { error } = await supabase
            .from('reviews')
            .update({ is_approved: true })
            .eq('id', id);
        if (!error) fetchReviews();
    };

    const deleteReview = async (id: string) => {
        if (confirm("Deseja realmente excluir este depoimento?")) {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);
            if (!error) fetchReviews();
        }
    };

    const analyzeReviews = async () => {
        if (reviews.length === 0) return;
        setIsAnalyzing(true);
        const comments = reviews.map(r => `[Nota ${r.rating}/5]: ${r.comment}`).join('\n---\n');

        const prompt = `Como um analista de dados especialista em CX (Customer Experience), analise os seguintes depoimentos dos clientes da Cyber Informática:
        
        DEPOIMENTOS:
        ${comments}
        
        OBJETIVO:
        1. Resuma o sentimento geral em uma frase impactante.
        2. Liste 3 pontos fortes citados.
        3. Liste 1 ponto de melhoria se houver.
        4. Dê um 'Score de Satisfação' de 0 a 100.
        FORMATO: Responda em Markdown curto e direto para um dashboard administrativo.`;

        try {
            const { getGeminiResponse } = await import('@/lib/gemini');
            const response = await getGeminiResponse(prompt);
            setSentimentAnalysis(response);
        } catch (e) {
            console.error("Erro na análise de sentimento:", e);
        }
        setIsAnalyzing(false);
    };

    useEffect(() => {
        if (leads.length > 0) {
            const converted = leads.filter(l => l.status === 'converted');
            const total = converted.reduce((acc, l) => acc + (l.final_value || 0), 0);
            setStats({
                totalLeadValue: total,
                convertedCount: converted.length,
                pendingCount: leads.filter(l => l.status === 'pending').length,
                avgTicket: converted.length > 0 ? total / converted.length : 0
            });
        }
    }, [leads]);

    const getSourceIcon = (source: string) => {
        const sources: Record<string, string> = {
            'instagram': '📸',
            'facebook': '👥',
            'google_ads': '🔍',
            'google_organico': '🌱',
            'whatsapp': '💬',
            'tiktok': '🎵',
            'direto': '🔗',
            'outros': '🌐'
        };
        return sources[source] || '🔗';
    };

    return (
        <div className="min-h-screen bg-[#020406] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[var(--accent-primary)] selection:text-white">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 border-b border-[var(--border-subtle)] pb-12">
                    <div className="relative">
                        <div className="absolute -top-6 -left-6 w-24 h-24 bg-[var(--accent-primary)] opacity-5 blur-3xl rounded-full" />
                        <h1 className="text-4xl font-black italic tracking-tighter chrome-text uppercase leading-none">
                            CYBER <span className="text-[var(--accent-primary)]">CONTROL</span>
                        </h1>
                        <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-[0.4em] mt-2">Industrial Management Terminal</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="hidden lg:block text-right border-r border-[var(--border-subtle)] pr-6">
                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Authenticated Operator</div>
                            <div className="text-xs font-mono font-bold text-[var(--accent-primary)]">{userEmail}</div>
                        </div>

                        <div className="bg-[var(--bg-elevated)] p-5 rounded-2xl flex items-center gap-5 border border-[var(--border-subtle)] group hover:border-[var(--accent-primary)]/30 transition-all shadow-xl">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                                <TrendingUp className="text-green-500" size={20} />
                            </div>
                            <div>
                                <div className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-0.5">Comissões Acumuladas</div>
                                <div className="text-xl font-display font-bold chrome-text tracking-tight">R$ {leads.filter(l => l.status === 'converted').reduce((acc, l) => acc + (l.commission_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {installable && (
                                <button
                                    onClick={handleInstallPWA}
                                    className="p-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] transition-all shadow-lg flex items-center gap-2 group"
                                >
                                    <Smartphone size={18} className="text-[var(--accent-primary)]" />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden sm:inline">Build PWA</span>
                                </button>
                            )}

                            <button
                                onClick={handleLogout}
                                className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 transition-all group"
                                title="Safe Logout"
                            >
                                <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </header>

                <nav className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-4 custom-scrollbar">
                    {[
                        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                        { id: 'leads', label: 'Triage & Leads', icon: Users },
                        { id: 'products', label: 'Showroom Stock', icon: Package },
                        { id: 'maintenance', label: 'Technicals', icon: RefreshCw },
                        { id: 'reviews', label: 'CX / Feedback', icon: Star },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-display font-black uppercase tracking-widest text-[10px] transition-all border shrink-0 ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] border-transparent' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)]'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {activeTab === 'dashboard' ? (
                    <div className="space-y-10">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Receita Total', val: `R$ ${stats.totalLeadValue.toLocaleString('pt-BR')}`, sub: `+${stats.convertedCount} conversões`, color: 'var(--accent-primary)', icon: TrendingUp },
                                { label: 'Active Leads', val: leads.length, sub: `${stats.pendingCount} pendentes`, color: 'var(--accent-primary)', icon: Users },
                                { label: 'Ticket Médio', val: `R$ ${stats.avgTicket.toFixed(0)}`, sub: 'Faturamento/Conversão', color: 'var(--accent-primary)', icon: Package },
                                { label: 'Critical Stock', val: products.filter(p => p.stock_quantity <= 3).length, sub: 'Itens < 4 unidades', color: 'red-500', icon: AlertTriangle }
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

                        {/* Secondary View: Types Breakdown, Marketing Channels and Inventory Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Breakdown by Type */}
                            <div className="glass p-8 rounded-[40px] border border-white/10 bg-white/5">
                                <h3 className="text-sm font-black uppercase italic mb-6">Volume por Segmento</h3>
                                <div className="space-y-6">
                                    {[
                                        { label: 'Manutenção', key: 'manutencao', color: 'bg-blue-500' },
                                        { label: 'PC Builder', key: 'pc_build', color: 'bg-purple-500' },
                                        { label: 'Vendas Diretas', key: 'venda', color: 'bg-green-500' },
                                        { label: 'Brindes/Voucher', key: 'voucher', color: 'bg-yellow-500' }
                                    ].map(type => {
                                        const count = leads.filter(l => l.interest_type === type.key).length;
                                        const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
                                        return (
                                            <div key={type.key}>
                                                <div className="flex justify-between text-xs font-bold mb-2">
                                                    <span className="text-white/60">{type.label}</span>
                                                    <span>{count} ({pct.toFixed(0)}%)</span>
                                                </div>
                                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
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
                            <div className="glass p-8 rounded-[40px] border border-white/10 bg-white/5">
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
                                        const channels = leads.reduce((acc: any, l) => {
                                            const src = l.marketing_source || 'direto';
                                            acc[src] = (acc[src] || 0) + 1;
                                            return acc;
                                        }, {});

                                        const sorted = Object.entries(channels).sort((a: any, b: any) => b[1] - a[1]);

                                        if (sorted.length === 0) {
                                            return <div className="text-[var(--text-muted)] italic text-[10px] font-mono uppercase tracking-widest text-center py-12 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">No Data Stream Detected</div>;
                                        }

                                        return sorted.map(([key, count]: [string, any]) => {
                                            const ch = (channelMap as any)[key] || { label: key, color: 'bg-white/20', emoji: '📍' };
                                            const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
                                            return (
                                                <div key={key} className="group/channel">
                                                    <div className="flex justify-between text-[10px] font-mono font-black uppercase tracking-widest mb-3 transition-colors group-hover/channel:text-[var(--accent-primary)]">
                                                        <span className="flex items-center gap-2 opacity-60">
                                                            {ch.emoji} {ch.label}
                                                        </span>
                                                        <span className="opacity-100">{count} UNITS <span className="text-[var(--text-muted)] pl-2">// {pct.toFixed(0)}%</span></span>
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
                                    <Package size={14} className="text-red-500" /> Inventory Delta
                                </h3>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {products.filter(p => p.stock_quantity <= 3).length > 0 ? (
                                        products.filter(p => p.stock_quantity <= 3).map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl group/item hover:border-red-500/30 transition-all">
                                                <div>
                                                    <div className="text-[11px] font-black uppercase leading-tight italic tracking-tighter group-hover/item:text-red-500 transition-colors">{p.name}</div>
                                                    <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 opacity-50">{p.category}</div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest border ${p.stock_quantity === 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                    {p.stock_quantity <= 0 ? 'Depleted' : `${p.stock_quantity} Left`}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center py-10">
                                            <div className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] italic opacity-40">System Nominal // All Modules Stocked</div>
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
                                        : (l.final_value || 0) * 0.03);
                                }, 0);
                            const totalCusto = convertedLeads.reduce((acc, l) => acc + (l.cost_value || 0), 0);
                            const totalLoja = totalBruto - totalIago - totalTecnico - totalCusto;

                            return (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 bg-[var(--bg-elevated)] p-10 rounded-3xl border border-[var(--border-subtle)] relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-10" />
                                        <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-[var(--text-muted)] mb-10 flex items-center gap-3">
                                            <TrendingUp size={14} className="text-green-500" /> Ledger Settlement (Aggregate)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {/* Loja Card */}
                                            <div className="bg-[var(--bg-primary)] p-8 rounded-2xl border border-green-500/20 relative overflow-hidden group/card hover:border-green-500/40 transition-all">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-[0.03] blur-2xl" />
                                                <div className="relative">
                                                    <div className="text-[9px] font-mono font-black text-green-400 opacity-60 uppercase tracking-widest mb-3">Store Net Yield</div>
                                                    <div className="text-3xl font-display font-bold chrome-text leading-tight mb-2">
                                                        R$ {totalLoja.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                                                        Gross: {totalBruto.toLocaleString('pt-BR')} // Delta: {totalCusto.toLocaleString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Iago Card */}
                                            <div className="bg-[var(--bg-primary)] p-8 rounded-2xl border border-[var(--accent-primary)]/20 relative overflow-hidden group/card hover:border-[var(--accent-primary)]/40 transition-all">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--accent-primary)] opacity-[0.03] blur-2xl" />
                                                <div className="relative">
                                                    <div className="text-[9px] font-mono font-black text-[var(--accent-primary)] opacity-60 uppercase tracking-widest mb-3">Consultant Bounty</div>
                                                    <div className="text-3xl font-display font-bold chrome-text leading-tight mb-2">
                                                        R$ {totalIago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                                                        Ecosystem managed commission
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tecnico Card */}
                                            <div className="bg-[var(--bg-primary)] p-8 rounded-2xl border border-purple-500/20 relative overflow-hidden group/card hover:border-purple-500/40 transition-all">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500 opacity-[0.03] blur-2xl" />
                                                <div className="relative">
                                                    <div className="text-[9px] font-mono font-black text-purple-400 opacity-60 uppercase tracking-widest mb-3">Technical Partition</div>
                                                    <div className="text-3xl font-display font-bold chrome-text leading-tight mb-2">
                                                        R$ {totalTecnico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                                                        External partner payout stream
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Popular Products Sidebar */}
                                    <div className="glass p-8 rounded-[40px] border border-white/10 bg-white/5">
                                        <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2">
                                            <Eye size={16} className="text-blue-500" /> Produtos Populares
                                        </h3>
                                        <div className="space-y-4">
                                            {products.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map(p => {
                                                const maxViews = Math.max(...products.map(p => p.views || 0), 1);
                                                const pct = ((p.views || 0) / maxViews) * 100;
                                                return (
                                                    <div key={p.id}>
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span className="text-white/60 truncate max-w-[120px]">{p.name}</span>
                                                            <span>{p.views || 0} v.</span>
                                                        </div>
                                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${pct}%` }} />
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

                ) : activeTab === 'leads' ? (
                    <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-blue-500" /> Histórico de Leads
                            </div>
                            <button
                                onClick={fetchLeads}
                                className="p-2 hover:bg-white/10 rounded-full transition-all"
                                title="Atualizar dados"
                            >
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                        <div className="overflow-x-auto text-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                                        <th className="p-6">Client / Bio</th>
                                        <th className="p-6">Diagnosis</th>
                                        <th className="p-6">Source</th>
                                        <th className="p-6 text-center">Voucher</th>
                                        <th className="p-6">Production</th>
                                        <th className="p-6">Financial</th>
                                        <th className="p-6 text-right">Yield</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {leads.filter(l => l.interest_type !== 'manutencao').length > 0 ? leads.filter(l => l.interest_type !== 'manutencao').map((lead) => (
                                        <tr key={lead.id} className="hover:bg-[var(--bg-elevated)]/[0.5] transition-colors group">
                                            <td className="p-6">
                                                <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{lead.client_name || "Nexus Guest"}</div>
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
                                                        lead.interest_type === 'manutencao' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    }`}>
                                                        {lead.interest_type}
                                                    </span>
                                                    {lead.intent_type && (
                                                        <span className="text-[8px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                                                            Intent: {lead.intent_type}
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
                                                        {lead.utm_parameters?.utm_campaign && (
                                                            <span className="text-[8px] font-mono text-[var(--accent-primary)]/60 font-bold uppercase truncate max-w-[80px]">{lead.utm_parameters.utm_campaign}</span>
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
                                                <div className="text-[10px] text-white/40 uppercase mb-1 font-bold tracking-widest">Produção / Logística</div>
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                                                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none transition-all ${lead.status === 'converted' ? 'text-green-400 border-green-500/20' :
                                                        lead.status === 'ready' ? 'text-blue-400 border-blue-500/20' :
                                                            lead.status === 'maintenance' || lead.status === 'building' ? 'text-purple-400 border-purple-500/20' :
                                                                'text-yellow-500 border-yellow-500/20'
                                                        }`}
                                                >
                                                    {lead.interest_type === 'manutencao' ? (
                                                        <>
                                                            <option value="pending" className="bg-black">PENDENTE</option>
                                                            <option value="analysis" className="bg-black">EM ANÃLISE</option>
                                                            <option value="parts" className="bg-black">AGUARD. PEÃA</option>
                                                            <option value="maintenance" className="bg-black">MANUTENÃÃO</option>
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
                                                <div className="text-[10px] text-white/40 uppercase mb-1 font-bold tracking-widest">Pagamento</div>
                                                <select
                                                    value={lead.payment_status || 'pending'}
                                                    onChange={(e) => updatePaymentStatus(lead.id, e.target.value)}
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
                                                                <span className="text-[10px] text-purple-400 font-bold">Téc.:</span>
                                                                <span className="text-[10px] font-bold text-purple-400">
                                                                    R$ {(lead.interest_type === 'manutencao'
                                                                        ? ((lead.final_value || 0) - (lead.cost_value || 0)) * 0.5
                                                                        : (lead.final_value || 0) * 0.03).toLocaleString('pt-BR')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-1 opacity-60 italic">
                                                            <span className="text-[10px] text-white/40">Loja:</span>
                                                            <span className="text-[10px] text-white/40">
                                                                R$ {((lead.final_value || 0) - (lead.commission_value || 0) - (lead.performed_by_partner ? (lead.interest_type === 'manutencao' ? ((lead.final_value || 0) - (lead.cost_value || 0)) * 0.5 : (lead.final_value || 0) * 0.03) : 0)).toLocaleString('pt-BR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : "--"}
                                            </td>
                                            <td className="p-6 space-y-2">
                                                {lead.status !== 'converted' && lead.payment_status === 'paid' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedLeadForCommission(lead);
                                                            setCommissionForm({
                                                                finalValue: '',
                                                                costValue: '',
                                                                ecosystemCaptured: true,
                                                                executor: 'owner'
                                                            });
                                                            setShowCommissionModal(true);
                                                        }}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 py-2 rounded-lg transition-all block"
                                                    >
                                                        FINALIZAR COMO VENDIDO
                                                    </button>
                                                )}
                                                {lead.status === 'converted' && (
                                                    <button
                                                        onClick={() => { setSocialCardLead(lead); setShowSocialCard(true); }}
                                                        className="w-full bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/20 text-pink-400 text-[10px] font-black px-4 py-2 rounded-lg transition-all block"
                                                    >
                                                        ð¸ GERAR CARD
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-white/20 italic">
                                                {loading ? "Carregando dados..." : "Nenhum lead encontrado."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'reviews' ? (
                    <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                            <div className="flex items-center gap-2">
                                <Star size={20} className="text-yellow-500" /> Moderação de Depoimentos
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={analyzeReviews}
                                    disabled={isAnalyzing || reviews.length === 0}
                                    className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    Analisar Sentimento (IA)
                                </button>
                                <button
                                    onClick={fetchReviews}
                                    className="p-2 hover:bg-white/10 rounded-full transition-all"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>

                        {sentimentAnalysis && (
                            <div className="mx-6 mt-6 p-6 bg-purple-500/5 border border-purple-500/20 rounded-3xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setSentimentAnalysis(null)} className="text-white/20 hover:text-white"><X size={16} /></button>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 shrink-0">
                                        <Sparkles size={20} />
                                    </div>
                                    <div className="text-sm prose prose-invert max-w-none">
                                        <div className="font-bold text-purple-400 uppercase text-[10px] tracking-widest mb-2">Relatório de IA: Clima dos Clientes</div>
                                        <div className="whitespace-pre-wrap leading-relaxed text-white/80">{sentimentAnalysis}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="overflow-x-auto text-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                                        <th className="p-6">Client / Voucher</th>
                                        <th className="p-6">Rating</th>
                                        <th className="p-6">Content</th>
                                        <th className="p-6">Timestamp</th>
                                        <th className="p-6 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {reviews.length > 0 ? reviews.map((review) => (
                                        <tr key={review.id} className={`hover:bg-[var(--bg-elevated)]/[0.5] transition-colors group ${!review.is_approved ? 'bg-[var(--accent-primary)]/5' : ''}`}>
                                            <td className="p-6">
                                                <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{review.user_name}</div>
                                                <div className="font-mono text-[10px] text-[var(--accent-primary)]">{review.voucher_code}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"} />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-6 max-w-xs">
                                                <p className="text-[var(--text-secondary)] italic text-xs leading-relaxed relative pl-4">
                                                    <span className="absolute left-0 top-0 text-[var(--accent-primary)] opacity-40 font-serif text-2xl leading-none">"</span>
                                                    {review.comment}
                                                    <span className="text-[var(--accent-primary)] opacity-40 font-serif text-2xl leading-none">"</span>
                                                </p>
                                            </td>
                                            <td className="p-6 text-[10px] text-[var(--text-muted)] uppercase font-mono font-bold">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                {!review.is_approved && (
                                                    <button
                                                        onClick={() => approveReview(review.id)}
                                                        className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        Aprovar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-white/20 italic">
                                                Nenhum depoimento encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (activeTab as any) === 'maintenance' ? (
                    <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                            <div className="flex items-center gap-2">
                                <RefreshCw size={20} className="text-blue-500" /> Ordens de Manutenção
                            </div>
                            <button onClick={() => { fetchMaintenanceOrders(); fetchLeads(); }} className="p-2 hover:bg-white/10 rounded-full transition-all">
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                        <div className="overflow-x-auto text-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                                        <th className="p-6">Ticket / Identity</th>
                                        <th className="p-6">Device</th>
                                        <th className="p-6">Workflow</th>
                                        <th className="p-6">Treasury</th>
                                        <th className="p-6 text-right">Settlement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {/* Merge leads of maintenance type into this view */}
                                    {(() => {
                                        const merged = [
                                            ...maintenanceOrders.map(o => ({
                                                id: o.id,
                                                voucher_code: o.voucher_code,
                                                customer_name: (o as any).customer_name,
                                                customer_phone: (o as any).customer_phone || (o as any).customer_email,
                                                equipment_type: (o as any).equipment_type,
                                                problem_description: (o as any).problem_description,
                                                status: o.status,
                                                payment_status: o.payment_status,
                                                final_value: o.final_value,
                                                commission_value: o.commission_value,
                                                cost_value: o.cost_value,
                                                performed_by_partner: o.performed_by_partner,
                                                created_at: o.created_at,
                                                isLead: false
                                            })),
                                            ...leads.filter(l => l.interest_type === 'manutencao').map(l => ({
                                                id: l.id,
                                                voucher_code: l.voucher_code,
                                                customer_name: l.client_name,
                                                customer_phone: l.whatsapp,
                                                equipment_type: 'manutenção', // Force label for consistency
                                                problem_description: l.description,
                                                status: l.status,
                                                payment_status: l.payment_status,
                                                final_value: l.final_value,
                                                commission_value: l.commission_value,
                                                cost_value: l.cost_value,
                                                performed_by_partner: l.performed_by_partner,
                                                created_at: l.created_at,
                                                isLead: true
                                            }))
                                        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                                        if (merged.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-white/20 italic">Nenhuma ordem encontrada.</td>
                                                </tr>
                                            );
                                        }

                                        return merged.map((order) => (
                                            <tr key={order.id} className="hover:bg-[var(--bg-elevated)]/[0.5] transition-colors group">
                                                <td className="p-6">
                                                    <div className="font-mono text-[var(--accent-primary)] font-black text-xs mb-1 tracking-tight">{order.voucher_code}</div>
                                                    <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{order.customer_name || "Nexus Client"}</div>
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
                                                    <div className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Operation Mode</div>
                                                    <select
                                                        value={order.status || 'pending'}
                                                        onChange={(e) => updateMaintenanceStatus(order.id, e.target.value)}
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
                                                    <div className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Treasury Status</div>
                                                    <select
                                                        value={order.payment_status || 'pending'}
                                                        onChange={(e) => updateMaintenancePaymentStatus(order.id, e.target.value)}
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
                                                                    <span className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase">Gross:</span>
                                                                    <span className="font-display font-bold text-sm">R$ {(order.final_value || 0).toLocaleString('pt-BR')}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5 mt-1.5">
                                                                    <span className="text-[9px] font-mono font-black text-[var(--accent-primary)] uppercase tracking-tighter">Ops:</span>
                                                                    <span className="text-[10px] font-mono font-black text-[var(--accent-primary)]">R$ {(order.commission_value || 0).toLocaleString('pt-BR')}</span>
                                                                </div>
                                                                {order.performed_by_partner && (
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <span className="text-[9px] font-mono font-black text-purple-400 uppercase tracking-tighter">Ext:</span>
                                                                        <span className="text-[10px] font-mono font-black text-purple-400">
                                                                            R$ {(((order.final_value || 0) - (order.cost_value || 0)) * 0.5).toLocaleString('pt-BR')}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-1.5 mt-1.5 opacity-40 italic">
                                                                    <span className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase">Net:</span>
                                                                    <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">
                                                                        R$ {((order.final_value || 0) - (order.commission_value || 0) - (order.performed_by_partner ? ((order.final_value || 0) - (order.cost_value || 0)) * 0.5 : 0)).toLocaleString('pt-BR')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                className="w-full h-8 text-[9px] font-mono font-black uppercase tracking-widest bg-[var(--bg-elevated)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)] transition-all"
                                                                onClick={() => {
                                                                    const originalLead = leads.find(l => l.id === order.id);
                                                                    setSelectedLeadForCommission(originalLead || order);
                                                                    setCommissionForm({
                                                                        finalValue: order.final_value?.toString() || '',
                                                                        costValue: order.cost_value?.toString() || '',
                                                                        ecosystemCaptured: (order as any).commission_ecosystem ?? true,
                                                                        executor: order.performed_by_partner ? 'partner' : ((order as any).commission_service ? 'iago' : 'owner')
                                                                    });
                                                                    setShowCommissionModal(true);
                                                                }}
                                                            >
                                                                Log Adjust
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <button 
                                                                className="w-full h-9 text-[9px] font-mono font-black uppercase tracking-widest bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg hover:opacity-90 transition-all shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.2)]"
                                                                onClick={() => {
                                                                    const originalLead = leads.find(l => l.id === order.id);
                                                                    setSelectedLeadForCommission(originalLead || order);
                                                                    setCommissionForm({
                                                                        finalValue: '',
                                                                        costValue: '',
                                                                        ecosystemCaptured: true,
                                                                        executor: 'owner'
                                                                    });
                                                                    setShowCommissionModal(true);
                                                                }}
                                                            >
                                                                Finalize Order
                                                            </button>
                                                            <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] text-center uppercase tracking-widest mt-2">
                                                                Opened: {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setEditingProduct(null);
                                    setPreviewUrls([]);
                                    setShowProductForm(true);
                                }}
                                className="bg-[var(--accent-primary)] text-[var(--bg-primary)] px-8 py-4 rounded-xl font-display font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.2)]"
                            >
                                <Plus size={18} strokeWidth={3} /> Register Component
                            </button>
                        </div>

                        {showProductForm && (
                            <form onSubmit={handleSaveProduct} className="bg-[var(--bg-elevated)] p-10 rounded-3xl border border-[var(--border-subtle)] space-y-8 relative overflow-hidden group/form">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20" />
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-display font-black italic uppercase tracking-tighter chrome-text">
                                        {editingProduct ? 'Update System Interface' : 'Initialize New Entry'}
                                    </h3>
                                    <div className="font-mono text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                        {editingProduct ? `UUID: ${editingProduct.id.slice(0,8)}` : 'Draft Mode'}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Component Name</label>
                                        <input name="name" defaultValue={editingProduct?.name} placeholder="Ex: RTX 4070 SUPER" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Registry Category</label>
                                        <select name="category" defaultValue={editingProduct?.category || 'kit'} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all uppercase appearance-none">
                                            <option value="kit">Kit Gamer</option>
                                            <option value="smartphone">Smartphone</option>
                                            <option value="notebook">Notebook</option>
                                            <option value="hardware">Hardware</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Base Valuation (R$)</label>
                                        <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="0.00" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Inventory Count</label>
                                        <input name="stock" type="number" defaultValue={editingProduct?.stock_quantity} placeholder="0" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Stock Keeping Unit (SKU)</label>
                                        <input name="sku" defaultValue={editingProduct?.sku} placeholder="ERP-SYNC-ID" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs font-mono font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">System Specifications (JSON)</label>
                                            <textarea name="specs" defaultValue={editingProduct?.specs ? JSON.stringify(editingProduct.specs) : ''} placeholder='{"key": "value"}' className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-primary)]/50 outline-none h-32 font-mono text-xs font-bold leading-relaxed transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Asset Catalogs (URL per line)</label>
                                            <textarea
                                                name="image_urls"
                                                defaultValue={editingProduct?.image_urls?.join('\n') || ''}
                                                onChange={(e) => {
                                                    const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                                                    setPreviewUrls(urls);
                                                }}
                                                placeholder='https://assets.nexus.tech/...'
                                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-primary)]/50 outline-none h-32 font-mono text-xs font-bold leading-relaxed transition-all"
                                            />
                                        </div>

                                        {previewUrls.length > 0 && (
                                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                                                {previewUrls.map((url, i) => (
                                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 glass">
                                                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Erro')} />
                                                        <div className="absolute top-0 right-0 bg-black/50 text-[8px] px-1 font-bold">{i + 1}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Salvar</button>
                                    <button type="button" onClick={() => setShowProductForm(false)} className="bg-white/10 text-white/60 px-8 py-3 rounded-xl font-bold">Cancelar</button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((p) => (
                                <div key={p.id} className="bg-[var(--bg-elevated)] p-8 rounded-2xl border border-[var(--border-subtle)] flex flex-col relative group hover:border-[var(--accent-primary)]/30 transition-all shadow-xl overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <div className="flex gap-2">
                                            <button onClick={() => {
                                                setEditingProduct(p);
                                                setPreviewUrls(p.image_urls || []);
                                                setShowProductForm(true);
                                            }} className="p-2 bg-[var(--bg-primary)]/80 backdrop-blur rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-primary)] border border-[var(--border-subtle)] transition-all">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => deleteProduct(p.id)} className="p-2 bg-[var(--bg-primary)]/80 backdrop-blur rounded-lg text-[var(--text-muted)] hover:text-red-500 border border-[var(--border-subtle)] transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start mb-6">
                                        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 px-3 py-1 rounded-full italic">
                                            {p.category}
                                        </span>
                                    </div>

                                    <h4 className="text-xl font-display font-black italic uppercase tracking-tighter mb-2 group-hover:chrome-text transition-all leading-tight">{p.name}</h4>
                                    <div className="text-2xl font-black mb-6 tracking-tighter">R$ {p.price?.toLocaleString('pt-BR')}</div>
                                    
                                    <div className="mt-auto pt-6 border-t border-[var(--border-subtle)] flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Status</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${p.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                                                {p.stock_quantity > 0 ? `Stock: ${p.stock_quantity}` : 'Depleted'}
                                            </span>
                                        </div>
                                        {p.sku && (
                                            <div className="text-right">
                                                <div className="text-[8px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 text-right">Identifier</div>
                                                <div className="text-[10px] font-mono font-bold text-[var(--text-muted)] opacity-60">#{p.sku}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Card Social */}
            {showSocialCard && socialCardLead && (
                <div className="fixed inset-0 bg-[#020406]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                    <div className="max-w-sm w-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                                    <Smartphone size={16} className="text-[var(--accent-primary)]" />
                                </div>
                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Social Asset Generator</span>
                            </div>
                            <button onClick={() => setShowSocialCard(false)} className="p-2 hover:bg-[var(--bg-elevated)] rounded-full transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* The Card — screenshot this! */}
                        <div className="bg-[#0a0a0a] border border-[var(--border-subtle)] rounded-[32px] p-10 relative overflow-hidden shadow-2xl group/card">
                            {/* Industrial Grid Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent-primary) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
                            
                            {/* Glows */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[var(--accent-primary)]/10 blur-[80px]" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-500/5 blur-[80px]" />

                            <div className="relative">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-10">
                                    <div className="text-[8px] font-mono font-black uppercase tracking-[0.4em] text-[var(--text-muted)] leading-relaxed">
                                        Cyber Informática<br />
                                        <span className="text-[var(--accent-primary)]">Bragança Paulista // SP</span>
                                    </div>
                                    <div className="w-10 h-10 border border-[var(--border-subtle)] rounded-xl flex items-center justify-center bg-[var(--bg-primary)] shadow-inner">
                                        <div className="w-4 h-4 rounded-sm bg-[var(--accent-primary)] animate-pulse" />
                                    </div>
                                </div>

                                {/* Service Type Badge */}
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest mb-6 ${socialCardLead.interest_type === 'pc_build' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                    socialCardLead.interest_type === 'manutencao' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20' :
                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-ping ${socialCardLead.interest_type === 'pc_build' ? 'bg-purple-400' : socialCardLead.interest_type === 'manutencao' ? 'bg-[var(--accent-primary)]' : 'bg-green-400'}`} />
                                    {socialCardLead.interest_type === 'pc_build' ? 'System Assembly' :
                                        socialCardLead.interest_type === 'manutencao' ? 'Maintenance Protocol' :
                                            'Success Managed'}
                                </div>

                                {/* Client */}
                                <div className="mb-4">
                                    <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Authenticated Client</div>
                                    <div className="text-4xl font-display font-black italic uppercase tracking-tighter chrome-text leading-none py-1">
                                        {socialCardLead.client_name || "Nexus Unit"}
                                    </div>
                                </div>

                                {/* Description */}
                                {socialCardLead.description && (
                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed mb-10 italic pl-4 border-l-2 border-[var(--accent-primary)]/20">
                                        "{socialCardLead.description.slice(0, 100)}{socialCardLead.description.length > 100 ? '...' : ''}"
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="h-px bg-gradient-to-r from-[var(--border-subtle)] via-[var(--accent-primary)]/20 to-[var(--border-subtle)] mb-8" />

                                {/* Highlights Grid */}
                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div>
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Operational Value</div>
                                        <div className="text-xl font-display font-bold chrome-text">R$ {socialCardLead.final_value?.toLocaleString('pt-BR')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Warranty Lock</div>
                                        <div className="text-xl font-display font-bold text-[var(--text-primary)]">90 DAYS</div>
                                    </div>
                                </div>

                                {/* Voucher */}
                                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent-primary)] opacity-[0.03] rotate-45 translate-x-8 -translate-y-8" />
                                    <div>
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Security Token</div>
                                        <div className="text-lg font-mono font-black text-[var(--accent-primary)] tracking-tight">{socialCardLead.voucher_code}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Verified</div>
                                        <CheckCircle2 size={24} className="text-green-500 ml-auto" />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] text-[8px] font-mono font-black text-[var(--text-muted)] text-center uppercase tracking-[0.4em]">
                                    CYBERINFORMATICA.TECH // @CYBERTECH
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <p className="text-center text-[var(--text-muted)] text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse">
                                Capture snapshot for broadcast
                            </p>
                            <button 
                                onClick={() => setShowSocialCard(false)}
                                className="w-full py-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] font-display font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 transition-all"
                            >
                                Close Terminal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Comissões */}
            {showCommissionModal && selectedLeadForCommission && (
                <div className="fixed inset-0 bg-[#020406]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <form onSubmit={submitCommissionForm} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[32px] p-10 max-w-lg w-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20" />
                        
                        <button type="button" onClick={() => setShowCommissionModal(false)} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                            <X size={24} />
                        </button>

                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <TrendingUp className="text-green-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black italic uppercase tracking-tighter chrome-text leading-tight">Closing Protocol</h2>
                                <p className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest">Financial Settlement Interface</p>
                            </div>
                        </div>
                        
                        <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 my-8 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-mono text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Origin Client</span>
                                <span className="font-display font-bold uppercase italic tracking-tighter text-[var(--text-primary)]">{selectedLeadForCommission.client_name || selectedLeadForCommission.customer_name || "Nexus Unit"}</span>
                            </div>
                            <div className="h-px bg-[var(--border-subtle)] opacity-50" />
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-mono text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Service Class</span>
                                <span className="font-mono font-black text-[var(--accent-primary)] uppercase tracking-tighter">{selectedLeadForCommission.interest_type || selectedLeadForCommission.equipment_type || "Generic_Manutencao"}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Gross Revenue (R$)</label>
                                <input
                                    type="number" step="0.01" required
                                    value={commissionForm.finalValue}
                                    onChange={(e) => setCommissionForm({ ...commissionForm, finalValue: e.target.value })}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-4 text-white font-display font-black text-xl focus:outline-none focus:border-green-500/50 shadow-inner transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            {(selectedLeadForCommission.interest_type === 'manutencao' || 
                              selectedLeadForCommission.interest_type === 'pc_build' || 
                              selectedLeadForCommission.equipment_type ||
                              !selectedLeadForCommission.isLead) && (
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1 text-red-400/80">Material Costs / Parts (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={commissionForm.costValue}
                                        onChange={(e) => setCommissionForm({ ...commissionForm, costValue: e.target.value })}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-mono font-bold focus:outline-none focus:border-red-500/30 transition-all font-mono"
                                        placeholder="0.00"
                                    />
                                    <p className="text-[8px] font-mono font-medium text-[var(--text-muted)] mt-1 px-1 leading-relaxed">* Deduction directly impacts store net profit. Operational commissions remain static.</p>
                                </div>
                            )}

                            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--accent-primary)]/30 transition-all">
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="relative flex items-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg w-6 h-6 shrink-0 group-hover:border-[var(--accent-primary)] transition-all mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={commissionForm.ecosystemCaptured}
                                            onChange={(e) => setCommissionForm({ ...commissionForm, ecosystemCaptured: e.target.checked })}
                                            className="opacity-0 absolute inset-0 cursor-pointer z-10"
                                        />
                                        {commissionForm.ecosystemCaptured && <div className="w-3 h-3 bg-[var(--accent-primary)] rounded-sm mx-auto shadow-[0_0_8px_var(--accent-primary)]" />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest mb-1 group-hover:text-[var(--accent-primary)] transition-colors">Ecosystem Bounty (+5%)</div>
                                        <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-tighter">Lead captured via automated digital interfaces (Site/ADS).</div>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-6 space-y-4">
                                <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Operational Executor</div>

                                <div className="grid grid-cols-1 gap-3">
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group">
                                        <input
                                            type="radio" name="executor" value="owner"
                                            checked={commissionForm.executor === 'owner'}
                                            onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value })}
                                            className="w-4 h-4 accent-[var(--accent-primary)]"
                                        />
                                        <div className="text-xs font-black uppercase tracking-widest group-hover:text-[var(--text-primary)] transition-colors">Nexus Chief (João) <span className="ml-2 font-mono text-[8px] font-bold opacity-40">Base Protocol</span></div>
                                    </label>

                                    {(selectedLeadForCommission.interest_type !== 'manutencao' && !selectedLeadForCommission.equipment_type) && (
                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group">
                                            <input
                                                type="radio" name="executor" value="iago"
                                                checked={commissionForm.executor === 'iago'}
                                                onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value })}
                                                className="w-4 h-4 accent-[var(--accent-primary)]"
                                            />
                                            <div className="text-xs font-black uppercase tracking-widest text-[var(--accent-primary)]">Iago Lopes <span className="ml-2 font-mono text-[8px] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">+3% Total Revenue</span></div>
                                        </label>
                                    )}

                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer group">
                                        <input
                                            type="radio" name="executor" value="partner"
                                            checked={commissionForm.executor === 'partner'}
                                            onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value })}
                                            className="w-4 h-4 accent-[var(--accent-primary)]"
                                        />
                                        <div className="text-xs font-black uppercase tracking-widest text-purple-400">
                                            External Technician
                                            <span className="ml-2 font-mono text-[8px] bg-purple-500/10 px-2 py-0.5 rounded">
                                                {(selectedLeadForCommission.interest_type === 'manutencao' || selectedLeadForCommission.equipment_type) ? '50% Net Profit' : '+3% Total Revenue'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-[var(--accent-primary)] hover:opacity-90 text-[var(--bg-primary)] font-display font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(var(--accent-primary-rgb),0.3)] hover:scale-[1.01]">
                                Confirm Settlement
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
