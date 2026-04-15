// Redeploy triggered after author fix
"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Package, RefreshCw, LogOut, X, CheckCircle2, Star, Sparkles, Smartphone, ShoppingCart, Tag, Zap, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAdminData } from './hooks/useAdminData';
import { useAdminAuth } from './hooks/useAdminAuth';
import { useCommissionForm } from './hooks/useCommissionForm';
import { usePdvForm } from './hooks/usePdvForm';

import { DashboardTab } from './components/DashboardTab';
import { LeadsTab } from './components/LeadsTab';
import { VendasTab } from './components/VendasTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { ProductsTab } from './components/ProductsTab';
import { ReviewsTab } from './components/ReviewsTab';
import { CouponsTab } from './components/CouponsTab';
import { CommissionModal } from './components/CommissionModal';
import { PdvModal } from './components/PdvModal';
import { GlobalSearch } from './components/GlobalSearch';
import { SimulatorTab } from './components/SimulatorTab';
import { MediaTab } from './components/MediaTab';
import { ManualReviewModal } from './components/ManualReviewModal';

import type { TabId } from '@/types/admin';
import type { Lead } from '@/types/lead';
import type { Product } from '@/types/product';

export default function AdminDashboard() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [inboxEdit, setInboxEdit] = useState<Record<string, { name: string; phone: string }>>({});
    const [globalSearch, setGlobalSearch] = useState('');

    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [slugDraft, setSlugDraft] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [productSort, setProductSort] = useState('newest');

    const [showSocialCard, setShowSocialCard] = useState(false);
    const [socialCardLead, setSocialCardLead] = useState<Lead | null>(null);

    const [sentimentAnalysis, setSentimentAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isManualReviewOpen, setIsManualReviewOpen] = useState(false);

    const [manualProductSelect, setManualProductSelect] = useState('');

    const {
        leads,
        maintenanceOrders,
        products,
        reviews,
        coupons,
        loading,
        stats,
        fetchLeads,
        fetchMaintenanceOrders,
        fetchProducts,
        fetchReviews,
        fetchCoupons,
        setLoading,
    } = useAdminData();

    const { userEmail, installable, currentExecutor, handleLogout, handleInstallPWA } = useAdminAuth(router);

    const {
        showCommissionModal,
        selectedLeadForCommission,
        commissionForm,
        setCommissionForm,
        submitCommissionForm,
        openCommissionModal,
        closeCommissionModal,
        getAssemblyExecutor,
    } = useCommissionForm({
        leads,
        products,
        userEmail,
        onRefreshLeads: fetchLeads,
        onRefreshOrders: fetchMaintenanceOrders,
        onRefreshProducts: fetchProducts,
    });

    const {
        showPdvModal,
        pdvForm,
        setPdvForm,
        pdvProductSearch,
        setPdvProductSearch,
        pdvProductCategory,
        setPdvProductCategory,
        pdvProductQty,
        setPdvProductQty,
        openPdvModal,
        closePdvModal,
        submitPdvForm,
    } = usePdvForm({
        products,
        currentExecutor,
        userEmail,
        onRefreshLeads: fetchLeads,
        onRefreshProducts: fetchProducts,
    });

    // Product handlers
    const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            const imageUrlsRaw = formData.get('image_urls') as string;
            const imageUrls = imageUrlsRaw
                ? imageUrlsRaw.split('\n').map(url => url.trim()).filter(url => url.length > 0)
                : [];

            const rawPrice = formData.get('price') as string;
            const parsedPrice = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));

            const productData = {
                name: formData.get('name'),
                slug: slugDraft || null,
                description: formData.get('description') || null,
                category: formData.get('category'),
                price: parsedPrice,
                stock_quantity: parseInt(formData.get('stock') as string),
                specs: JSON.parse((formData.get('specs') as string) || '{}'),
                image_urls: imageUrls,
                sku: formData.get('sku'),
                show_in_showroom: formData.get('show_in_showroom') === 'on',
                show_in_catalog: formData.get('show_in_catalog') === 'on',
                show_in_pcbuilder: formData.get('show_in_pcbuilder') === 'on',
                stock_alert: formData.get('stock_alert') === 'on',
                stock_alert_min: parseInt(formData.get('stock_alert_min') as string) || 1,
                performance_score: parseInt(formData.get('performance_score') as string) || 0,
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

            alert('✅ Produto salvo com sucesso!');
            setShowProductForm(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err: any) {
            console.error('Erro ao salvar produto:', err);
            alert('❌ Erro ao salvar produto: ' + (err.message || 'Verifique as permissões do banco.'));
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            setLoading(true);
            try {
                const { error } = await supabase.from('products').delete().eq('id', id);
                if (error) throw error;
                alert('Produto excluido!');
                fetchProducts();
            } catch (err: any) {
                console.error('Erro ao excluir produto:', err);
                alert('❌ Erro ao excluir: ' + (err.message || 'Erro desconhecido.'));
            } finally {
                setLoading(false);
            }
        }
    };

    // Lead handlers
    const updateStatus = async (leadId: string, newStatus: string) => {
        const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
        if (!error) fetchLeads();
    };

    const updatePaymentStatus = async (leadId: string, newPaymentStatus: string) => {
        const { error } = await supabase
            .from('leads')
            .update({ payment_status: newPaymentStatus })
            .eq('id', leadId);
        if (!error) {
            fetchLeads();
            if (newPaymentStatus === 'paid') {
                const lead = leads.find(l => l.id === leadId);
                if (lead && lead.status !== 'converted') {
                    const autoProducts =
                        (lead.utm_parameters as any)?.product_ids
                            ?.map((id: string) => {
                                const p = products.find(prod => prod.id === id);
                                return p
                                    ? { product_id: p.id, quantity: 1, name: p.name, current_stock: p.stock_quantity }
                                    : null;
                            })
                            .filter(Boolean) || [];
                    openCommissionModal(lead, {
                        finalValue: '',
                        costValue: '',
                        ecosystemCaptured: true,
                        isAssembly: false,
                        executor: getAssemblyExecutor(lead),
                        customCommissionType: 'percent',
                        customCommissionAmount: '',
                        consumedProducts: autoProducts,
                    });
                }
            }
        }
    };

    const convertLead = async (lead: Lead, type: 'venda' | 'upgrade') => {
        const edit = inboxEdit[lead.id];
        const updates: any = { interest_type: type };
        if (edit?.name) updates.client_name = edit.name;
        if (edit?.phone) updates.whatsapp = edit.phone.replace(/\D/g, '');
        await supabase.from('leads').update(updates).eq('id', lead.id);
        fetchLeads();
        openCommissionModal(
            { ...lead, ...updates },
            {
                finalValue: '',
                costValue: '',
                ecosystemCaptured: !!lead.voucher_code,
                isAssembly: false,
                executor: getAssemblyExecutor({ ...lead, interest_type: type }),
                customCommissionType: 'percent',
                customCommissionAmount: '',
                consumedProducts: [],
            }
        );
    };

    const dismissLead = async (leadId: string) => {
        await supabase.from('leads').update({ status: 'dismissed' }).eq('id', leadId);
        fetchLeads();
    };

    const updateMaintenanceStatus = async (orderId: string, newStatus: string) => {
        const { data: leadData } = await supabase.from('leads').select('id').eq('id', orderId).single();
        if (leadData) {
            await updateStatus(orderId, newStatus);
            return;
        }
        const { error, data: orderData } = await supabase
            .from('maintenance_orders')
            .update({ status: newStatus })
            .eq('id', orderId)
            .select()
            .single();
        if (!error) {
            fetchMaintenanceOrders();
            if (newStatus === 'ready' && orderData?.customer_phone) {
                fetch('/api/notifications/maintenance-ready', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        voucherCode: orderData.voucher_code,
                        customerPhone: orderData.customer_phone,
                        customerName: orderData.customer_name,
                        equipment: orderData.equipment_type ?? 'Equipamento',
                    }),
                }).catch(err => console.warn('[NOTIF] Failed to send ready notification:', err));
            }
        }
    };

    const updateMaintenancePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
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

    // Reviews handlers
    const approveReview = async (id: string) => {
        const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id);
        if (!error) fetchReviews();
    };

    const deleteReview = async (id: string) => {
        if (confirm('Deseja realmente excluir este depoimento?')) {
            const { error } = await supabase.from('reviews').delete().eq('id', id);
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
            console.error('Erro na análise de sentimento:', e);
        }
        setIsAnalyzing(false);
    };

    // Nav tabs
    const pendingLeads = leads.filter(
        l =>
            l.status !== 'dismissed' &&
            !['upgrade', 'venda', 'pc_build', 'compra', 'showroom'].includes(l.interest_type || '')
    );
    const tabs = [
        { id: 'dashboard' as TabId, label: 'Painel', icon: LayoutDashboard, badge: null },
        { id: 'leads' as TabId, label: 'Leads', icon: Sparkles, badge: pendingLeads.length > 0 ? pendingLeads.length : null },
        { id: 'products' as TabId, label: 'Produtos', icon: Package, badge: null },
        { id: 'vendas' as TabId, label: 'Vendas', icon: ShoppingCart, badge: null },
        { id: 'upgrade' as TabId, label: 'Upgrades', icon: RefreshCw, badge: null },
        { id: 'reviews' as TabId, label: 'Depoimentos', icon: Star, badge: null },
        { id: 'coupons' as TabId, label: 'Cupons', icon: Tag, badge: null },
        { id: 'simulator' as TabId, label: 'Simulador', icon: Zap, badge: null },
        { id: 'media' as TabId, label: 'Galeria', icon: ImageIcon, badge: null },
    ];

    return (
        <div className="min-h-screen bg-[#020406] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[var(--accent-primary)] selection:text-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 border-b border-[var(--border-subtle)] pb-12">
                    <div className="relative">
                        <div className="absolute -top-6 -left-6 w-24 h-24 bg-[var(--accent-primary)] opacity-5 blur-3xl rounded-full" />
                        <h1 className="text-4xl font-black italic tracking-tighter chrome-text uppercase leading-none">
                            CYBER <span className="text-[var(--accent-primary)]">CONTROL</span>
                        </h1>
                        <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-[0.4em] mt-2">Terminal de Gerenciamento</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="hidden lg:block text-right pr-6">
                            <div className="text-[9px] text-[var(--text-muted)] uppercase font-black tracking-widest mb-1">Operador Autenticado</div>
                            <div className="text-xs font-mono font-bold text-[var(--accent-primary)]">{userEmail}</div>
                        </div>

                        <div className="flex gap-3">
                            {installable && (
                                <button
                                    onClick={handleInstallPWA}
                                    className="p-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl border border-[var(--border-subtle)] transition-all shadow-lg flex items-center gap-2 group"
                                >
                                    <Smartphone size={18} className="text-[var(--accent-primary)]" />
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden sm:inline">Instalar App</span>
                                </button>
                            )}

                            <button
                                onClick={handleLogout}
                                className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 transition-all group"
                                title="Sair com Segurança"
                            >
                                <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Nav */}
                <nav className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-display font-black uppercase tracking-widest text-[10px] transition-all border shrink-0 ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] border-transparent' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)]'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                            {tab.label}
                            {tab.badge !== null && (
                                <span className="ml-1 px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 text-[8px] rounded-full font-mono">{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Global Search */}
                <GlobalSearch
                    globalSearch={globalSearch}
                    setGlobalSearch={setGlobalSearch}
                    leads={leads}
                    maintenanceOrders={maintenanceOrders}
                    onNavigate={setActiveTab}
                />

                {/* Tab Content */}
                {activeTab === 'dashboard' && (
                    <DashboardTab
                        stats={stats}
                        leads={leads}
                        products={products}
                        coupons={coupons}
                        maintenanceOrders={maintenanceOrders}
                        onOpenPdv={openPdvModal}
                        onEditProduct={p => {
                            setEditingProduct(p);
                            setSlugDraft(p.slug || '');
                            setPreviewUrls(p.image_urls || []);
                            setShowProductForm(true);
                            setActiveTab('products');
                        }}
                    />
                )}

                {activeTab === 'products' && (
                    <ProductsTab
                        products={products}
                        loading={loading}
                        onSaveProduct={handleSaveProduct}
                        onDeleteProduct={deleteProduct}
                        editingProduct={editingProduct}
                        setEditingProduct={setEditingProduct}
                        showProductForm={showProductForm}
                        setShowProductForm={setShowProductForm}
                        productFilter={productFilter}
                        setProductFilter={setProductFilter}
                        productSort={productSort}
                        setProductSort={setProductSort}
                        previewUrls={previewUrls}
                        setPreviewUrls={setPreviewUrls}
                        slugDraft={slugDraft}
                        setSlugDraft={setSlugDraft}
                        setLoading={setLoading}
                    />
                )}

                {activeTab === 'leads' && (
                    <LeadsTab
                        leads={leads}
                        loading={loading}
                        inboxEdit={inboxEdit}
                        setInboxEdit={setInboxEdit}
                        onConvertLead={convertLead}
                        onDismissLead={dismissLead}
                        onRefresh={fetchLeads}
                    />
                )}

                {activeTab === 'vendas' && (
                    <VendasTab
                        leads={leads}
                        loading={loading}
                        onRefresh={fetchLeads}
                        onUpdateStatus={updateStatus}
                        onUpdatePaymentStatus={updatePaymentStatus}
                        onOpenCommission={(lead, preset) => openCommissionModal(lead, preset)}
                        onShowSocialCard={lead => { setSocialCardLead(lead); setShowSocialCard(true); }}
                    />
                )}

                {activeTab === 'upgrade' && (
                    <MaintenanceTab
                        maintenanceOrders={maintenanceOrders}
                        leads={leads}
                        loading={loading}
                        onUpdateStatus={updateMaintenanceStatus}
                        onUpdatePaymentStatus={updateMaintenancePaymentStatus}
                        onOpenCommission={(item, preset) => openCommissionModal(item, preset)}
                        onRefresh={() => { fetchMaintenanceOrders(); fetchLeads(); }}
                    />
                )}

                {/* {activeTab === 'products' && (
                    <ProductsTab
                        products={products}
                        loading={loading}
                        onSaveProduct={handleSaveProduct}
                        onDeleteProduct={deleteProduct}
                        editingProduct={editingProduct}
                        setEditingProduct={setEditingProduct}
                        showProductForm={showProductForm}
                        setShowProductForm={setShowProductForm}
                        productFilter={productFilter}
                        setProductFilter={setProductFilter}
                        productSort={productSort}
                        setProductSort={setProductSort}
                        previewUrls={previewUrls}
                        setPreviewUrls={setPreviewUrls}
                        slugDraft={slugDraft}
                        setSlugDraft={setSlugDraft}
                        setLoading={setLoading}
                    />
                )} */}

                {activeTab === 'reviews' && (
                    <ReviewsTab
                        reviews={reviews}
                        loading={loading}
                        sentimentAnalysis={sentimentAnalysis}
                        isAnalyzing={isAnalyzing}
                        onApprove={approveReview}
                        onDelete={deleteReview}
                        onAnalyze={analyzeReviews}
                        onRefresh={fetchReviews}
                        onClearSentiment={() => setSentimentAnalysis(null)}
                        onOpenManual={() => setIsManualReviewOpen(true)}
                    />
                )}

                {activeTab === 'coupons' && (
                    <CouponsTab
                        coupons={coupons}
                        products={products}
                        loading={loading}
                        onRefresh={fetchCoupons}
                    />
                )}
                
                {activeTab === 'simulator' && (
                    <SimulatorTab />
                )}

                {activeTab === 'media' && (
                    <MediaTab />
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
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent-primary) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
                            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[var(--accent-primary)]/10 blur-[80px]" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-blue-500/5 blur-[80px]" />

                            <div className="relative">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="text-[8px] font-mono font-black uppercase tracking-[0.4em] text-[var(--text-muted)] leading-relaxed">
                                        Cyber Informática<br />
                                        <span className="text-[var(--accent-primary)]">Bragança Paulista // SP</span>
                                    </div>
                                    <div className="w-10 h-10 border border-[var(--border-subtle)] rounded-xl flex items-center justify-center bg-[var(--bg-primary)] shadow-inner">
                                        <div className="w-4 h-4 rounded-sm bg-[var(--accent-primary)] animate-pulse" />
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest mb-6 ${socialCardLead.interest_type === 'pc_build' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                    socialCardLead.interest_type === 'upgrade' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20' :
                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-ping ${socialCardLead.interest_type === 'pc_build' ? 'bg-purple-400' : socialCardLead.interest_type === 'upgrade' ? 'bg-[var(--accent-primary)]' : 'bg-green-400'}`} />
                                    {socialCardLead.interest_type === 'pc_build' ? 'Montagem de Sistema' :
                                        socialCardLead.interest_type === 'upgrade' ? 'Projeto de Upgrade' :
                                            'Sucesso Gerenciado'}
                                </div>

                                <div className="mb-4">
                                    <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Cliente Autenticado</div>
                                    <div className="text-4xl font-display font-black italic uppercase tracking-tighter chrome-text leading-none py-1">
                                        {socialCardLead.client_name || 'Nexus Unit'}
                                    </div>
                                </div>

                                {socialCardLead.description && (
                                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed mb-10 italic pl-4 border-l-2 border-[var(--accent-primary)]/20">
                                        "{socialCardLead.description.slice(0, 100)}{socialCardLead.description.length > 100 ? '...' : ''}"
                                    </div>
                                )}

                                <div className="h-px bg-gradient-to-r from-[var(--border-subtle)] via-[var(--accent-primary)]/20 to-[var(--border-subtle)] mb-8" />

                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div>
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Valor da Operação</div>
                                        <div className="text-xl font-display font-bold chrome-text">R$ {socialCardLead.final_value?.toLocaleString('pt-BR')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Garantia Selada</div>
                                        <div className="text-xl font-display font-bold text-[var(--text-primary)]">90 DIAS</div>
                                    </div>
                                </div>

                                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--accent-primary)] opacity-[0.03] rotate-45 translate-x-8 -translate-y-8" />
                                    <div>
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Token de Segurança</div>
                                        <div className="text-lg font-mono font-black text-[var(--accent-primary)] tracking-tight">{socialCardLead.voucher_code}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Verificado</div>
                                        <CheckCircle2 size={24} className="text-green-500 ml-auto" />
                                    </div>
                                </div>

                                <div className="mt-10 pt-6 border-t border-[var(--border-subtle)] text-[8px] font-mono font-black text-[var(--text-muted)] text-center uppercase tracking-[0.4em]">
                                    CYBERINFORMATICA.TECH // @CYBERTECH
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <p className="text-center text-[var(--text-muted)] text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse">
                                Capturar tela para transmissão
                            </p>
                            <button
                                onClick={() => setShowSocialCard(false)}
                                className="w-full py-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] font-display font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 transition-all"
                            >
                                Fechar Terminal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDV Modal */}
            <PdvModal
                showPdvModal={showPdvModal}
                pdvForm={pdvForm}
                setPdvForm={setPdvForm}
                pdvProductSearch={pdvProductSearch}
                setPdvProductSearch={setPdvProductSearch}
                pdvProductCategory={pdvProductCategory}
                setPdvProductCategory={setPdvProductCategory}
                pdvProductQty={pdvProductQty}
                setPdvProductQty={setPdvProductQty}
                submitPdvForm={submitPdvForm}
                closePdvModal={closePdvModal}
                products={products}
                currentExecutor={currentExecutor}
            />

            {/* Commission Modal */}
            <CommissionModal
                show={showCommissionModal}
                selectedLead={selectedLeadForCommission}
                commissionForm={commissionForm}
                setCommissionForm={setCommissionForm}
                products={products}
                manualProductSelect={manualProductSelect}
                setManualProductSelect={setManualProductSelect}
                onSubmit={submitCommissionForm}
                onClose={closeCommissionModal}
            />

            <ManualReviewModal
                isOpen={isManualReviewOpen}
                onClose={() => setIsManualReviewOpen(false)}
                onSuccess={fetchReviews}
            />
        </div>
    );
}
