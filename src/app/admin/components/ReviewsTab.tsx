'use client';
import { Star, RefreshCw, Sparkles, X } from 'lucide-react';
import type { Review } from '@/types/review';

interface ReviewsTabProps {
  reviews: Review[];
  loading: boolean;
  sentimentAnalysis: string | null;
  isAnalyzing: boolean;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  onAnalyze: () => void;
  onRefresh: () => void;
  onClearSentiment: () => void;
}

export function ReviewsTab({
  reviews,
  loading,
  sentimentAnalysis,
  isAnalyzing,
  onApprove,
  onDelete,
  onAnalyze,
  onRefresh,
  onClearSentiment,
}: ReviewsTabProps) {
  return (
    <div className="glass rounded-3xl overflow-hidden border border-white/10 bg-white/5">
      <div className="p-6 border-b border-white/10 flex items-center justify-between font-bold uppercase tracking-tighter italic">
        <div className="flex items-center gap-2">
          <Star size={20} className="text-yellow-500" /> Moderação de Depoimentos
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || reviews.length === 0}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Analisar Sentimento (IA)
          </button>
          <button onClick={onRefresh} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {sentimentAnalysis && (
        <div className="mx-6 mt-6 p-6 bg-purple-500/5 border border-purple-500/20 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onClearSentiment} className="text-white/20 hover:text-white"><X size={16} /></button>
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
                  <div className="font-display font-black uppercase tracking-tighter text-sm mb-0.5">{(review as any).user_name}</div>
                  <div className="font-mono text-[10px] text-[var(--accent-primary)]">{review.voucher_code}</div>
                </td>
                <td className="p-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-white/10'} />
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
                      onClick={() => onApprove(review.id)}
                      className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Aprovar
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(review.id)}
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
  );
}
