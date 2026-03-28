'use client';
import { useState } from 'react';
import { Tag, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DiscountCoupon } from '@/types/admin';
import type { Product } from '@/types/product';
import { CouponFormModal } from './CouponFormModal';

interface CouponsTabProps {
  coupons: DiscountCoupon[];
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
}

function getCouponStatus(c: DiscountCoupon): { label: string; color: string } {
  if (!c.is_active) return { label: 'Desativado', color: 'bg-white/5 text-white/30 border-white/10' };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { label: 'Expirado', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { label: 'Esgotado', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
  return { label: 'Ativo', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
}

export function CouponsTab({ coupons, products, loading, onRefresh }: CouponsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiscountCoupon | null>(null);

  const handleToggle = async (c: DiscountCoupon) => {
    await supabase.from('discount_coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom? Esta ação não pode ser desfeita.')) return;
    await supabase.from('discount_coupons').delete().eq('id', id);
    onRefresh();
  };

  const scopeLabel = (c: DiscountCoupon) => {
    if (c.scope === 'product') {
      const p = products.find(p => p.id === c.product_id);
      return p ? `Produto: ${p.name}` : 'Produto específico';
    }
    if (c.scope === 'category') return `Categoria: ${c.category}`;
    return 'Universal';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-black italic uppercase tracking-tighter chrome-text">Cupons de Desconto</h2>
          <p className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">
            Comissão atribuída a Iago · {coupons.filter(c => getCouponStatus(c).label === 'Ativo').length} ativos
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 rounded-xl font-display font-black text-xs tracking-widest uppercase transition-all hover:scale-[1.02]"
        >
          <Plus size={16} /> Novo Cupom
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest animate-pulse">Carregando...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[var(--border-subtle)] rounded-3xl text-[var(--text-muted)] text-[10px] font-mono uppercase tracking-widest">
          Nenhum cupom criado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const status = getCouponStatus(c);
            return (
              <div
                key={c.id}
                className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-4 hover:border-[var(--accent-primary)]/20 transition-all"
              >
                {/* Code + badge */}
                <div className="flex items-center gap-4 min-w-[160px]">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center shrink-0">
                    <Tag size={16} className="text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <div className="text-base font-mono font-black tracking-wider text-white">{c.code}</div>
                    <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-widest border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Discount value */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-[8px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Desconto</div>
                    <div className="text-sm font-black text-[var(--accent-primary)]">
                      {c.discount_type === 'percentage' ? `${c.discount_value}%` : `R$ ${c.discount_value.toLocaleString('pt-BR')}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Escopo</div>
                    <div className="text-xs font-bold text-white truncate max-w-[120px] mx-auto">{scopeLabel(c)}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Usos</div>
                    <div className="text-xs font-black text-white">
                      {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ' / ∞'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Validade</div>
                    <div className="text-xs font-black text-white">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : 'Sem expiração'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`p-2 rounded-xl border transition-all ${c.is_active ? 'text-green-400 border-green-500/20 hover:bg-green-500/10' : 'text-white/30 border-white/10 hover:bg-white/5'}`}
                    title={c.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {c.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => { setEditing(c); setShowForm(true); }}
                    className="p-2 text-[var(--text-muted)] hover:text-white border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 rounded-xl transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CouponFormModal
        show={showForm}
        products={products}
        editing={editing}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={onRefresh}
      />
    </div>
  );
}
