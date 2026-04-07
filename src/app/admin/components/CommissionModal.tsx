'use client';
import { TrendingUp, Trash2, Plus, X, CheckCircle2 } from 'lucide-react';
import type { CommissionForm } from '@/types/admin';
import type { Lead } from '@/types/lead';
import type { MaintenanceOrder } from '@/types/maintenance';
import type { Product } from '@/types/product';

type SelectedLead = Lead | MaintenanceOrder | (Lead & { equipment_type?: string }) | (MaintenanceOrder & { interest_type?: string; client_name?: string });

interface CommissionModalProps {
  show: boolean;
  selectedLead: SelectedLead | null;
  commissionForm: CommissionForm;
  setCommissionForm: (form: CommissionForm) => void;
  products: Product[];
  manualProductSelect: string;
  setManualProductSelect: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CommissionModal({
  show,
  selectedLead,
  commissionForm,
  setCommissionForm,
  products,
  manualProductSelect,
  setManualProductSelect,
  onSubmit,
  onClose,
}: CommissionModalProps) {
  if (!show || !selectedLead) return null;

  const _val = parseFloat(commissionForm.finalValue) || 0;
  const _cost = parseFloat(commissionForm.costValue) || 0;
  const _isDigital = ['site', 'instagram', 'facebook', 'insta', 'face', 'direct', 'direto'].includes(
    (('marketing_source' in selectedLead ? selectedLead.marketing_source : '') ?? '').toLowerCase()
  );
  const _baseRate = commissionForm.ecosystemCaptured ? (_val > 8000 ? 0.05 : 0.08) : 0;
  const _customAmt = parseFloat(commissionForm.customCommissionAmount) || 0;
  const _customComm = commissionForm.customCommissionType === 'percent' ? _val * (_customAmt / 100) : _customAmt;
  const _iagoAssembly = commissionForm.isAssembly && commissionForm.executor === 'iago'
    ? (_customAmt > 0 ? _customComm : _val * 0.03) : 0;
  const _jeffAssembly = commissionForm.isAssembly && commissionForm.executor === 'partner'
      ? (_customAmt > 0 ? _customComm : _val * 0.03) : 0;
  const _totalIago = _val * _baseRate + _iagoAssembly;
  const _isMaintenance = ('interest_type' in selectedLead && selectedLead.interest_type === 'upgrade')
    || ('equipment_type' in selectedLead && !!selectedLead.equipment_type);

  const clientName = 'client_name' in selectedLead ? selectedLead.client_name : selectedLead.customer_name;
  const serviceType = 'interest_type' in selectedLead ? selectedLead.interest_type : ('equipment_type' in selectedLead ? selectedLead.equipment_type : undefined);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <form onSubmit={onSubmit} className="bg-[#0e1117] border border-white/10 rounded-3xl w-full max-w-md relative my-6 overflow-hidden">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-60" />

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
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="mx-6 mb-5 flex items-center justify-between bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-white leading-none">{clientName || 'Cliente'}</div>
            <div className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mt-1">{serviceType ?? 'Serviço'}</div>
          </div>
          {selectedLead.voucher_code && (
            <div className="text-[9px] font-mono text-[var(--accent-primary)]/70 bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15 rounded-lg px-2 py-1">
              {selectedLead.voucher_code}
            </div>
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

            {_isMaintenance && (
              <label className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3 cursor-pointer transition-all group">
                <div className="relative w-5 h-5 shrink-0 rounded-md bg-black/40 border border-white/20 group-hover:border-[var(--accent-primary)]/50 flex items-center justify-center transition-all">
                  <input type="checkbox"
                    checked={('interest_type' in selectedLead && selectedLead.interest_type === 'pc_build') || commissionForm.isAssembly}
                    disabled={'interest_type' in selectedLead && selectedLead.interest_type === 'pc_build'}
                    onChange={(e) => setCommissionForm({ ...commissionForm, isAssembly: e.target.checked })}
                    className="opacity-0 absolute inset-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                  />
                  {(('interest_type' in selectedLead && selectedLead.interest_type === 'pc_build') || commissionForm.isAssembly) && <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-primary)]" />}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">Projeto de Upgrade</div>
                  <div className="text-[8px] font-mono text-[var(--text-muted)] mt-0.5">
                    {'interest_type' in selectedLead && selectedLead.interest_type === 'pc_build' ? 'Automático — Montagem de PC' : 'Serviço de montagem / upgrade'}
                  </div>
                </div>
              </label>
            )}
          </div>

          {/* Executor */}
          {commissionForm.isAssembly && (
            <div className="space-y-2">
            <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Executor da montagem</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'owner', label: 'Felipe', role: 'Dono', color: 'white/60' },
                  { value: 'iago', label: 'Iago', role: 'Marketing', color: '[var(--accent-primary)]' },
                  { value: 'partner', label: 'Jefferson', role: 'Técnico', color: 'purple-400' },
                ].map(opt => (
                  <label key={opt.value} className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer transition-all text-center ${commissionForm.executor === opt.value ? 'border-white/30 bg-white/10' : 'border-white/8 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                    <input type="radio" name="assemblyExecutor" value={opt.value}
                      checked={commissionForm.executor === opt.value}
                      onChange={(e) => setCommissionForm({ ...commissionForm, executor: e.target.value as 'owner' | 'iago' | 'partner' })}
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



              {(commissionForm.executor === 'iago' || commissionForm.executor === 'partner') && (
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg overflow-hidden border border-white/10">
                    <button type="button" onClick={() => setCommissionForm({ ...commissionForm, customCommissionType: 'percent' })}
                      className={`px-3 py-1.5 text-[9px] font-mono font-black transition-all ${commissionForm.customCommissionType === 'percent' ? 'bg-[var(--accent-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}>%</button>
                    <button type="button" onClick={() => setCommissionForm({ ...commissionForm, customCommissionType: 'value' })}
                      className={`px-3 py-1.5 text-[9px] font-mono font-black transition-all ${commissionForm.customCommissionType === 'value' ? 'bg-[var(--accent-primary)] text-black' : 'bg-transparent text-[var(--text-muted)] hover:text-white'}`}>R$</button>
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
              )}
            </div>
          )}

          {/* Commission preview */}
          {_val > 0 && (_totalIago > 0 || _jeffAssembly > 0) && (
            <div className="bg-green-500/5 border border-green-500/15 rounded-2xl px-4 py-3 space-y-2">
              <div className="text-[9px] font-mono font-black uppercase tracking-widest text-green-400/70">Resumo de comissões</div>
              {_totalIago > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Iago</span>
                  <span className="text-sm font-display font-black text-green-400">R$ {_totalIago.toFixed(2)}</span>
                </div>
              )}
              {_jeffAssembly > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Jefferson</span>
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

          {/* Baixa de estoque */}
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
                    <button type="button" onClick={() => {
                      const newArr = [...commissionForm.consumedProducts];
                      newArr.splice(idx, 1);
                      setCommissionForm({ ...commissionForm, consumedProducts: newArr });
                    }} className="p-1 hover:bg-red-500/20 text-red-400/60 hover:text-red-400 rounded-lg transition-colors">
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
              <button type="button" onClick={() => {
                if (!manualProductSelect) return;
                const p = products.find(prod => prod.id === manualProductSelect);
                if (!p) return;
                const existingIdx = commissionForm.consumedProducts.findIndex(item => item.product_id === p.id);
                const newArr = [...commissionForm.consumedProducts];
                if (existingIdx >= 0) {
                  newArr[existingIdx] = { ...newArr[existingIdx], quantity: newArr[existingIdx].quantity + 1 };
                } else {
                  newArr.push({ product_id: p.id, quantity: 1, name: p.name, current_stock: p.stock_quantity });
                }
                setCommissionForm({ ...commissionForm, consumedProducts: newArr });
                setManualProductSelect('');
              }} className="bg-[var(--accent-primary)] text-black px-3 py-2 rounded-xl flex items-center justify-center hover:scale-105 transition-all">
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
}
