"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Cpu, MonitorPlay, Zap, HardDrive, Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulatorOption {
  id: string;
  category: 'cpu' | 'gpu' | 'ram' | 'storage';
  name: string;
  price: number;
  description: string | null;
}

const CATEGORIES = [
  { id: 'cpu', label: 'Processador', icon: Cpu },
  { id: 'gpu', label: 'Placa de Vídeo', icon: MonitorPlay },
  { id: 'ram', label: 'Memória RAM', icon: Zap },
  { id: 'storage', label: 'Armazenamento (SSD)', icon: HardDrive },
] as const;

export function SimulatorTab() {
  const [options, setOptions] = useState<SimulatorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]['id']>('cpu');
  
  // Form state
  const [form, setForm] = useState<Partial<SimulatorOption>>({
    category: 'cpu',
    name: '',
    price: 0,
    description: '',
  });

  const fetchOptions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('simulator_options')
      .select('*')
      .order('price', { ascending: true });
    
    if (!error && data) setOptions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let error;
    if (editingId) {
      const { error: err } = await supabase
        .from('simulator_options')
        .update({
          name: form.name,
          price: form.price,
          description: form.description,
          category: form.category,
        })
        .eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('simulator_options')
        .insert([form]);
      error = err;
    }

    if (!error) {
      setForm({ category: activeCategory, name: '', price: 0, description: '' });
      setEditingId(null);
      fetchOptions();
    } else {
      alert('Erro ao salvar: ' + error.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta opção?')) return;
    setLoading(true);
    const { error } = await supabase.from('simulator_options').delete().eq('id', id);
    if (!error) fetchOptions();
    else {
      alert('Erro ao excluir: ' + error.message);
      setLoading(false);
    }
  };

  const startEdit = (opt: SimulatorOption) => {
    setEditingId(opt.id);
    setForm(opt);
    setActiveCategory(opt.category);
  };

  const filteredOptions = options.filter(opt => opt.category === activeCategory);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-display font-black italic uppercase tracking-tighter chrome-text flex items-center gap-3">
            <Zap className="text-[var(--accent-primary)]" />
            Configurador do Simulador
          </h2>
          <p className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Gerenciamento de Opções e Preços</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 sticky top-8">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[var(--text-primary)] mb-6 flex items-center gap-2">
              {editingId ? <Edit2 size={14} /> : <Plus size={14} />}
              {editingId ? 'Editar Opção' : 'Nova Opção'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Categoria</label>
                <select
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as any })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-xs font-mono focus:border-[var(--accent-primary)] outline-none transition-all"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Nome do Item</label>
                <input
                  required
                  placeholder="Ex: Intel Core i5"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-xs font-mono focus:border-[var(--accent-primary)] outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Preço Base (Manual)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-[var(--text-muted)]">R$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono focus:border-[var(--accent-primary)] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">Descrição/Destaque (Opcional)</label>
                <input
                  placeholder="Ex: Ideal para games 1080p"
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-xs font-mono focus:border-[var(--accent-primary)] outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--accent-primary)] text-[var(--bg-primary)] py-3 rounded-xl font-display font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : (editingId ? 'Salvar Alteração' : 'Adicionar Item')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                        setEditingId(null);
                        setForm({ category: activeCategory, name: '', price: 0, description: '' });
                    }}
                    className="px-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] rounded-xl hover:text-white transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setForm({ ...form, category: cat.id }); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[9px] transition-all border shrink-0 ${activeCategory === cat.id ? 'bg-white/5 border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-white/20'}`}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {loading && options.length === 0 ? (
                <div className="p-12 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest animate-pulse">
                  Carregando banco de dados...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-12 text-center text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-widest border-2 border-dashed border-white/5 m-4 rounded-xl">
                  Nenhum item cadastrado nesta categoria.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[var(--bg-elevated)] z-10 border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Item</th>
                      <th className="px-6 py-4 text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)]">Preço Base</th>
                      <th className="px-6 py-4 text-[9px] font-mono font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {filteredOptions.map((opt) => (
                        <motion.tr
                          key={opt.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`group border-b border-white/5 hover:bg-white/[0.02] transition-colors ${editingId === opt.id ? 'bg-[var(--accent-primary)]/5' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-display font-bold text-xs uppercase text-[var(--text-primary)]">{opt.name}</div>
                            {opt.description && <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{opt.description}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-xs text-[var(--accent-primary)]">
                              R$ {opt.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => startEdit(opt)}
                                className="p-2 hover:bg-white/10 text-[var(--text-muted)] hover:text-white rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(opt.id)}
                                className="p-2 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
