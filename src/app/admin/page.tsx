// Redeploy triggered after author fix
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, TrendingUp, CheckCircle, Clock, Package, Plus, Trash2, Edit, RefreshCw, LogOut, X, CheckCircle2, Eye, Star, Sparkles, Smartphone, AlertTriangle, Search, ShoppingCart } from 'lucide-react';
import { sourceLabel } from '@/lib/tracking/sources';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'vendas' | 'maintenance' | 'products' | 'reviews'>('dashboard');
    const [inboxEdit, setInboxEdit] = useState<Record<string, { name: string; phone: string }>>({});
    const [globalSearch, setGlobalSearch] = useState('');
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
    const [slugDraft, setSlugDraft] = useState('');

    const generateSlug = (name: string) =>
        name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Modal de Comissões
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [selectedLeadForCommission, setSelectedLeadForCommission] = useState<any>(null);
    const [commissionForm, setCommissionForm] = useState({
        finalValue: '',
        costValue: '',
        ecosystemCaptured: true,
        isAssembly: false,
        executor: 'owner', // 'owner', 'iago', 'partner'
        customCommissionType: 'percent' as 'percent' | 'value',
        customCommissionAmount: '',
        consumedProducts: [] as {product_id: string, quantity: number, name?: string, current_stock?: number}[]
    });

    // PDV Modal (Venda Direta Balcão)
    const [showPdvModal, setShowPdvModal] = useState(false);
    const [pdvForm, setPdvForm] = useState({
        customerName: '',
        discountType: 'fixed' as 'fixed' | 'percentage',
        discountValue: 0,
        ecosystemCaptured: false,
        isAssembly: false,
        executor: 'owner', // 'owner', 'iago', 'partner'
        customCommissionType: 'percent' as 'percent' | 'value',
        customCommissionAmount: '',
        manualFinalValue: '',
        consumedProducts: [] as {product_id: string, quantity: number, name?: string, price: number, current_stock?: number}[]
    });
    // PDV product search/filter state
    const [pdvProductSearch, setPdvProductSearch] = useState('');
    const [pdvProductCategory, setPdvProductCategory] = useState('');
    const [pdvProductQty, setPdvProductQty] = useState(1);

    const [productFilter, setProductFilter] = useState('');
    const [productSort, setProductSort] = useState('newest'); // 'newest', 'oldest', 'price_asc', 'price_desc', 'stock_asc', 'stock_desc'

    const [showSocialCard, setShowSocialCard] = useState(false);
    const [socialCardLead, setSocialCardLead] = useState<any>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    // Derives executor from the logged-in user's email (for order traceability)
    const currentExecutor = userEmail?.toLowerCase().includes('iago') ? 'iago'
        : userEmail?.toLowerCase().includes('jefferson') ? 'partner'
        : 'owner';

    // Detects if a lead is a celular/smartphone maintenance
    const isCelularLead = (lead: any) => {
        const t = (lead?.interest_type || lead?.equipment_type || '').toLowerCase();
        return t.includes('celular') || t.includes('smartphone') || t.includes('phone') || t.includes('mobile');
    };

    // Smart pre-selection of assembly executor based on lead type
    const getAssemblyExecutor = (lead: any) => isCelularLead(lead) ? 'partner' : 'owner';

    const [sentimentAnalysis, setSentimentAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [installable, setInstallable] = useState(false);
    const [productSubTab, setProductSubTab] = useState<'showroom' | 'geral'>('showroom');
    const [manualProductSelect, setManualProductSelect] = useState('');
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

        const digitalSources = ['site', 'instagram', 'facebook', 'insta', 'face', 'direct', 'direto'];
        const isDigital = digitalSources.includes(selectedLeadForCommission.marketing_source?.toLowerCase());
        
        // Marketing (Iago): 8% padrão, 5% se valor > 8000
        let baseRate = 0;
        if (commissionForm.ecosystemCaptured) {
            baseRate = val > 8000 ? 0.05 : 0.08;
        }

        // Assembly commission
        let assemblyRate = 0;
        let techCommission = 0;
        const isCelular = isCelularLead(selectedLeadForCommission);

        if (commissionForm.isAssembly) {
            if (isCelular && commissionForm.executor === 'partner') {
                // Manutenção celular + Jefferson: 50% do lucro líquido
                techCommission = (val - cost) * 0.5;
            } else if (commissionForm.executor === 'iago' || commissionForm.executor === 'partner') {
                // PC/notebook + Iago ou Jefferson: valor personalizado (R$ ou %)
                const customAmt = parseFloat(commissionForm.customCommissionAmount) || 0;
                const customComm = commissionForm.customCommissionType === 'percent'
                    ? val * (customAmt / 100)
                    : customAmt;
                if (commissionForm.executor === 'iago') assemblyRate = customAmt > 0 ? customComm / val : 0.03;
                else techCommission = customAmt > 0 ? customComm : val * 0.03;
            }
        }

        const totalIagoEarnings = (val * baseRate) + (val * assemblyRate);

        const updateData = {
            status: 'converted',
            final_value: val,
            cost_value: cost,
            commission_value: totalIagoEarnings,
            commission_ecosystem: isDigital || commissionForm.ecosystemCaptured,
            commission_service: commissionForm.isAssembly,
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
            // Deduct stock for consumed products
            if (commissionForm.consumedProducts.length > 0) {
                for (const item of commissionForm.consumedProducts) {
                    const product = products.find(p => p.id === item.product_id);
                    if (product && product.stock_quantity >= item.quantity) {
                        await supabase
                            .from('products')
                            .update({ stock_quantity: product.stock_quantity - item.quantity })
                            .eq('id', item.product_id);
                    }
                }
                fetchProducts();
            }

            setShowCommissionModal(false);
            setCommissionForm({ ...commissionForm, consumedProducts: [] });
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

    const convertLead = async (lead: any, type: 'venda' | 'manutencao') => {
        const edit = inboxEdit[lead.id];
        const updates: any = { interest_type: type };
        if (edit?.name) updates.client_name = edit.name;
        if (edit?.phone) updates.whatsapp = edit.phone.replace(/\D/g, '');
        await supabase.from('leads').update(updates).eq('id', lead.id);
        fetchLeads();
        // Open commission modal for this lead
        setSelectedLeadForCommission({ ...lead, ...updates });
        setCommissionForm({
            finalValue: '',
            costValue: '',
            ecosystemCaptured: !!lead.voucher_code,
            isAssembly: false,
            executor: getAssemblyExecutor({ ...lead, interest_type: type }),
            customCommissionType: 'percent',
            customCommissionAmount: '',
            consumedProducts: []
        });
        setShowCommissionModal(true);
    };

    const submitPdvForm = async (e: React.FormEvent) => {
        e.preventDefault();

        const productSubtotal = pdvForm.consumedProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const manualOverride = parseFloat(pdvForm.manualFinalValue) || 0;
        const subtotal = manualOverride > 0 ? manualOverride : productSubtotal;
        const discountAmount = pdvForm.discountType === 'percentage'
            ? subtotal * (pdvForm.discountValue / 100)
            : pdvForm.discountValue;
        const val = Math.max(0, subtotal - discountAmount);

        // Ecossistema: 8% padrão, ou 5% se valor bruto > 8000
        let baseRate = 0;
        if (pdvForm.ecosystemCaptured) {
            baseRate = subtotal > 8000 ? 0.05 : 0.08;
        }

        // Assembly Commission: custom % or R$, fallback to 3%
        let assemblyCommission = 0;
        if (pdvForm.isAssembly && (currentExecutor === 'iago' || currentExecutor === 'partner')) {
            const customAmt = parseFloat(pdvForm.customCommissionAmount) || 0;
            assemblyCommission = customAmt > 0
                ? (pdvForm.customCommissionType === 'percent' ? subtotal * (customAmt / 100) : customAmt)
                : subtotal * 0.03;
        }

        const totalCommission = (subtotal * baseRate) + assemblyCommission;

        const { error } = await supabase.from('leads').insert([{
            client_name: pdvForm.customerName || 'Cliente Balcão',
            interest_type: 'venda',
            status: 'converted',
            marketing_source: pdvForm.ecosystemCaptured ? 'site' : 'balcao',
            final_value: val,
            commission_value: totalCommission,
            commission_ecosystem: pdvForm.ecosystemCaptured,
            commission_service: pdvForm.isAssembly,
            performed_by_partner: currentExecutor === 'partner',
            converted_at: new Date().toISOString(),
            payment_status: 'paid'
        }]).select();

        if (!error) {
            // Deduct stock for consumed products by specified quantity
            if (pdvForm.consumedProducts.length > 0) {
                for (const item of pdvForm.consumedProducts) {
                    const product = products.find(p => p.id === item.product_id);
                    if (product && product.stock_quantity >= item.quantity) {
                        await supabase
                            .from('products')
                            .update({ stock_quantity: product.stock_quantity - item.quantity })
                            .eq('id', item.product_id);
                    }
                }
                fetchProducts();
            }

            setShowPdvModal(false);
            setPdvForm({ customerName: '', discountType: 'fixed', discountValue: 0, ecosystemCaptured: false, isAssembly: false, executor: 'owner', customCommissionType: 'percent', customCommissionAmount: '', manualFinalValue: '', consumedProducts: [] });
            setPdvProductSearch('');
            setPdvProductCategory('');
            setPdvProductQty(1);
            setManualProductSelect('');
            fetchLeads();
        } else {
            console.error("PDV Error:", error);
            alert("Erro ao registrar PDV.");
        }
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
                    setSelectedLeadForCommission(lead);
                    const autoProducts = (lead.utm_parameters as any)?.product_ids
                        ?.map((id: string) => {
                            const p = products.find(prod => prod.id === id);
                            return p ? { product_id: p.id, quantity: 1, name: p.name, current_stock: p.stock_quantity } : null;
                        })
                        .filter(Boolean) || [];
                    setCommissionForm({
                        finalValue: '',
                        costValue: '',
                        ecosystemCaptured: true,
                        isAssembly: false,
                        executor: getAssemblyExecutor(lead),
            customCommissionType: "percent" as "percent" | "value",
            customCommissionAmount: "",
                        consumedProducts: autoProducts
                    });
                    setShowCommissionModal(true);
                }
            }
        }
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
                slug: slugDraft || null,
                description: formData.get('description') || null,
                category: formData.get('category'),
                price: parseFloat(formData.get('price') as string),
                stock_quantity: parseInt(formData.get('stock') as string),
                specs: JSON.parse(formData.get('specs') as string || "{}"),
                image_urls: imageUrls,
                sku: formData.get('sku'),
                show_in_showroom: formData.get('show_in_showroom') === 'on',
                show_in_catalog: formData.get('show_in_catalog') === 'on',
                show_in_pcbuilder: formData.get('show_in_pcbuilder') === 'on',
                stock_alert: formData.get('stock_alert') === 'on',
                stock_alert_min: parseInt(formData.get('stock_alert_min') as string) || 1,
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
                alert("Produto excluido!");
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

                <nav className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                    {(() => {
                        const pendingLeads = leads.filter(l => l.status !== 'dismissed' && !['manutencao','venda','pc_build','compra','showroom'].includes(l.interest_type));
                        return [
                            { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, badge: null },
                            { id: 'leads', label: 'Leads', icon: Sparkles, badge: pendingLeads.length > 0 ? pendingLeads.length : null },
                            { id: 'vendas', label: 'Vendas', icon: ShoppingCart, badge: null },
                            { id: 'maintenance', label: 'Manutenção', icon: RefreshCw, badge: null },
                            { id: 'products', label: 'Produtos', icon: Package, badge: null },
                            { id: 'reviews', label: 'Depoimentos', icon: Star, badge: null },
                        ];
                    })().map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-display font-black uppercase tracking-widest text-[10px] transition-all border shrink-0 ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] border-transparent' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)]'}`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                            {tab.label}
                            {tab.badge !== null && <span className="ml-1 px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 text-[8px] rounded-full font-mono">{tab.badge}</span>}
                        </button>
                    ))}
                </nav>

                {/* Busca Global */}
                {(() => {
                    const q = globalSearch.toLowerCase().trim();
                    const searchResults = q.length >= 2 ? [
                        ...leads.filter(l => l.status !== 'dismissed' && (
                            l.client_name?.toLowerCase().includes(q) ||
                            l.whatsapp?.includes(q) ||
                            l.voucher_code?.toLowerCase().includes(q)
                        )).map(l => ({ ...l, _type: 'lead' })),
                        ...maintenanceOrders.filter((o: any) =>
                            o.customer_name?.toLowerCase().includes(q) ||
                            o.customer_phone?.includes(q) ||
                            o.voucher_code?.toLowerCase().includes(q)
                        ).map((o: any) => ({ ...o, _type: 'maintenance' })),
                    ] : [];
                    return (
                        <div className="relative mb-8">
                            <div className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus-within:border-[var(--accent-primary)]/50 transition-all">
                                <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                                <input
                                    value={globalSearch}
                                    onChange={e => setGlobalSearch(e.target.value)}
                                    placeholder="Buscar por nome, telefone ou voucher..."
                                    className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                                />
                                {globalSearch && <button onClick={() => setGlobalSearch('')}><X size={12} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" /></button>}
                            </div>
                            {q.length >= 2 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
                                    {searchResults.length === 0 ? (
                                        <div className="p-6 text-center text-[var(--text-muted)] text-sm">Nenhum resultado para "{globalSearch}"</div>
                                    ) : searchResults.map((item: any) => (
                                        <div key={item.id} className="p-4 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                                            onClick={() => {
                                                setActiveTab(item._type === 'maintenance' ? 'maintenance' : ['manutencao'].includes(item.interest_type) ? 'maintenance' : ['venda','pc_build','compra','showroom'].includes(item.interest_type) ? 'vendas' : 'leads');
                                                setGlobalSearch('');
                                            }}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="font-bold text-sm text-[var(--text-primary)]">{item.client_name || item.customer_name || 'Sem nome'}</div>
                                                    <div className="text-[10px] font-mono text-[var(--accent-primary)]">{item.whatsapp || item.customer_phone || '—'}</div>
                                                    {(item.description || item.problem_description) && <div className="text-[10px] text-[var(--text-muted)] italic mt-1">"{item.description || item.problem_description}"</div>}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className={`text-[9px] font-mono uppercase px-2 py-1 rounded-full ${item._type === 'maintenance' || item.interest_type === 'manutencao' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                                        {item._type === 'maintenance' || item.interest_type === 'manutencao' ? 'Manutenção' : item.interest_type || 'Lead'}
                                                    </div>
                                                    {item.voucher_code && <div className="text-[9px] font-mono text-[var(--accent-primary)] mt-1">{item.voucher_code}</div>}
                                                    <div className="text-[9px] text-[var(--text-muted)] mt-1">{new Date(item.created_at).toLocaleDateString('pt-BR')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {activeTab === 'dashboard' ? (
                    <div className="space-y-10">
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setShowPdvModal(true)}
                                className="px-6 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 rounded-xl font-display font-black text-xs tracking-widest uppercase flex items-center gap-2 transition-all hover:scale-[1.02]"
                            >
                                <Plus size={16} />
                                Nova Venda (PDV)
                            </button>
                        </div>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Receita Total', val: `R$ ${stats.totalLeadValue.toLocaleString('pt-BR')}`, sub: `+${stats.convertedCount} conversões`, color: 'var(--accent-primary)', icon: TrendingUp },
                                { label: 'Leads Ativos', val: leads.length, sub: `${stats.pendingCount} pendentes`, color: 'var(--accent-primary)', icon: Users },
                                { label: 'Ticket Médio', val: `R$ ${stats.avgTicket.toFixed(0)}`, sub: 'Faturamento/Conversão', color: 'var(--accent-primary)', icon: Package },
                                { label: 'Alerta de Estoque', val: products.filter(p => p.stock_alert && p.stock_quantity <= (p.stock_alert_min || 1)).length, sub: 'Produtos sinalizados', color: 'red-500', icon: AlertTriangle }
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
                                        const channels = leads.reduce((acc: any, l) => {
                                            const src = l.marketing_source || 'direto';
                                            acc[src] = (acc[src] || 0) + 1;
                                            return acc;
                                        }, {});

                                        const sorted = Object.entries(channels).sort((a: any, b: any) => b[1] - a[1]);

                                        if (sorted.length === 0) {
                                            return <div className="text-slate-500 italic text-[10px] font-mono uppercase tracking-widest text-center py-12 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">Sem dados ainda</div>;
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
                                            <div key={p.id} onClick={() => { setEditingProduct(p); setSlugDraft(p.slug || ''); setPreviewUrls(p.image_urls || []); setShowProductForm(true); setActiveTab('products'); }} className="flex items-center justify-between p-5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl group/item hover:border-red-500/30 transition-all cursor-pointer">
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

                ) : activeTab === 'leads' ? (() => {
                    const inboxLeads = leads.filter(l => l.status !== 'dismissed' && !['manutencao','venda','pc_build','compra','showroom'].includes(l.interest_type));
                    return (
                        <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={20} className="text-yellow-400" /> Leads Pendentes
                                    <span className="ml-2 px-2 py-0.5 text-[9px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded font-mono">{inboxLeads.length}</span>
                                </div>
                                <button onClick={fetchLeads} className="p-2 hover:bg-white/10 rounded-full transition-all" title="Atualizar"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></button>
                            </div>
                            {inboxLeads.length === 0 ? (
                                <div className="p-16 text-center text-slate-500 italic text-sm">Nenhum lead pendente.</div>
                            ) : (
                                <div className="divide-y divide-white/10">
                                    {inboxLeads.map(lead => {
                                        const edit = inboxEdit[lead.id] ?? { name: lead.client_name || '', phone: lead.whatsapp || '' };
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
                                                        <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                                {/* Actions */}
                                                <div className="flex flex-col gap-2 md:w-48">
                                                    <button
                                                        onClick={() => convertLead(lead, 'venda')}
                                                        className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-[10px] font-black px-4 py-2.5 rounded-lg transition-all uppercase tracking-widest"
                                                    >
                                                        → Venda
                                                    </button>
                                                    <button
                                                        onClick={() => convertLead(lead, 'manutencao')}
                                                        className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-[10px] font-black px-4 py-2.5 rounded-lg transition-all uppercase tracking-widest"
                                                    >
                                                        → Manutenção
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await supabase.from('leads').update({ status: 'dismissed' }).eq('id', lead.id);
                                                            fetchLeads();
                                                        }}
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
                })() : activeTab === 'vendas' ? (
                    <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={20} className="text-green-500" /> Vendas
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
                                    {leads.filter(l => ['venda','pc_build','compra','showroom'].includes(l.interest_type)).length > 0 ? leads.filter(l => ['venda','pc_build','compra','showroom'].includes(l.interest_type)).map((lead) => (
                                        <tr key={lead.id} className="hover:bg-[var(--bg-elevated)]/[0.5] transition-colors group">
                                            <td className="p-6">
                                                <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{lead.client_name || "Cliente"}</div>
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
                                                <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold tracking-widest">Progresso</div>
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
                                                <div className="text-[10px] text-slate-400 uppercase mb-1 font-bold tracking-widest">Pagamento</div>
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
                                                                <span className="text-[10px] text-purple-400 font-bold">Jeff.:</span>
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
                                                            const autoProducts = (lead.utm_parameters as any)?.product_ids
                                                                ?.map((id: string) => {
                                                                    const p = products.find(prod => prod.id === id);
                                                                    return p ? { product_id: p.id, quantity: 1, name: p.name, current_stock: p.stock_quantity } : null;
                                                                })
                                                                .filter(Boolean) || [];
                                                                
                                                            setCommissionForm({
                                                                finalValue: '',
                                                                costValue: '',
                                                                ecosystemCaptured: true,
                                                                isAssembly: false,
                                                                executor: getAssemblyExecutor(lead),
            customCommissionType: "percent" as "percent" | "value",
            customCommissionAmount: "",
                                                                consumedProducts: autoProducts
                                                            });
                                                            setShowCommissionModal(true);
                                                        }}
                                                        className="w-full bg-white hover:bg-slate-200 text-[#121216] text-[10px] font-black px-4 py-2 rounded-lg transition-all block"
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
                                            <td colSpan={7} className="p-12 text-center text-slate-500 italic">
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
                                        <th className="p-6">Cliente / Voucher</th>
                                        <th className="p-6">Avaliação</th>
                                        <th className="p-6">Conteúdo</th>
                                        <th className="p-6">Data/Hora</th>
                                        <th className="p-6 text-right">Operações</th>
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
                ) : activeTab === 'maintenance' ? (
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
                                        <th className="p-6">Ordem / Cliente</th>
                                        <th className="p-6">Equipamento</th>
                                        <th className="p-6">Origem</th>
                                        <th className="p-6">Progresso</th>
                                        <th className="p-6">Pagamento</th>
                                        <th className="p-6 text-right">Finalização</th>
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
                                                source: (o as any).source ?? 'organic',
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
                                                isLead: true
                                            }))
                                        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                                        if (merged.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={6} className="p-12 text-center text-slate-500 italic">Nenhuma ordem encontrada.</td>
                                                </tr>
                                            );
                                        }

                                        return merged.map((order) => (
                                            <tr key={order.id} className="hover:bg-[var(--bg-elevated)]/[0.5] transition-colors group">
                                                <td className="p-6">
                                                    <div className="font-mono text-[var(--accent-primary)] font-black text-xs mb-1 tracking-tight">{order.voucher_code}</div>
                                                    <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{order.customer_name || "Cliente"}</div>
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
                                                    <div className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest mb-2">Status de Pagamento</div>
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
                                                                    const originalLead = leads.find(l => l.id === order.id);
                                                                    setSelectedLeadForCommission(originalLead || order);
                                                                    setCommissionForm({
                                                                        finalValue: order.final_value?.toString() || '',
                                                                        costValue: order.cost_value?.toString() || '',
                                                                        ecosystemCaptured: (order as any).commission_ecosystem ?? true,
                                                                        isAssembly: (order as any).commission_service ?? false,
                                                                        executor: order.performed_by_partner ? 'partner' : (['smartphone', 'celular', 'tablet', 'mobile'].includes(((order as any).equipment_type || (order as any).interest_type || '').toLowerCase()) ? 'partner' : 'owner'),
                                                                        customCommissionType: 'percent',
                                                                        customCommissionAmount: '',
                                                                        consumedProducts: []
                                                                    });
                                                                    setShowCommissionModal(true);
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
                                                                    const originalLead = leads.find(l => l.id === order.id);
                                                                    setSelectedLeadForCommission(originalLead || order);
                                                                    setCommissionForm({
                                                                        finalValue: '',
                                                                        costValue: '',
                                                                        ecosystemCaptured: true,
                                                                        isAssembly: false,
                                                                        executor: ['smartphone', 'celular', 'tablet', 'mobile'].includes(((originalLead as any)?.equipment_type || (order as any).equipment_type || originalLead?.interest_type || '').toLowerCase()) ? 'partner' : 'owner',
                                                                        customCommissionType: 'percent',
                                                                        customCommissionAmount: '',
                                                                        consumedProducts: []
                                                                    });
                                                                    setShowCommissionModal(true);
                                                                }}
                                                            >
                                                                Finalizar Ordem
                                                            </button>
                                                            <div className="text-[9px] font-mono font-bold text-[var(--text-muted)] text-center uppercase tracking-widest mt-2">
                                                                Aberto em: {new Date(order.created_at).toLocaleDateString('pt-BR')}
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
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-subtle)]">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="relative group">
                                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-primary)] opacity-50 group-hover:opacity-100 transition-opacity" size={16} />
                                        <select 
                                            value={productFilter}
                                            onChange={(e) => setProductFilter(e.target.value)}
                                            className="pl-10 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-[var(--accent-primary)]/50 transition-all outline-none appearance-none"
                                        >
                                            <option value="">TODAS AS CATEGORIAS</option>
                                            {Array.from(new Set(products.map(p => p.category))).map(cat => {
                                                if (!cat) return null;
                                                return <option key={cat} value={cat}>{cat.toUpperCase()}</option>;
                                            })}
                                        </select>
                                    </div>

                                    <div className="relative group">
                                        <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-primary)] opacity-50 group-hover:opacity-100 transition-opacity" size={16} />
                                        <select 
                                            value={productSort}
                                            onChange={(e) => setProductSort(e.target.value)}
                                            className="pl-10 pr-8 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-[var(--accent-primary)]/50 transition-all outline-none appearance-none"
                                        >
                                            <option value="newest">MAIS RECENTES</option>
                                            <option value="oldest">MAIS ANTIGOS</option>
                                            <option value="price_asc">MENOR PREÇO</option>
                                            <option value="price_desc">MAIOR PREÇO</option>
                                            <option value="stock_asc">MENOR ESTOQUE</option>
                                            <option value="stock_desc">MAIOR ESTOQUE</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => { setEditingProduct(null); setSlugDraft(''); setShowProductForm(true); setPreviewUrls([]); }}
                                    className="w-full md:w-auto px-6 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 rounded-xl font-display font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-[var(--accent-primary)]/20 whitespace-nowrap"
                                >
                                    <Plus size={18} />
                                    CADASTRAR PRODUTO
                                </button>
                            </div>

                        {showProductForm && (
                            <form onSubmit={handleSaveProduct} className="bg-[var(--bg-elevated)] p-10 rounded-3xl border border-[var(--border-subtle)] space-y-8 relative overflow-hidden group/form">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20" />
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-display font-black italic uppercase tracking-tighter chrome-text">
                                        {editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <div className="font-mono text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                            {editingProduct ? `ID: ${editingProduct.id.slice(0,8)}` : 'Rascunho'}
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => setShowProductForm(false)}
                                            className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Nome do produto</label>
                                        <input name="name" defaultValue={editingProduct?.name} placeholder="Ex: RTX 4070 SUPER" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" required
                                            onChange={(e) => { if (!editingProduct?.slug) setSlugDraft(generateSlug(e.target.value)); }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Categoria</label>
                                        <select name="category" defaultValue={editingProduct?.category || 'workstation_ai'} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all uppercase appearance-none">
                                            <option value="workstation_ai">Workstation IA</option>
                                            <option value="gamer">PC Gamer</option>
                                            <option value="smartphone">Smartphone</option>
                                            <option value="office">Office Pro</option>
                                            <option value="hardware">Hardware</option>
                                            <option value="perifericos">Periféricos</option>
                                            <option value="internal_part">Peça Interna (Estoque)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Preço (R$)</label>
                                        <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="0.00" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Estoque</label>
                                        <input name="stock" type="number" defaultValue={editingProduct?.stock_quantity} placeholder="0" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" required />
                                        <div className="flex items-center gap-3 pt-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" name="stock_alert" defaultChecked={editingProduct?.stock_alert ?? false} className="w-4 h-4 rounded accent-yellow-500" />
                                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Alerta de Estoque Baixo</span>
                                            </label>
                                            <input name="stock_alert_min" type="number" defaultValue={editingProduct?.stock_alert_min ?? 3} min="1" placeholder="3" className="w-16 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs font-bold focus:border-yellow-500/50 outline-none transition-all text-center" />
                                            <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase">un. mín.</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">SKU (ID no ERP)</label>
                                        <input name="sku" defaultValue={editingProduct?.sku} placeholder="ERP-SYNC-ID" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs font-mono font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Slug (URL da página)</label>
                                        <input name="slug" value={slugDraft} onChange={(e) => setSlugDraft(e.target.value)} placeholder="pc-gamer-rtx-4060" className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs font-mono focus:border-[var(--accent-primary)]/50 outline-none transition-all" />
                                        <p className="text-[9px] text-[var(--text-muted)] ml-1">Auto-gerado do nome. URL: /produtos/<span className="text-[var(--accent-primary)]">{slugDraft || '...'}</span></p>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Descrição (opcional)</label>
                                        <textarea name="description" defaultValue={editingProduct?.description} placeholder="Descreva o produto, diferenciais, uso recomendado..." rows={3} className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent-primary)]/50 outline-none transition-all resize-none" />
                                    </div>
                                    <div className="md:col-span-2 space-y-8">
                                        <div className="bg-[var(--bg-primary)] p-6 rounded-2xl border border-[var(--border-subtle)] space-y-4">
                                            <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-[var(--accent-primary)] flex items-center gap-2">
                                                <Eye size={12} /> Visibilidade do Produto
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer">
                                                    <input type="checkbox" name="show_in_showroom" defaultChecked={editingProduct?.show_in_showroom ?? false} className="w-5 h-5 rounded accent-blue-500" />
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase">Showroom</span>
                                                        <span className="text-[8px] text-[var(--text-muted)] uppercase">Vitrine Destaque</span>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer">
                                                    <input type="checkbox" name="show_in_catalog" defaultChecked={editingProduct?.show_in_catalog ?? true} className="w-5 h-5 rounded accent-green-500" />
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase">Catálogo</span>
                                                        <span className="text-[8px] text-[var(--text-muted)] uppercase">Página de Produtos</span>
                                                    </div>
                                                </label>
                                                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer">
                                                    <input type="checkbox" name="show_in_pcbuilder" defaultChecked={editingProduct?.show_in_pcbuilder ?? false} className="w-5 h-5 rounded accent-purple-500" />
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] shrink-0" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase">PC Builder</span>
                                                        <span className="text-[8px] text-[var(--text-muted)] uppercase">Montagem de PC</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Upload de Imagens</label>
                                            <div className="flex items-center justify-center w-full">
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl cursor-pointer bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] transition-all group/upload">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Plus className="w-8 h-8 text-[var(--text-muted)] group-hover/upload:text-[var(--accent-primary)] transition-colors" />
                                                        <p className="mt-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">Upload Local (Supabase Storage)</p>
                                                    </div>
                                                    <input type="file" multiple accept="image/*" className="hidden" 
                                                        onChange={async (e) => {
                                                            const files = Array.from(e.target.files || []);
                                                            if (files.length === 0) return;
                                                            
                                                            setLoading(true);
                                                            const urls = [...previewUrls];
                                                            
                                                            for (const file of files) {
                                                                const fileExt = file.name.split('.').pop();
                                                                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                                                                const filePath = `${fileName}`;
                                                                
                                                                const { error: uploadError, data } = await supabase.storage
                                                                    .from('products')
                                                                    .upload(filePath, file);
                                                                
                                                                if (uploadError) {
                                                                    alert("Erro no upload: " + uploadError.message);
                                                                    continue;
                                                                }
                                                                
                                                                const { data: { publicUrl } } = supabase.storage
                                                                    .from('products')
                                                                    .getPublicUrl(filePath);
                                                                
                                                                urls.push(publicUrl);
                                                            }
                                                            
                                                            setPreviewUrls(urls);
                                                            setLoading(false);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Especificações (JSON)</label>
                                            <textarea name="specs" defaultValue={editingProduct?.specs ? JSON.stringify(editingProduct.specs) : ''} placeholder='{"key": "value"}' className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-primary)]/50 outline-none h-32 font-mono text-xs font-bold leading-relaxed transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">URLs das Imagens (uma por linha)</label>
                                            <textarea
                                                name="image_urls"
                                                value={previewUrls.join('\n')}
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
                                                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-primary)] group/preview">
                                                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Erro')} />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setPreviewUrls(previewUrls.filter((_, index) => index !== i))}
                                                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/preview:opacity-100 transition-opacity"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                        <div className="absolute bottom-0 right-0 bg-black/50 text-[8px] px-1 font-bold text-white">{i + 1}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4 border-t border-[var(--border-subtle)]">
                                    <button type="submit" className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white px-10 py-4 rounded-xl font-display font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--accent-primary)]/20 transition-all">
                                        Salvar Produto
                                    </button>
                                    <button type="button" onClick={() => setShowProductForm(false)} className="bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] px-8 py-4 rounded-xl font-display font-black uppercase tracking-widest text-[10px] transition-all">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="overflow-hidden bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/50">
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Produto</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Categoria</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-right">Preço</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Estoque</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Flags</th>
                                        <th className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {products
                                        .filter(p => !productFilter || p.category === productFilter)
                                        .sort((a, b) => {
                                            if (productSort === 'price_asc') return a.price - b.price;
                                            if (productSort === 'price_desc') return b.price - a.price;
                                            if (productSort === 'stock_asc') return a.stock_quantity - b.stock_quantity;
                                            if (productSort === 'stock_desc') return b.stock_quantity - a.stock_quantity;
                                            if (productSort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                                        })
                                        .map((product) => (
                                        <tr key={product.id} className="group hover:bg-[var(--bg-primary)]/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] overflow-hidden p-1 shrink-0">
                                                        {product.image_urls?.[0] ? (
                                                            <img src={product.image_urls[0]} alt="" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] opacity-20"><Package size={14} /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">
                                                            {product.slug ? (
                                                                <Link href={`/produtos/${product.slug}`} target="_blank" className="hover:text-[var(--accent-primary)] transition-colors underline-offset-2 hover:underline">
                                                                    {product.name?.toUpperCase()}
                                                                </Link>
                                                            ) : product.name?.toUpperCase()}
                                                        </div>
                                                        <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">{product.sku || '#SEM-SKU'} {!product.slug && <span className="text-amber-500">· sem slug</span>}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-full text-[8px] font-black uppercase tracking-wider text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:border-[var(--accent-primary)]/30 transition-all">
                                                    {product.category || 'GERAL'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-xs font-black text-[var(--text-primary)]">R$ {product.price?.toLocaleString('pt-BR')}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`text-[10px] font-mono font-black ${product.stock_quantity <= 3 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {product.stock_quantity} <span className="text-[7px] uppercase tracking-widest opacity-60 ml-1">un</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${product.show_in_showroom ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)]'}`} title="Showroom" />
                                                    <div className={`w-2 h-2 rounded-full ${product.show_in_catalog ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)]'}`} title="Catálogo" />
                                                    <div className={`w-2 h-2 rounded-full ${product.show_in_pcbuilder ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)]'}`} title="PC Builder" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setSlugDraft(product.slug || '');
                                                            setShowProductForm(true);
                                                            setPreviewUrls(product.image_urls || []);
                                                        }}
                                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteProduct(product.id)}
                                                        className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {products.length === 0 && (
                                <div className="py-20 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-[0.4em]">
                                    Nenhum produto em estoque
                                </div>
                            )}
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
                                    {socialCardLead.interest_type === 'pc_build' ? 'Montagem de Sistema' :
                                        socialCardLead.interest_type === 'manutencao' ? 'Protocolo de Manutenção' :
                                            'Sucesso Gerenciado'}
                                </div>

                                {/* Client */}
                                <div className="mb-4">
                                    <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Cliente Autenticado</div>
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
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Valor da Operação</div>
                                        <div className="text-xl font-display font-bold chrome-text">R$ {socialCardLead.final_value?.toLocaleString('pt-BR')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[8px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Garantia Selada</div>
                                        <div className="text-xl font-display font-bold text-[var(--text-primary)]">90 DIAS</div>
                                    </div>
                                </div>

                                {/* Voucher */}
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

                                {/* Footer */}
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

            {/* Modal de PDV (Venda Balcão) */}
            {showPdvModal && (
                <div className="fixed inset-0 bg-[#020406]/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <form onSubmit={submitPdvForm} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[32px] p-10 max-w-lg w-full relative overflow-hidden card-dark">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20" />
                        
                        <button type="button" onClick={() => setShowPdvModal(false)} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                            <X size={24} />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                                <Package className="text-[var(--accent-primary)]" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-black italic uppercase tracking-tighter chrome-text leading-tight">Nova Venda Direta</h2>
                                <p className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest">Saída manual de estoque / balcão</p>
                            </div>
                        </div>

                        <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
                            {/* Cliente */}
                            <div className="space-y-2">
                                <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Nome do Cliente (Opcional)</label>
                                <input
                                    type="text"
                                    value={pdvForm.customerName}
                                    onChange={(e) => setPdvForm({ ...pdvForm, customerName: e.target.value })}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                                    placeholder="Cliente Balcão"
                                />
                            </div>

                            {/* Produtos da Venda — Seleção Robusta */}
                            <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4">
                                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Produtos da Venda</label>

                                {/* Itens adicionados */}
                                {pdvForm.consumedProducts.length > 0 && (
                                    <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                                        {pdvForm.consumedProducts.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 rounded-xl">
                                                <div className="flex flex-col flex-1 mr-2">
                                                    <span className="text-xs font-bold chrome-text uppercase leading-tight">{item.name}</span>
                                                    <span className="text-[9px] font-mono text-[var(--text-muted)]">Qtd: {item.quantity} · Est. atual: {item.current_stock} · R$ {item.price.toLocaleString('pt-BR')}</span>
                                                </div>
                                                {/* Ajuste rápido de qtd */}
                                                <div className="flex items-center gap-1 mr-2">
                                                    <button type="button" onClick={() => {
                                                        const newArr = [...pdvForm.consumedProducts];
                                                        if (newArr[idx].quantity > 1) { newArr[idx] = { ...newArr[idx], quantity: newArr[idx].quantity - 1 }; setPdvForm({ ...pdvForm, consumedProducts: newArr }); }
                                                    }} className="w-6 h-6 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs flex items-center justify-center hover:bg-[var(--accent-primary)]/10 transition-colors">-</button>
                                                    <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                                                    <button type="button" onClick={() => {
                                                        const newArr = [...pdvForm.consumedProducts];
                                                        if (newArr[idx].quantity < (item.current_stock || 99)) { newArr[idx] = { ...newArr[idx], quantity: newArr[idx].quantity + 1 }; setPdvForm({ ...pdvForm, consumedProducts: newArr }); }
                                                    }} className="w-6 h-6 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs flex items-center justify-center hover:bg-[var(--accent-primary)]/10 transition-colors">+</button>
                                                </div>
                                                <button type="button" onClick={() => {
                                                    const newArr = [...pdvForm.consumedProducts];
                                                    newArr.splice(idx, 1);
                                                    setPdvForm({ ...pdvForm, consumedProducts: newArr });
                                                }} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors shrink-0">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Filtros de busca */}
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={pdvProductSearch}
                                        onChange={(e) => setPdvProductSearch(e.target.value)}
                                        placeholder="Buscar nome ou SKU..."
                                        className="col-span-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all placeholder:text-[var(--text-muted)]"
                                    />
                                    <select
                                        value={pdvProductCategory}
                                        onChange={(e) => setPdvProductCategory(e.target.value)}
                                        className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all appearance-none uppercase"
                                    >
                                        <option value="">Todas categorias</option>
                                        {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase shrink-0">Qtd:</span>
                                        <input
                                            type="number"
                                            min={1}
                                            value={pdvProductQty}
                                            onChange={(e) => setPdvProductQty(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-black text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Lista de produtos filtrada */}
                                <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                                    {products
                                        .filter(p => p.stock_quantity > 0)
                                        .filter(p => {
                                            if (pdvProductCategory && p.category !== pdvProductCategory) return false;
                                            const q = pdvProductSearch.toLowerCase();
                                            if (!q) return true;
                                            return (
                                                (p.name || '').toLowerCase().includes(q) ||
                                                (p.sku || '').toLowerCase().includes(q) ||
                                                (p.category || '').toLowerCase().includes(q)
                                            );
                                        })
                                        .map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => {
                                                    const qty = pdvProductQty || 1;
                                                    const existingIdx = pdvForm.consumedProducts.findIndex(item => item.product_id === p.id);
                                                    const newArr = [...pdvForm.consumedProducts];
                                                    if (existingIdx >= 0) {
                                                        const newTotal = newArr[existingIdx].quantity + qty;
                                                        newArr[existingIdx] = { ...newArr[existingIdx], quantity: Math.min(newTotal, p.stock_quantity) };
                                                    } else {
                                                        newArr.push({ product_id: p.id, quantity: Math.min(qty, p.stock_quantity), name: p.name, current_stock: p.stock_quantity, price: p.price || 0 });
                                                    }
                                                    setPdvForm({ ...pdvForm, consumedProducts: newArr });
                                                    setPdvProductQty(1);
                                                }}
                                                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)]/10 border border-transparent hover:border-[var(--accent-primary)]/30 transition-all text-left"
                                            >
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold uppercase leading-tight text-white">{p.name}</div>
                                                    <div className="text-[9px] font-mono text-[var(--text-muted)]">{p.sku || 'SEM-SKU'} · {p.category} · Est: {p.stock_quantity}</div>
                                                </div>
                                                <div className="text-xs font-black text-[var(--accent-primary)] ml-3 shrink-0">R$ {p.price?.toLocaleString('pt-BR')}</div>
                                            </button>
                                        ))
                                    }
                                    {products.filter(p => p.stock_quantity > 0).filter(p => {
                                        if (pdvProductCategory && p.category !== pdvProductCategory) return false;
                                        const q = pdvProductSearch.toLowerCase();
                                        return !q || (p.name||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q);
                                    }).length === 0 && (
                                        <div className="py-4 text-center text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest">Nenhum produto encontrado.</div>
                                    )}
                                </div>
                            </div>

                            {/* Valor manual (sem produto) */}
                            <div className="space-y-1.5">
                                <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Valor manual (R$) <span className="opacity-50 normal-case tracking-normal">— opcional, substitui produtos</span></label>
                                <input
                                    type="number" step="0.01" min={0}
                                    value={pdvForm.manualFinalValue}
                                    onChange={(e) => setPdvForm({ ...pdvForm, manualFinalValue: e.target.value })}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-display font-black text-lg focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Desconto & Valor final (Calculado) */}
                            {(() => {
                                const manualOverride = parseFloat(pdvForm.manualFinalValue) || 0;
                                const sub = manualOverride > 0 ? manualOverride : pdvForm.consumedProducts.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                                const descAmount = pdvForm.discountType === 'percentage' ? sub * (pdvForm.discountValue / 100) : pdvForm.discountValue;
                                const finalVal = Math.max(0, sub - descAmount);

                                return sub > 0 ? (
                                    <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
                                        {!manualOverride && (
                                            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                                                <span>Subtotal</span>
                                                <span className="text-white">R$ {sub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                                <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Desconto</label>
                                                <input
                                                    type="number" step="0.01" min={0}
                                                    value={pdvForm.discountValue || ''}
                                                    onChange={(e) => setPdvForm({ ...pdvForm, discountValue: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="w-20 shrink-0">
                                                <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-transparent mb-1">Tipo</label>
                                                <select
                                                    value={pdvForm.discountType}
                                                    onChange={(e) => setPdvForm({ ...pdvForm, discountType: e.target.value as 'fixed' | 'percentage' })}
                                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all appearance-none uppercase"
                                                >
                                                    <option value="fixed">R$</option>
                                                    <option value="percentage">%</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center border-t border-[var(--border-subtle)] pt-3">
                                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Cobrado do cliente</span>
                                            <span className="text-xl font-display font-black text-white">R$ {finalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        {pdvForm.ecosystemCaptured && (
                                            <div className="text-[9px] font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/5 rounded-lg px-3 py-1.5">
                                                Ecossistema {sub > 8000 ? '5% (> R$8.000)' : '8%'} = R$ {(sub * (sub > 8000 ? 0.05 : 0.08)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        )}
                                    </div>
                                ) : null;
                            })()}

                            {/* Protocolos */}
                            <div className="space-y-2">
                                <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Protocolos de comissão</div>

                                <label className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                                    <div className="relative w-5 h-5 shrink-0 rounded-md bg-black/40 border border-white/20 group-hover:border-[var(--accent-primary)]/50 flex items-center justify-center transition-all">
                                        <input type="checkbox" checked={pdvForm.ecosystemCaptured} onChange={(e) => setPdvForm({ ...pdvForm, ecosystemCaptured: e.target.checked })} className="opacity-0 absolute inset-0 cursor-pointer z-10" />
                                        {pdvForm.ecosystemCaptured && <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-primary)]" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">Ecossistema digital — 8% / 5% &gt;R$8k</div>
                                        <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">Site, Instagram, catálogo ou indicação digital</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                                    <div className="relative w-5 h-5 shrink-0 rounded-md bg-black/40 border border-white/20 group-hover:border-[var(--accent-primary)]/50 flex items-center justify-center transition-all">
                                        <input type="checkbox" checked={pdvForm.isAssembly} onChange={(e) => setPdvForm({ ...pdvForm, isAssembly: e.target.checked })} className="opacity-0 absolute inset-0 cursor-pointer z-10" />
                                        {pdvForm.isAssembly && <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-primary)]" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-black uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">Protocolo de montagem</div>
                                        <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">Serviço de montagem / configuração incluso</div>
                                    </div>
                                </label>

                                {pdvForm.isAssembly && (
                                    <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Executor</span>
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${currentExecutor === 'iago' ? 'text-[var(--accent-primary)]' : currentExecutor === 'partner' ? 'text-purple-400' : 'text-white/60'}`}>
                                                {currentExecutor === 'iago' ? 'Iago' : currentExecutor === 'partner' ? 'Jefferson' : 'Felipe'}
                                                <span className="ml-1 font-mono text-[8px] opacity-50">(logado)</span>
                                            </span>
                                        </div>

                                        {(currentExecutor === 'iago' || currentExecutor === 'partner') && (
                                            <div className="space-y-1.5">
                                                <div className="text-[8px] font-mono uppercase tracking-widest text-[var(--text-muted)]">Comissão personalizada <span className="opacity-50">(vazio = 3%)</span></div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                                                        <button type="button"
                                                            onClick={() => setPdvForm({ ...pdvForm, customCommissionType: 'percent' })}
                                                            className={`px-3 py-1.5 text-[9px] font-mono font-black transition-all ${pdvForm.customCommissionType === 'percent' ? 'bg-[var(--accent-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}
                                                        >%</button>
                                                        <button type="button"
                                                            onClick={() => setPdvForm({ ...pdvForm, customCommissionType: 'value' })}
                                                            className={`px-3 py-1.5 text-[9px] font-mono font-black transition-all ${pdvForm.customCommissionType === 'value' ? 'bg-[var(--accent-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}
                                                        >R$</button>
                                                    </div>
                                                    <input
                                                        type="number" step="0.01" min="0"
                                                        placeholder={pdvForm.customCommissionType === 'percent' ? 'Ex: 3' : 'Ex: 150.00'}
                                                        value={pdvForm.customCommissionAmount}
                                                        onChange={(e) => setPdvForm({ ...pdvForm, customCommissionAmount: e.target.value })}
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[var(--accent-primary)]/50"
                                                    />
                                                    {pdvForm.customCommissionAmount && (() => {
                                                        const _sub = parseFloat(pdvForm.manualFinalValue) || pdvForm.consumedProducts.reduce((s, i) => s + i.price * i.quantity, 0);
                                                        const _ca = parseFloat(pdvForm.customCommissionAmount) || 0;
                                                        const _cv = pdvForm.customCommissionType === 'percent' ? _sub * (_ca / 100) : _ca;
                                                        return _cv > 0 ? <span className="text-[9px] font-mono text-[var(--accent-primary)] shrink-0">R$ {_cv.toFixed(2)}</span> : null;
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center pt-2">
                                <button type="submit" className="w-full bg-white hover:bg-slate-200 text-[#121216] font-display font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl transition-all hover:scale-[1.01]">
                                    Registrar Venda e Abater Estoque
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal de Comissões */}
            {showCommissionModal && selectedLeadForCommission && (() => {
                const _val = parseFloat(commissionForm.finalValue) || 0;
                const _cost = parseFloat(commissionForm.costValue) || 0;
                const _isDigital = ['site', 'instagram', 'facebook', 'insta', 'face', 'direct', 'direto'].includes(selectedLeadForCommission.marketing_source?.toLowerCase());
                const _isCelular = isCelularLead(selectedLeadForCommission);
                const _baseRate = commissionForm.ecosystemCaptured ? (_val > 8000 ? 0.05 : 0.08) : 0;
                const _customAmt = parseFloat(commissionForm.customCommissionAmount) || 0;
                const _customComm = commissionForm.customCommissionType === 'percent' ? _val * (_customAmt / 100) : _customAmt;
                const _iagoAssembly = commissionForm.isAssembly && commissionForm.executor === 'iago' ? (_customAmt > 0 ? _customComm : _val * 0.03) : 0;
                const _jeffAssembly = commissionForm.isAssembly && _isCelular && commissionForm.executor === 'partner' ? (_val - _cost) * 0.5
                    : commissionForm.isAssembly && !_isCelular && commissionForm.executor === 'partner' ? (_customAmt > 0 ? _customComm : _val * 0.03) : 0;
                const _totalIago = _val * _baseRate + _iagoAssembly;
                const _isMaintenance = selectedLeadForCommission.interest_type === 'manutencao' || !!selectedLeadForCommission.equipment_type;
                return (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
                    <form onSubmit={submitCommissionForm} className="bg-[#0e1117] border border-white/10 rounded-3xl w-full max-w-md relative my-6 overflow-hidden">
                        {/* Top accent line */}
                        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-60" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                                    <TrendingUp size={18} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-display font-black italic uppercase tracking-tight chrome-text">Finalizar Venda</div>
                                    <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest leading-none mt-0.5">Conversão financeira</div>
                                </div>
                            </div>
                            <button type="button" onClick={() => setShowCommissionModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Lead context pill */}
                        <div className="mx-6 mb-5 flex items-center justify-between bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                            <div>
                                <div className="text-xs font-black uppercase tracking-wider text-white leading-none">{selectedLeadForCommission.client_name || selectedLeadForCommission.customer_name || "Cliente"}</div>
                                <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">{selectedLeadForCommission.interest_type || selectedLeadForCommission.equipment_type || "Serviço"}</div>
                            </div>
                            {selectedLeadForCommission.voucher_code && (
                                <div className="text-[9px] font-mono text-[var(--accent-primary)]/70 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15 rounded-lg px-2 py-1">{selectedLeadForCommission.voucher_code}</div>
                            )}
                        </div>

                        <div className="px-6 pb-6 space-y-4">

                            {/* Valores financeiros */}
                            <div className={`grid gap-3 ${_isMaintenance ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <div>
                                    <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Valor cobrado (R$)</label>
                                    <input
                                        type="number" step="0.01" required
                                        value={commissionForm.finalValue}
                                        onChange={(e) => setCommissionForm({ ...commissionForm, finalValue: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white font-display font-black text-lg focus:outline-none focus:border-green-500/50 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                {_isMaintenance && (
                                    <div>
                                        <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-red-400/70 mb-1.5">Custo peças (R$)</label>
                                        <input
                                            type="number" step="0.01"
                                            value={commissionForm.costValue}
                                            onChange={(e) => setCommissionForm({ ...commissionForm, costValue: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white font-mono font-bold focus:outline-none focus:border-red-500/30 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Protocolos */}
                            <div className="space-y-2">
                                <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Protocolos de comissão</div>

                                {/* Ecosystem */}
                                {_isDigital ? (
                                    <div className="flex items-center gap-3 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-xl px-4 py-3">
                                        <CheckCircle2 size={14} className="text-[var(--accent-primary)] shrink-0" />
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">Digital — Ativo automaticamente</div>
                                            <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">{_val > 8000 ? '5% (valor > R$8.000)' : '8% padrão'}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                                        <div className="relative w-5 h-5 shrink-0 rounded-md bg-black/40 border border-white/20 group-hover:border-[var(--accent-primary)]/50 flex items-center justify-center transition-all">
                                            <input type="checkbox" checked={commissionForm.ecosystemCaptured} onChange={(e) => setCommissionForm({ ...commissionForm, ecosystemCaptured: e.target.checked })} className="opacity-0 absolute inset-0 cursor-pointer z-10" />
                                            {commissionForm.ecosystemCaptured && <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-primary)]" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">Bônus de ecossistema — {_val > 8000 ? '5%' : '8%'}</div>
                                            <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">Lead manual / indicação externa</div>
                                        </div>
                                        {commissionForm.ecosystemCaptured && _val > 0 && (
                                            <div className="text-[10px] font-mono font-black text-[var(--accent-primary)]">+R$ {(_val * _baseRate).toFixed(2)}</div>
                                        )}
                                    </label>
                                )}

                                {/* Assembly */}
                                {_isMaintenance && (
                                    <label className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                                        <div className="relative w-5 h-5 shrink-0 rounded-md bg-black/40 border border-white/20 group-hover:border-[var(--accent-primary)]/50 flex items-center justify-center transition-all">
                                            <input type="checkbox"
                                                checked={selectedLeadForCommission.interest_type === 'pc_build' || commissionForm.isAssembly}
                                                disabled={selectedLeadForCommission.interest_type === 'pc_build'}
                                                onChange={(e) => setCommissionForm({ ...commissionForm, isAssembly: e.target.checked })}
                                                className="opacity-0 absolute inset-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                            />
                                            {(selectedLeadForCommission.interest_type === 'pc_build' || commissionForm.isAssembly) && <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-primary)]" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">Protocolo de montagem</div>
                                            <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">
                                                {selectedLeadForCommission.interest_type === 'pc_build' ? 'Automático — Montagem de PC' : 'Serviço de montagem / reparo'}
                                            </div>
                                        </div>
                                    </label>
                                )}
                            </div>

                            {/* Executor da montagem */}
                            {commissionForm.isAssembly && (
                                <div className="space-y-2">
                                    <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">{_isCelular ? 'Técnico responsável' : 'Executor da montagem'}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'owner', label: 'Felipe', role: 'Dono', color: 'white/60' },
                                            { value: 'iago', label: 'Iago', role: 'Marketing', color: '[var(--accent-primary)]' },
                                            { value: 'partner', label: 'Jefferson', role: 'Técnico', color: 'purple-400' },
                                        ].map(opt => (
                                            <label key={opt.value} className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer transition-all text-center ${commissionForm.executor === opt.value ? 'border-white/30 bg-white/10' : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                                                <input type="radio" name="assemblyExecutor" value={opt.value}
                                                    checked={commissionForm.executor === opt.value}
                                                    onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value })}
                                                    className="sr-only"
                                                />
                                                <span className={`text-xs font-black uppercase tracking-tight text-${opt.color}`}>{opt.label}</span>
                                                <span className="text-[8px] font-mono text-[var(--text-muted)]">{opt.role}</span>
                                                {commissionForm.executor === opt.value && (
                                                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white/40" />
                                                )}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Celular + Jefferson → 50% net */}
                                    {_isCelular && commissionForm.executor === 'partner' && _val > 0 && (
                                        <div className="flex items-center justify-between bg-purple-500/5 border border-purple-500/20 rounded-xl px-4 py-2.5">
                                            <span className="text-[9px] font-mono text-purple-400">Jefferson (50% líquido)</span>
                                            <span className="text-[10px] font-mono font-black text-purple-400">R$ {_jeffAssembly.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {/* PC/notebook + Iago or Jefferson → custom */}
                                    {!_isCelular && (commissionForm.executor === 'iago' || commissionForm.executor === 'partner') && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex rounded-lg overflow-hidden border border-white/10">
                                                    <button type="button"
                                                        onClick={() => setCommissionForm({ ...commissionForm, customCommissionType: 'percent' })}
                                                        className={`px-3 py-1.5 text-[9px] font-mono font-black transition-all ${commissionForm.customCommissionType === 'percent' ? 'bg-[var(--accent-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}
                                                    >%</button>
                                                    <button type="button"
                                                        onClick={() => setCommissionForm({ ...commissionForm, customCommissionType: 'value' })}
                                                        className={`px-3 py-1.5 text-[9px] font-mono font-black transition-all ${commissionForm.customCommissionType === 'value' ? 'bg-[var(--accent-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}
                                                    >R$</button>
                                                </div>
                                                <input
                                                    type="number" step="0.01" min="0"
                                                    placeholder={commissionForm.customCommissionType === 'percent' ? 'Ex: 3 (padrão)' : 'Ex: 150.00 (padrão 3%)'}
                                                    value={commissionForm.customCommissionAmount}
                                                    onChange={(e) => setCommissionForm({ ...commissionForm, customCommissionAmount: e.target.value })}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[var(--accent-primary)]/50"
                                                />
                                                {_customAmt > 0 && _val > 0 && (
                                                    <span className="text-[9px] font-mono text-[var(--accent-primary)] shrink-0">R$ {_customComm.toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Commission preview */}
                            {_val > 0 && (_totalIago > 0 || _jeffAssembly > 0) && (
                                <div className="bg-green-500/5 border border-green-500/15 rounded-2xl px-4 py-3 space-y-2">
                                    <div className="text-[9px] font-mono font-black uppercase tracking-widest text-green-400/70">Resumo de comissões</div>
                                    {_totalIago > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-[var(--text-muted)]">Iago <span className="opacity-50">({_val > 8000 ? '5%' : '8%'}{commissionForm.isAssembly && commissionForm.executor === 'iago' ? ' + serviço' : ''})</span></span>
                                            <span className="text-sm font-display font-black text-green-400">R$ {_totalIago.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {_jeffAssembly > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-mono text-[var(--text-muted)]">Jefferson <span className="opacity-50">({_isCelular ? '50% líquido' : 'serviço'})</span></span>
                                            <span className="text-sm font-display font-black text-purple-400">R$ {_jeffAssembly.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/8" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Lucro líquido loja</span>
                                        <span className="text-[10px] font-mono font-black text-white/70">R$ {(_val - _cost - _totalIago - _jeffAssembly).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Itens do Estoque */}
                            <div className="space-y-2">
                                <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Baixa de estoque</div>
                                {commissionForm.consumedProducts.length > 0 && (
                                    <div className="space-y-1.5">
                                        {commissionForm.consumedProducts.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white/[0.03] border border-white/8 px-3 py-2 rounded-xl">
                                                <div>
                                                    <span className="text-[10px] font-bold text-white uppercase">{item.name || 'Item'}</span>
                                                    <span className="text-[8px] font-mono text-[var(--text-muted)] ml-2">× {item.quantity}</span>
                                                </div>
                                                <button type="button" onClick={() => { const newArr = [...commissionForm.consumedProducts]; newArr.splice(idx, 1); setCommissionForm({ ...commissionForm, consumedProducts: newArr }); }} className="p-1 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 rounded-lg transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <select
                                        value={manualProductSelect}
                                        onChange={(e) => setManualProductSelect(e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all appearance-none"
                                    >
                                        <option value="">Adicionar item do estoque...</option>
                                        {products.filter(p => p.stock_quantity > 0).map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (Est: {p.stock_quantity})</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => { if (!manualProductSelect) return; const p = products.find(prod => prod.id === manualProductSelect); if (!p) return; const existingIdx = commissionForm.consumedProducts.findIndex(item => item.product_id === p.id); const newArr = [...commissionForm.consumedProducts]; if (existingIdx >= 0) { newArr[existingIdx].quantity += 1; } else { newArr.push({ product_id: p.id, quantity: 1, name: p.name, current_stock: p.stock_quantity }); } setCommissionForm({ ...commissionForm, consumedProducts: newArr }); setManualProductSelect(''); }} className="bg-[var(--accent-primary)] text-black px-3 py-2 rounded-xl flex items-center justify-center hover:scale-105 transition-all">
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="w-full mt-2 bg-white hover:bg-slate-100 text-black font-display font-black italic uppercase tracking-[0.15em] text-[11px] py-4 rounded-2xl transition-all hover:scale-[1.01] shadow-lg">
                                Confirmar Venda
                            </button>
                        </div>
                    </form>
                </div>
                );
            })()}
        </div>
    );
}
