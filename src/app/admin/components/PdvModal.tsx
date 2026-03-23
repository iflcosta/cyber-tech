'use client';
import { X, Package, Trash2 } from 'lucide-react';
import type { PdvForm } from '@/types/admin';
import type { Product } from '@/types/product';
import type { Executor } from '@/types/admin';

interface PdvModalProps {
    showPdvModal: boolean;
    pdvForm: PdvForm;
    setPdvForm: React.Dispatch<React.SetStateAction<PdvForm>>;
    pdvProductSearch: string;
    setPdvProductSearch: React.Dispatch<React.SetStateAction<string>>;
    pdvProductCategory: string;
    setPdvProductCategory: React.Dispatch<React.SetStateAction<string>>;
    pdvProductQty: number;
    setPdvProductQty: React.Dispatch<React.SetStateAction<number>>;
    submitPdvForm: (e: React.FormEvent) => void;
    closePdvModal: () => void;
    products: Product[];
    currentExecutor: Executor;
}

export function PdvModal({
    showPdvModal,
    pdvForm,
    setPdvForm,
    pdvProductSearch,
    setPdvProductSearch,
    pdvProductCategory,
    setPdvProductCategory,
    pdvProductQty,
    setPdvProductQty,
    submitPdvForm,
    closePdvModal,
    products,
    currentExecutor,
}: PdvModalProps) {
    if (!showPdvModal) return null;

    return (
        <div className="fixed inset-0 bg-[#020406]/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <form
                onSubmit={submitPdvForm}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[32px] p-10 max-w-lg w-full relative overflow-hidden card-dark"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20" />

                <button
                    type="button"
                    onClick={closePdvModal}
                    className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
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
                            onChange={e => setPdvForm({ ...pdvForm, customerName: e.target.value })}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                            placeholder="Cliente Balcão"
                        />
                    </div>

                    {/* Produtos da Venda */}
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4">
                        <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Produtos da Venda</label>

                        {/* Itens adicionados */}
                        {pdvForm.consumedProducts.length > 0 && (
                            <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                                {pdvForm.consumedProducts.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 rounded-xl">
                                        <div className="flex flex-col flex-1 mr-2">
                                            <span className="text-xs font-bold chrome-text uppercase leading-tight">{item.name}</span>
                                            <span className="text-[9px] font-mono text-[var(--text-muted)]">Qtd: {item.quantity} · Est. atual: {item.current_stock} · R$ {(item.price ?? 0).toLocaleString('pt-BR')}</span>
                                        </div>
                                        {/* Ajuste rápido de qtd */}
                                        <div className="flex items-center gap-1 mr-2">
                                            <button type="button" onClick={() => {
                                                const newArr = [...pdvForm.consumedProducts];
                                                if (newArr[idx].quantity > 1) {
                                                    newArr[idx] = { ...newArr[idx], quantity: newArr[idx].quantity - 1 };
                                                    setPdvForm({ ...pdvForm, consumedProducts: newArr });
                                                }
                                            }} className="w-6 h-6 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs flex items-center justify-center hover:bg-[var(--accent-primary)]/10 transition-colors">-</button>
                                            <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                                            <button type="button" onClick={() => {
                                                const newArr = [...pdvForm.consumedProducts];
                                                if (newArr[idx].quantity < (item.current_stock || 99)) {
                                                    newArr[idx] = { ...newArr[idx], quantity: newArr[idx].quantity + 1 };
                                                    setPdvForm({ ...pdvForm, consumedProducts: newArr });
                                                }
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
                                onChange={e => setPdvProductSearch(e.target.value)}
                                placeholder="Buscar nome ou SKU..."
                                className="col-span-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all placeholder:text-[var(--text-muted)]"
                            />
                            <select
                                value={pdvProductCategory}
                                onChange={e => setPdvProductCategory(e.target.value)}
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
                                    onChange={e => setPdvProductQty(Math.max(1, parseInt(e.target.value) || 1))}
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
                                ))}
                            {products.filter(p => p.stock_quantity > 0).filter(p => {
                                if (pdvProductCategory && p.category !== pdvProductCategory) return false;
                                const q = pdvProductSearch.toLowerCase();
                                return !q || (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
                            }).length === 0 && (
                                <div className="py-4 text-center text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest">Nenhum produto encontrado.</div>
                            )}
                        </div>
                    </div>

                    {/* Valor manual + descrição */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Valor manual (R$) <span className="opacity-50 normal-case tracking-normal font-normal">— substitui produtos</span></label>
                            <input
                                type="number" step="0.01" min={0}
                                value={pdvForm.manualFinalValue}
                                onChange={e => setPdvForm({ ...pdvForm, manualFinalValue: e.target.value })}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-display font-black text-lg focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Descrição do serviço</label>
                            <input
                                type="text"
                                value={pdvForm.serviceDescription}
                                onChange={e => setPdvForm({ ...pdvForm, serviceDescription: e.target.value })}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                                placeholder="ex: venda cabo de rede"
                            />
                        </div>
                    </div>

                    {/* Desconto & Valor final (Calculado) */}
                    {(() => {
                        const manualOverride = parseFloat(pdvForm.manualFinalValue) || 0;
                        const sub = manualOverride > 0 ? manualOverride : pdvForm.consumedProducts.reduce((acc, item) => acc + ((item.price ?? 0) * item.quantity), 0);
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
                                            onChange={e => setPdvForm({ ...pdvForm, discountValue: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="w-20 shrink-0">
                                        <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-transparent mb-1">Tipo</label>
                                        <select
                                            value={pdvForm.discountType}
                                            onChange={e => setPdvForm({ ...pdvForm, discountType: e.target.value as 'fixed' | 'percentage' })}
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
                                <input type="checkbox" checked={pdvForm.ecosystemCaptured} onChange={e => setPdvForm({ ...pdvForm, ecosystemCaptured: e.target.checked })} className="opacity-0 absolute inset-0 cursor-pointer z-10" />
                                {pdvForm.ecosystemCaptured && <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-primary)]" />}
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-black uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">Ecossistema digital — 8% / 5% &gt;R$8k</div>
                                <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">Site, Instagram, catálogo ou indicação digital</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                            <div className="relative w-5 h-5 shrink-0 rounded-md bg-black/40 border border-white/20 group-hover:border-[var(--accent-primary)]/50 flex items-center justify-center transition-all">
                                <input type="checkbox" checked={pdvForm.isAssembly} onChange={e => setPdvForm({ ...pdvForm, isAssembly: e.target.checked })} className="opacity-0 absolute inset-0 cursor-pointer z-10" />
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

                                <div className="space-y-1.5">
                                    <div className="text-[8px] font-mono uppercase tracking-widest text-[var(--text-muted)]">Valor da comissão <span className="opacity-50">(deixe vazio para não registrar)</span></div>
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
                                            onChange={e => setPdvForm({ ...pdvForm, customCommissionAmount: e.target.value })}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[var(--accent-primary)]/50"
                                        />
                                        {pdvForm.customCommissionAmount && (() => {
                                            const _sub = parseFloat(pdvForm.manualFinalValue) || pdvForm.consumedProducts.reduce((s, i) => s + (i.price ?? 0) * i.quantity, 0);
                                            const _ca = parseFloat(pdvForm.customCommissionAmount) || 0;
                                            const _cv = pdvForm.customCommissionType === 'percent' ? _sub * (_ca / 100) : _ca;
                                            return _cv > 0 ? <span className="text-[9px] font-mono text-[var(--accent-primary)] shrink-0">R$ {_cv.toFixed(2)}</span> : null;
                                        })()}
                                    </div>
                                </div>
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
    );
}
