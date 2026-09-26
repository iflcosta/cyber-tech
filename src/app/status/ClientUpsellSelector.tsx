'use client';

interface UpsellOption {
  id: string;
  title: string;
  desc: string;
  price: number;
}

interface ClientUpsellSelectorProps {
  options: UpsellOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ClientUpsellSelector({
  options,
  selectedIds,
  onToggle,
}: ClientUpsellSelectorProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="border border-zinc-300 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2.5 mb-3">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
          <span>💡</span> Cuidados & Adicionais Recomendados para o seu Equipamento
        </span>
        <span className="text-[11px] font-mono text-zinc-500 font-semibold">
          Toque para incluir no orçamento
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {options.map((opt) => {
          const isChecked = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={`text-left p-3 border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                isChecked
                  ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <strong className="text-xs font-bold block leading-snug">{opt.title}</strong>
                  <span
                    className={`text-xs font-mono font-bold shrink-0 px-1.5 py-0.5 ${
                      isChecked ? 'bg-white text-zinc-950' : 'bg-zinc-200 text-zinc-800'
                    }`}
                  >
                    {isChecked ? '✓ Incluído' : `+ ${fmtBRL(opt.price)}`}
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${
                    isChecked ? 'text-zinc-300' : 'text-zinc-600'
                  }`}
                >
                  {opt.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200/40 flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                    isChecked ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {isChecked ? 'Remover adicional' : 'Adicionar ao serviço'}
                </span>
                <span className="text-xs font-bold">{isChecked ? '✓' : '+'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
