'use client';
import { Search, X } from 'lucide-react';
import type { Lead } from '@/types/lead';
import type { MaintenanceOrder } from '@/types/maintenance';
import type { TabId } from '@/types/admin';

interface GlobalSearchProps {
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
  leads: Lead[];
  maintenanceOrders: MaintenanceOrder[];
  onNavigate: (tab: TabId) => void;
}

export function GlobalSearch({ globalSearch, setGlobalSearch, leads, maintenanceOrders, onNavigate }: GlobalSearchProps) {
  const q = globalSearch.toLowerCase().trim();
  const searchResults = q.length >= 2 ? [
    ...leads.filter(l => l.status !== 'dismissed' && (
      l.client_name?.toLowerCase().includes(q) ||
      l.whatsapp?.includes(q) ||
      l.voucher_code?.toLowerCase().includes(q)
    )).map(l => ({ ...l, _type: 'lead' as const })),
    ...maintenanceOrders.filter(o =>
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_phone?.includes(q) ||
      o.voucher_code?.toLowerCase().includes(q)
    ).map(o => ({ ...o, _type: 'maintenance' as const })),
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
        {globalSearch && (
          <button onClick={() => setGlobalSearch('')}>
            <X size={12} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
          </button>
        )}
      </div>
      {q.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)] text-sm">Nenhum resultado para "{globalSearch}"</div>
          ) : searchResults.map((item) => (
            <div
              key={item.id}
              className="p-4 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              onClick={() => {
                const tab: TabId = item._type === 'maintenance'
                  ? 'maintenance'
                  : 'interest_type' in item && item.interest_type === 'upgrade'
                    ? 'maintenance'
                    : 'interest_type' in item && ['venda', 'pc_build', 'compra', 'showroom'].includes(item.interest_type ?? '')
                      ? 'vendas'
                      : 'leads';
                onNavigate(tab);
                setGlobalSearch('');
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {'client_name' in item ? item.client_name : item.customer_name ?? 'Sem nome'}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--accent-primary)]">
                    {'whatsapp' in item ? item.whatsapp : item.customer_phone ?? '—'}
                  </div>
                  {'description' in item && item.description && (
                    <div className="text-[10px] text-[var(--text-muted)] italic mt-1">"{item.description}"</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-[9px] font-mono uppercase px-2 py-1 rounded-full ${item._type === 'maintenance' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                    {item._type === 'maintenance' ? 'Manutenção' : 'interest_type' in item ? (item.interest_type ?? 'Lead') : 'Lead'}
                  </div>
                  {item.voucher_code && (
                    <div className="text-[9px] font-mono text-[var(--accent-primary)] mt-1">{item.voucher_code}</div>
                  )}
                  <div className="text-[9px] text-[var(--text-muted)] mt-1">
                    {new Date(item.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
