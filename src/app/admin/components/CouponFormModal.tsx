'use client';
import { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DiscountCoupon } from '@/types/admin';
import type { Product } from '@/types/product';

interface CouponFormModalProps {
  show: boolean;
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
  editing?: DiscountCoupon | null;
}

const defaultForm = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  scope: 'universal' as 'universal' | 'category' | 'product',
  product_id: '',
  category: '',
  max_uses: '',
  expires_at: '',
};

export function CouponFormModal({ show, products, onClose, onSaved, editing }: CouponFormModalProps) {
  const [form, setForm] = useState(
    editing
      ? {
          code: editing.code,
          discount_type: editing.discount_type,
          discount_value: String(editing.discount_value),
          scope: editing.scope,
          product_id: editing.product_id || '',
          category: editing.category || '',
          max_uses: editing.max_uses !== null && editing.max_uses !== undefined ? String(editing.max_uses) : '',
          expires_at: editing.expires_at ? editing.expires_at.slice(0, 10) : '',
        }
      : defaultForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload: any = {
      code: form.code.toUpperCase().trim(),
      owner_id: 'IAGO_CYBER',
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      scope: form.scope,
      product_id: form.scope === 'product' ? form.product_id || null : null,
      category: form.scope === 'category' ? form.category || null : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at + 'T23:59:59').toISOString() : null,
    };

    let result;
    if (editing) {
      result = await supabase.from('discount_coupons').update(payload).eq('id', editing.id);
    } else {
      result = await supabase.from('discount_coupons').insert(payload);
    }

    setSaving(false);
    if (result.error) {
      setError(result.error.message.includes('unique') ? 'Código já existe.' : result.error.message);
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020406]/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[32px] p-10 max-w-md w-full relative overflow-hidden card-dark space-y-5"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-20" />

        <button type="button" onClick={onClose} className="absolute top-8 right-8 text-[var(--text-muted)] hover:text-white transition-colors">
          <X size={22} />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
            <Tag className="text-[var(--accent-primary)]" size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black italic uppercase tracking-tighter chrome-text leading-tight">
              {editing ? 'Editar Cupom' : 'Novo Cupom'}
            </h2>
            <p className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest">Comissão → IAGO_CYBER</p>
          </div>
        </div>

        {/* Código */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Código do Cupom</label>
          <input
            required
            type="text"
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-mono font-black text-lg focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all uppercase tracking-wider"
            placeholder="EX: SSD20"
          />
        </div>

        {/* Desconto */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Tipo</label>
            <select
              value={form.discount_type}
              onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[var(--accent-primary)]/50 appearance-none"
            >
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Fixo (R$)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">
              Valor {form.discount_type === 'percentage' ? '(%)' : '(R$)'}
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.discount_value}
              onChange={e => setForm({ ...form, discount_value: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[var(--accent-primary)]/50"
              placeholder={form.discount_type === 'percentage' ? '20' : '50.00'}
            />
          </div>
        </div>

        {/* Escopo */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Válido para</label>
          <select
            value={form.scope}
            onChange={e => setForm({ ...form, scope: e.target.value as any, product_id: '', category: '' })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[var(--accent-primary)]/50 appearance-none"
          >
            <option value="universal">Universal — qualquer produto</option>
            <option value="category">Categoria específica</option>
            <option value="product">Produto específico</option>
          </select>
        </div>

        {form.scope === 'category' && (
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[var(--accent-primary)]/50 appearance-none uppercase"
            >
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {form.scope === 'product' && (
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Produto</label>
            <select
              value={form.product_id}
              onChange={e => setForm({ ...form, product_id: e.target.value })}
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[var(--accent-primary)]/50 appearance-none"
            >
              <option value="">Selecione...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* Limites */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Máx. de usos <span className="opacity-40 normal-case tracking-normal font-normal">— vazio = ∞</span></label>
            <input
              type="number" min="1"
              value={form.max_uses}
              onChange={e => setForm({ ...form, max_uses: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[var(--accent-primary)]/50"
              placeholder="Ex: 100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Validade <span className="opacity-40 normal-case tracking-normal font-normal">— vazio = sem expiração</span></label>
            <input
              type="date"
              value={form.expires_at}
              onChange={e => setForm({ ...form, expires_at: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:border-[var(--accent-primary)]/50"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 font-mono bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-white hover:bg-slate-200 disabled:opacity-50 text-[#121216] font-display font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-2xl transition-all hover:scale-[1.01]"
        >
          {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Cupom'}
        </button>
      </form>
    </div>
  );
}
