// Redeploy triggered after author fix
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, TrendingUp, CheckCircle, Clock, Package, Plus, Trash2, Edit, RefreshCw, LogOut, X, CheckCircle2, Eye, Star, Sparkles, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { syncTinyProductsToSupabase } from '@/lib/tiny';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'products' | 'reviews'>('dashboard');
    const [leads, setLeads] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    async function fetchLeads() {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Erro ao buscar leads no Admin:", error.message);
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
        fetchProducts();
        fetchReviews();

        // Inscreve para atualizações em tempo real nos leads
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

        const { error } = await supabase
            .from('leads')
            .update({
                status: 'converted',
                final_value: val,
                cost_value: cost,
                commission_value: totalIagoEarnings,
                commission_ecosystem: commissionForm.ecosystemCaptured,
                commission_service: commissionForm.executor === 'iago',
                performed_by_partner: commissionForm.executor === 'partner',
                converted_at: new Date().toISOString()
            })
            .eq('id', selectedLeadForCommission.id);

        if (!error) {
            setShowCommissionModal(false);
            fetchLeads();
        } else {
            console.error("Supabase Error Details:", error);
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

            alert("✅ Produto salvo com sucesso!");
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

    const handleSyncProducts = async () => {
        if (!confirm("Isso irá atualizar o estoque e preços baseados no Tiny ERP (Olist). Prosseguir?")) return;
        
        setLoading(true);
        try {
            const result = await syncTinyProductsToSupabase();
            alert(`✅ Sincronização concluída! ${result.count} produtos atualizados/inseridos.`);
            fetchProducts();
        } catch (err: any) {
            console.error("Erro na sincronização:", err);
            alert("❌ Falha na sincronização: " + (err.message || "Verifique as credenciais do Tiny no .env"));
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            setLoading(true);
            try {
                const { error } = await supabase.from('products').delete().eq('id', id);
                if (error) throw error;
                alert("✅ Produto excluído!");
                fetchProducts();
            } catch (err: any) {
                console.error("Erro ao excluir produto:", err);
                alert("❌ Erro ao excluir: " + (err.message || "Erro desconhecido."));
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

        const prompt = `Como um analista de dados especialista em CX (Customer Experience), analise os seguintes depoimentos dos clientes da Cyber Tech:
        
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

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter">CYBER <span className="text-blue-500">ADMIN</span></h1>
                        <p className="text-white/40">Controle total da Cyber Tech</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest">Acesso Autorizado</div>
                            <div className="text-sm font-bold text-blue-400">{userEmail}</div>
                        </div>

                        <div className="glass p-4 rounded-2xl flex items-center gap-4 bg-white/5 border border-white/10">
                            <TrendingUp className="text-green-500" />
                            <div>
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Minhas Comissões (Iago)</div>
                                <div className="text-xl font-black">R$ {leads.filter(l => l.status === 'converted').reduce((acc, l) => acc + (l.commission_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>

                        {installable && (
                            <button
                                onClick={handleInstallPWA}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
                            >
                                <Smartphone size={16} /> Instalar Painel
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl border border-red-500/20 transition-all group"
                            title="Sair do Sistema"
                        >
                            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </header>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'leads' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                        <Users size={18} /> Leads & Vendas
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                        <Package size={18} /> Estoque Showroom
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'reviews' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                        <Star size={18} /> Depoimentos
                    </button>
                </div>

                {activeTab === 'dashboard' ? (
                    <div className="space-y-8">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="glass p-6 rounded-3xl bg-white/5 border border-white/10">
                                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Receita Total</div>
                                <div className="text-3xl font-black text-white">
                                    R$ {leads.filter(l => l.status === 'converted').reduce((acc, l) => acc + (l.final_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1">
                                    <TrendingUp size={12} /> +{leads.filter(l => l.status === 'converted').length} vendas fechadas
                                </div>
                            </div>

                            <div className="glass p-6 rounded-3xl bg-white/5 border border-white/10">
                                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Total de Leads</div>
                                <div className="text-3xl font-black text-white">{leads.length}</div>
                                <div className="text-[10px] text-blue-400 font-bold mt-2 uppercase tracking-tight">Captação em tempo real</div>
                            </div>

                            <div className="glass p-6 rounded-3xl bg-white/5 border border-white/10">
                                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Taxa de Conversão</div>
                                <div className="text-3xl font-black text-white">
                                    {leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0}%
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-1000"
                                        style={{ width: `${leads.length > 0 ? (leads.filter(l => l.status === 'converted').length / leads.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="glass p-6 rounded-3xl bg-white/5 border border-white/10">
                                <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Baixo Estoque</div>
                                <div className={`text-3xl font-black ${products.filter(p => p.stock_quantity <= 3).length > 0 ? 'text-red-500' : 'text-white'}`}>
                                    {products.filter(p => p.stock_quantity <= 3).length}
                                </div>
                                <div className="text-[10px] text-white/40 font-bold mt-2 uppercase">Produtos com {"<"} 4 un.</div>
                            </div>
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
                                            outros: { label: 'Outros', color: 'bg-white/20', emoji: '🌐' },
                                        };

                                        const channels = leads.reduce((acc: Record<string, number>, l) => {
                                            const src = l.marketing_source || 'direto';
                                            acc[src] = (acc[src] || 0) + 1;
                                            return acc;
                                        }, {});

                                        const sorted = Object.entries(channels).sort((a, b) => b[1] - a[1]);

                                        if (sorted.length === 0) {
                                            return <div className="text-white/20 italic text-sm text-center py-8">Nenhum lead rastreado ainda.</div>;
                                        }

                                        return sorted.map(([key, count]) => {
                                            const ch = channelMap[key] || { label: key, color: 'bg-white/20', emoji: '📌' };
                                            const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
                                            return (
                                                <div key={key}>
                                                    <div className="flex justify-between text-xs font-bold mb-1">
                                                        <span className="text-white/60">{ch.emoji} {ch.label}</span>
                                                        <span>{count} ({pct.toFixed(0)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                        <div className={`${ch.color} h-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Inventory Alerts List */}
                            <div className="glass p-8 rounded-[40px] border border-white/10 bg-white/5">
                                <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2">
                                    <Package size={16} className="text-blue-500" /> Alertas de Reposição
                                </h3>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {products.filter(p => p.stock_quantity <= 3).length > 0 ? (
                                        products.filter(p => p.stock_quantity <= 3).map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                <div>
                                                    <div className="text-sm font-bold">{p.name}</div>
                                                    <div className="text-[10px] text-white/30 uppercase">{p.category}</div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-black ${p.stock_quantity === 0 ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                    {p.stock_quantity} UNID.
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-white/20 italic text-sm">
                                            Estoque saudável em todos os itens.
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
                                    <div className="lg:col-span-2">
                                        <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2">
                                            <TrendingUp size={16} className="text-green-500" /> Extrato de Repasses (Acumulado)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Loja Card */}
                                            <div className="glass p-6 rounded-3xl bg-white/5 border border-green-500/20 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
                                                <div className="relative">
                                                    <div className="text-[10px] text-green-400/60 uppercase font-black tracking-widest mb-1">Lucro da Loja (João)</div>
                                                    <div className="text-2xl font-black text-green-400">
                                                        R$ {totalLoja.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[10px] text-white/30 mt-2">
                                                        Bruto: R$ {totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Peças: R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Iago Card */}
                                            <div className="glass p-6 rounded-3xl bg-white/5 border border-blue-500/20 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                                                <div className="relative">
                                                    <div className="text-[10px] text-blue-400/60 uppercase font-black tracking-widest mb-1">Comissões Iago</div>
                                                    <div className="text-2xl font-black text-blue-400">
                                                        R$ {totalIago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[10px] text-white/30 mt-2 line-clamp-1">
                                                        {convertedLeads.filter(l => l.commission_ecosystem).length} via Eco · {convertedLeads.filter(l => l.commission_service).length} Exec.
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Técnico Card */}
                                            <div className="glass p-6 rounded-3xl bg-white/5 border border-purple-500/20 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
                                                <div className="relative">
                                                    <div className="text-[10px] text-purple-400/60 uppercase font-black tracking-widest mb-1">Repasse Técnico</div>
                                                    <div className="text-2xl font-black text-purple-400">
                                                        R$ {totalTecnico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-[10px] text-white/30 mt-2">
                                                        {convertedLeads.filter(l => l.performed_by_partner).length} ordens executadas
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
                                    <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/10">
                                        <th className="p-6">Cliente</th>
                                        <th className="p-6">Interesse</th>
                                        <th className="p-6">Canal</th>
                                        <th className="p-6">Voucher</th>
                                        <th className="p-6">Operacional</th>
                                        <th className="p-6">Financeiro</th>
                                        <th className="p-6">Ações / Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {leads.length > 0 ? leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6">
                                                <div className="font-bold">{lead.client_name || "Anônimo"}</div>
                                                <div className="text-xs text-white/30 mb-1">{lead.whatsapp || lead.session_id}</div>
                                                {lead.description && (
                                                    <div className="text-[10px] bg-white/5 p-2 rounded text-blue-200 mt-2 border border-white/5 max-w-xs italic leading-relaxed">
                                                        "{lead.description}"
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${lead.interest_type === 'voucher' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {lead.interest_type}
                                                </span>
                                            </td>
                                            <td className="p-6 text-center" title={lead.marketing_source || 'direto'}>
                                                <span className="text-lg">
                                                    {({ 'instagram': '📸', 'facebook': '👥', 'google_ads': '🔍', 'google_organico': '🌱', 'whatsapp': '💬', 'tiktok': '🎵', 'direto': '🔗', 'outros': '🌐' } as Record<string, string>)[lead.marketing_source] || '🔗'}
                                                </span>
                                                <div className="text-[9px] text-white/20 mt-0.5">{lead.marketing_source || 'direto'}</div>
                                                {lead.campaign_name && <div className="text-[8px] text-blue-400/60 font-black uppercase tracking-tighter mt-1">{lead.campaign_name}</div>}
                                            </td>
                                            <td className="p-6 font-mono text-xs text-blue-300">{lead.voucher_code}</td>
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
                                                            <option value="analysis" className="bg-black">EM ANÁLISE</option>
                                                            <option value="parts" className="bg-black">AGUARD. PEÇA</option>
                                                            <option value="maintenance" className="bg-black">MANUTENÇÃO</option>
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
                                                        📸 GERAR CARD
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
                                    <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/10">
                                        <th className="p-6">Cliente / Voucher</th>
                                        <th className="p-6">Avaliação</th>
                                        <th className="p-6">Comentário</th>
                                        <th className="p-6">Data</th>
                                        <th className="p-6 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {reviews.length > 0 ? reviews.map((review) => (
                                        <tr key={review.id} className={`hover:bg-white/[0.02] transition-colors ${!review.is_approved ? 'bg-blue-500/5' : ''}`}>
                                            <td className="p-6">
                                                <div className="font-bold">{review.user_name}</div>
                                                <div className="text-[10px] font-mono text-blue-400">{review.voucher_code}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={12} className={i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"} />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-6 max-w-xs">
                                                <p className="text-white/70 italic text-xs leading-relaxed">"{review.comment}"</p>
                                            </td>
                                            <td className="p-6 text-[10px] text-white/20 uppercase font-bold">
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
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleSyncProducts}
                                disabled={loading}
                                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                            >
                                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                                {loading ? 'Sincronizando...' : 'Sincronizar com Olist (Tiny)'}
                            </button>
                            <button
                                onClick={() => {
                                    setEditingProduct(null);
                                    setPreviewUrls([]);
                                    setShowProductForm(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                            >
                                <Plus size={20} /> Novo Produto
                            </button>
                        </div>

                        {showProductForm && (
                            <form onSubmit={handleSaveProduct} className="glass p-8 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                                <h3 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input name="name" defaultValue={editingProduct?.name} placeholder="Nome do Produto" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" required />
                                    <select name="category" defaultValue={editingProduct?.category || 'kit'} className="bg-black border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none">
                                        <option value="kit">Kit Gamer</option>
                                        <option value="smartphone">Smartphone</option>
                                        <option value="notebook">Notebook</option>
                                        <option value="hardware">Hardware</option>
                                    </select>
                                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="Preço (R$)" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" required />
                                    <input name="stock" type="number" defaultValue={editingProduct?.stock_quantity} placeholder="Estoque" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" required />
                                    <input name="sku" defaultValue={editingProduct?.sku} placeholder="SKU (Olist/Estoque)" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none" />
                                    <div className="md:col-span-2 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">Especificações (JSON)</label>
                                            <textarea name="specs" defaultValue={editingProduct?.specs ? JSON.stringify(editingProduct.specs) : ''} placeholder='Ex: {"cpu": "i5", "ram": "16GB"}' className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none h-24 font-mono text-sm" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 block">URLs das Imagens (Uma por linha)</label>
                                            <textarea
                                                name="image_urls"
                                                defaultValue={editingProduct?.image_urls?.join('\n') || ''}
                                                onChange={(e) => {
                                                    const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                                                    setPreviewUrls(urls);
                                                }}
                                                placeholder='https://exemplo.com/imagem1.jpg'
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none h-24 font-mono text-sm"
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
                                <div key={p.id} className="glass p-6 rounded-3xl border border-white/10 bg-white/5 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded italic text-center">
                                            {p.category}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => {
                                                setEditingProduct(p);
                                                setPreviewUrls(p.image_urls || []);
                                                setShowProductForm(true);
                                            }} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-bold mb-1">{p.name}</h4>
                                    <div className="text-2xl font-black mb-4">R$ {p.price?.toLocaleString('pt-BR')}</div>
                                    <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                                        <span className="text-white/40">Estoque: <span className={p.stock_quantity > 0 ? "text-green-400" : "text-red-400"}>{p.stock_quantity}</span></span>
                                        {p.sku && <span className="text-white/20 font-mono text-[10px]">SKU: {p.sku}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Card Social */}
            {showSocialCard && socialCardLead && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="max-w-sm w-full space-y-4">
                        <div className="flex items-center justify-between text-white/40 text-xs font-bold uppercase">
                            <span>📸 Card para Redes Sociais</span>
                            <button onClick={() => setShowSocialCard(false)} className="hover:text-white"><X size={18} /></button>
                        </div>

                        {/* The Card — screenshot this! */}
                        <div className="bg-gradient-to-br from-[#0a0a0a] via-[#111] to-black border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            {/* Glow */}
                            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />

                            <div className="relative">
                                {/* Logo */}
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6">CYBER TECH • Bragança Paulista</div>

                                {/* Service Type Badge */}
                                <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${socialCardLead.interest_type === 'pc_build' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' :
                                    socialCardLead.interest_type === 'manutencao' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                        'bg-green-500/20 text-green-400 border border-green-500/20'
                                    }`}>
                                    {socialCardLead.interest_type === 'pc_build' ? '🖥️ Montagem Concluída' :
                                        socialCardLead.interest_type === 'manutencao' ? '🔧 Manutenção Concluída' :
                                            '✅ Serviço Concluído'}
                                </div>

                                {/* Client */}
                                <div className="text-3xl font-black italic uppercase tracking-tight mb-2">
                                    {socialCardLead.client_name || "Cliente"}
                                </div>

                                {/* Description */}
                                {socialCardLead.description && (
                                    <div className="text-sm text-white/50 leading-relaxed mb-6 italic">
                                        "{socialCardLead.description.slice(0, 120)}{socialCardLead.description.length > 120 ? '...' : ''}"
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="border-t border-white/5 mb-6" />

                                {/* Value */}
                                {socialCardLead.final_value > 0 && (
                                    <div className="flex items-end justify-between mb-4">
                                        <div className="text-[10px] text-white/30 uppercase font-bold">Valor Total</div>
                                        <div className="text-2xl font-black text-green-400">R$ {socialCardLead.final_value?.toLocaleString('pt-BR')}</div>
                                    </div>
                                )}

                                {/* Voucher */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-[9px] text-white/30 uppercase font-black tracking-widest">Código do Cliente</div>
                                        <div className="text-lg font-black font-mono text-blue-400">{socialCardLead.voucher_code}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-white/30 uppercase font-black tracking-widest">Garantia</div>
                                        <div className="text-sm font-black text-white">90 dias</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-6 text-[9px] text-white/20 text-center uppercase tracking-widest">
                                    cybertech.com.br • @cybertechbraganca
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-white/30 text-xs italic">
                            Tire um print do card acima para postar! 📱
                        </p>
                    </div>
                </div>
            )}

            {/* Modal de Comissões */}
            {showCommissionModal && selectedLeadForCommission && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <form onSubmit={submitCommissionForm} className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-lg w-full relative">
                        <button type="button" onClick={() => setShowCommissionModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white"><X size={20} /></button>

                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-green-500" size={24} />
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Fechar Venda</h2>
                        </div>
                        <p className="text-sm text-white/50 mb-8 border-b border-white/10 pb-4">
                            Cliente: <strong className="text-white">{selectedLeadForCommission.client_name || "Anônimo"}</strong> <br />
                            Serviço: <span className="uppercase text-blue-400 font-bold text-xs">{selectedLeadForCommission.interest_type}</span>
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Valor Faturado Bruto (R$)</label>
                                <input
                                    type="number" step="0.01" required
                                    value={commissionForm.finalValue}
                                    onChange={(e) => setCommissionForm({ ...commissionForm, finalValue: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                                    placeholder="Ex: 5000.00"
                                />
                            </div>

                            {(selectedLeadForCommission.interest_type === 'manutencao' || selectedLeadForCommission.interest_type === 'pc_build') && (
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Custo de Peças/Componentes (R$)</label>
                                    <input
                                        type="number" step="0.01"
                                        value={commissionForm.costValue}
                                        onChange={(e) => setCommissionForm({ ...commissionForm, costValue: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50"
                                        placeholder="Ex: 800.00 (opcional)"
                                    />
                                    <p className="text-[10px] text-white/30 mt-1">* Descontado do lucro líquido da loja. Não afeta as comissões do Iago.</p>
                                </div>
                            )}

                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="relative flex items-center bg-black border border-white/20 rounded-md w-6 h-6 shrink-0 group-hover:border-blue-500 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={commissionForm.ecosystemCaptured}
                                            onChange={(e) => setCommissionForm({ ...commissionForm, ecosystemCaptured: e.target.checked })}
                                            className="opacity-0 absolute inset-0 cursor-pointer"
                                        />
                                        {commissionForm.ecosystemCaptured && <CheckCircle2 size={16} className="text-blue-500 mx-auto" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">Captação via Ecossistema (+5%)</div>
                                        <div className="text-[10px] text-white/40">O lead veio pelo Site ou Redes Sociais administradas pelo Iago.</div>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Quem executou o serviço?</div>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio" name="executor" value="owner"
                                        checked={commissionForm.executor === 'owner'}
                                        onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value })}
                                        className="w-4 h-4 accent-blue-500"
                                    />
                                    <div className="text-sm font-bold group-hover:text-blue-400 transition-colors">Dono da Loja (João) <span className="font-normal text-[10px] text-white/30 ml-2">Sem taxa</span></div>
                                </label>

                                {selectedLeadForCommission.interest_type !== 'manutencao' && (
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="radio" name="executor" value="iago"
                                            checked={commissionForm.executor === 'iago'}
                                            onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value })}
                                            className="w-4 h-4 accent-blue-500"
                                        />
                                        <div className="text-sm font-bold group-hover:text-blue-400 transition-colors">Iago Lopes <span className="font-normal text-[10px] text-blue-400/50 bg-blue-500/10 px-2 py-0.5 rounded ml-2">+3% Faturamento Bruto</span></div>
                                    </label>
                                )}

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio" name="executor" value="partner"
                                        checked={commissionForm.executor === 'partner'}
                                        onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value })}
                                        className="w-4 h-4 accent-blue-500"
                                    />
                                    <div className="text-sm font-bold group-hover:text-blue-400 transition-colors">
                                        Técnico Parceiro
                                        <span className="font-normal text-[10px] text-purple-400/50 bg-purple-500/10 px-2 py-0.5 rounded ml-2">
                                            {selectedLeadForCommission.interest_type === 'manutencao' ? '50% Lucro Líquido' : '+3% Faturamento Bruto'}
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                    Confirmar Fechamento
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
