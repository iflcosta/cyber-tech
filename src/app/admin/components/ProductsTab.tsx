'use client';
import { Package, RefreshCw, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/product';

interface ProductsTabProps {
    products: Product[];
    loading: boolean;
    onSaveProduct: (e: React.FormEvent<HTMLFormElement>) => void;
    onDeleteProduct: (id: string) => void;
    editingProduct: Product | null;
    setEditingProduct: React.Dispatch<React.SetStateAction<Product | null>>;
    showProductForm: boolean;
    setShowProductForm: React.Dispatch<React.SetStateAction<boolean>>;
    productFilter: string;
    setProductFilter: React.Dispatch<React.SetStateAction<string>>;
    productSort: string;
    setProductSort: React.Dispatch<React.SetStateAction<string>>;
    previewUrls: string[];
    setPreviewUrls: React.Dispatch<React.SetStateAction<string[]>>;
    slugDraft: string;
    setSlugDraft: React.Dispatch<React.SetStateAction<string>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const generateSlug = (name: string) =>
    name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

export function ProductsTab({
    products,
    loading,
    onSaveProduct,
    onDeleteProduct,
    editingProduct,
    setEditingProduct,
    showProductForm,
    setShowProductForm,
    productFilter,
    setProductFilter,
    productSort,
    setProductSort,
    previewUrls,
    setPreviewUrls,
    slugDraft,
    setSlugDraft,
    setLoading,
}: ProductsTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-subtle)]">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-primary)] opacity-50 group-hover:opacity-100 transition-opacity" size={16} />
                        <select
                            value={productFilter}
                            onChange={e => setProductFilter(e.target.value)}
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
                            onChange={e => setProductSort(e.target.value)}
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
                    onClick={() => {
                        setEditingProduct(null);
                        setSlugDraft('');
                        setShowProductForm(true);
                        setPreviewUrls([]);
                    }}
                    className="w-full md:w-auto px-6 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 rounded-xl font-display font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-[var(--accent-primary)]/20 whitespace-nowrap"
                >
                    <Plus size={18} />
                    CADASTRAR PRODUTO
                </button>
            </div>

            {showProductForm && (
                <form onSubmit={onSaveProduct} className="bg-[var(--bg-elevated)] p-10 rounded-3xl border border-[var(--border-subtle)] space-y-8 relative overflow-hidden group/form">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20" />
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-display font-black italic uppercase tracking-tighter chrome-text">
                            {editingProduct ? 'Editar Produto' : 'Cadastrar Produto'}
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="font-mono text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                                {editingProduct ? `ID: ${editingProduct.id.slice(0, 8)}` : 'Rascunho'}
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
                            <input
                                name="name"
                                defaultValue={editingProduct?.name}
                                placeholder="Ex: RTX 4070 SUPER"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all"
                                required
                                onChange={e => {
                                    if (!editingProduct?.slug) setSlugDraft(generateSlug(e.target.value));
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Categoria</label>
                            <select
                                name="category"
                                defaultValue={editingProduct?.category || 'workstation_ai'}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all uppercase appearance-none"
                            >
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
                            <input
                                name="price"
                                type="number"
                                step="0.01"
                                defaultValue={editingProduct?.price}
                                placeholder="0.00"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Estoque</label>
                            <input
                                name="stock"
                                type="number"
                                defaultValue={editingProduct?.stock_quantity}
                                placeholder="0"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all"
                                required
                            />
                            <div className="flex items-center gap-3 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="stock_alert"
                                        defaultChecked={editingProduct?.stock_alert ?? false}
                                        className="w-4 h-4 rounded accent-yellow-500"
                                    />
                                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Alerta de Estoque Baixo</span>
                                </label>
                                <input
                                    name="stock_alert_min"
                                    type="number"
                                    defaultValue={editingProduct?.stock_alert_min ?? 3}
                                    min="1"
                                    placeholder="3"
                                    className="w-16 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-2 py-1 text-xs font-bold focus:border-yellow-500/50 outline-none transition-all text-center"
                                />
                                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase">un. mín.</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">SKU (ID no ERP)</label>
                            <input
                                name="sku"
                                defaultValue={editingProduct?.sku || ''}
                                placeholder="ERP-SYNC-ID"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs font-mono font-bold focus:border-[var(--accent-primary)]/50 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Slug (URL da página)</label>
                            <input
                                name="slug"
                                value={slugDraft}
                                onChange={e => setSlugDraft(e.target.value)}
                                placeholder="pc-gamer-rtx-4060"
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-xs font-mono focus:border-[var(--accent-primary)]/50 outline-none transition-all"
                            />
                            <p className="text-[9px] text-[var(--text-muted)] ml-1">Auto-gerado do nome. URL: /produtos/<span className="text-[var(--accent-primary)]">{slugDraft || '...'}</span></p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Descrição (opcional)</label>
                            <textarea
                                name="description"
                                defaultValue={editingProduct?.description || ''}
                                placeholder="Descreva o produto, diferenciais, uso recomendado..."
                                rows={3}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm focus:border-[var(--accent-primary)]/50 outline-none transition-all resize-none"
                            />
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
                                    <label 
                                        htmlFor="product-image-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl cursor-pointer bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] transition-all group/upload"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="w-8 h-8 text-[var(--accent-primary)] animate-spin" />
                                                    <p className="mt-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--accent-primary)]">Enviando arquivos...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-8 h-8 text-[var(--text-muted)] group-hover/upload:text-[var(--accent-primary)] transition-colors" />
                                                    <p className="mt-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">Upload Local (Supabase Storage)</p>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                    <input
                                        id="product-image-upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async e => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length === 0) return;

                                            console.log('[UPLOAD] Iniciando upload de', files.length, 'arquivos...');
                                            setLoading(true);
                                            const urls = [...previewUrls];

                                            try {
                                                for (const file of files) {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                                                    const filePath = `${fileName}`;

                                                    console.log(`[UPLOAD] Enviando: ${file.name} -> ${filePath}`);
                                                    
                                                    const { error: uploadError, data } = await supabase.storage
                                                        .from('products')
                                                        .upload(filePath, file, {
                                                            cacheControl: '3600',
                                                            upsert: false
                                                        });

                                                    if (uploadError) {
                                                        console.error('[UPLOAD ERROR]', uploadError);
                                                        alert(`Erro no upload (${file.name}): ${uploadError.message}\n\nVerifique se o bucket "products" existe no Supabase e tem políticas de acesso.`);
                                                        continue;
                                                    }

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('products')
                                                        .getPublicUrl(filePath);

                                                    console.log(`[UPLOAD SUCCESS] URL: ${publicUrl}`);
                                                    urls.push(publicUrl);
                                                }
                                                setPreviewUrls(urls);
                                            } catch (err: any) {
                                                console.error('[UPLOAD FATAL ERROR]', err);
                                                alert('Erro crítico no processo de upload. Veja o console para detalhes.');
                                            } finally {
                                                setLoading(false);
                                                // Limpar o input para permitir selecionar o mesmo arquivo novamente se necessário
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Especificações (JSON)</label>
                                <textarea
                                    name="specs"
                                    defaultValue={editingProduct?.specs ? JSON.stringify(editingProduct.specs) : ''}
                                    placeholder='{"key": "value"}'
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-primary)]/50 outline-none h-32 font-mono text-xs font-bold leading-relaxed transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">URLs das Imagens (uma por linha)</label>
                                <textarea
                                    name="image_urls"
                                    value={previewUrls.join('\n')}
                                    onChange={e => {
                                        const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                                        setPreviewUrls(urls);
                                    }}
                                    placeholder="https://assets.nexus.tech/..."
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:border-[var(--accent-primary)]/50 outline-none h-32 font-mono text-xs font-bold leading-relaxed transition-all"
                                />
                            </div>

                            {previewUrls.length > 0 && (
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                                    {previewUrls.map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-primary)] group/preview">
                                            <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = 'https://placehold.co/100x100?text=Erro')} />
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
                            .map(product => (
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
                                                onClick={() => onDeleteProduct(product.id)}
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
    );
}
