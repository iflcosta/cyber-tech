'use client';
import { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Copy, Check, RefreshCw, X, FileIcon, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function MediaTab() {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const bucketName = 'products';

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from(bucketName)
                .list('', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });

            if (error) throw error;
            setFiles(data || []);
        } catch (err: any) {
            console.error('Erro ao buscar arquivos:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const filesToUpload = Array.from(e.target.files || []);
        if (filesToUpload.length === 0) return;

        setUploading(true);
        try {
            for (const file of filesToUpload) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
                const filePath = fileName;

                const { error } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, file);

                if (error) throw error;
            }
            alert('✅ Upload concluído!');
            fetchFiles();
        } catch (err: any) {
            console.error('Erro no upload:', err.message);
            alert('❌ Erro no upload: ' + err.message);
        } finally {
            setUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDelete = async (name: string) => {
        if (!confirm('Tem certeza que deseja excluir esta imagem permanentemente?')) return;

        try {
            const { error } = await supabase.storage
                .from(bucketName)
                .remove([name]);

            if (error) throw error;
            setFiles(files.filter(f => f.name !== name));
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const getUrl = (name: string) => {
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(name);
        return publicUrl;
    };

    const filteredFiles = files.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header / Top Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-subtle)]">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-display font-black italic uppercase tracking-tighter chrome-text flex items-center gap-2">
                        <ImageIcon size={20} className="text-[var(--accent-primary)]" />
                        Galeria de Mídia
                    </h2>
                    <p className="text-[9px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Gerenciamento de Ativos Estáticos</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                        <input 
                            type="text"
                            placeholder="BUSCAR ARQUIVO..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-[var(--accent-primary)]/50 transition-all outline-none"
                        />
                    </div>
                    
                    <label className="cursor-pointer bg-[var(--accent-primary)] text-white px-6 py-3 rounded-xl font-display font-black text-xs tracking-widest uppercase flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-[var(--accent-primary)]/20 whitespace-nowrap">
                        {uploading ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                        {uploading ? 'SUBINDO...' : 'SUBIR IMAGENS'}
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)] p-8">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
                        <RefreshCw className="animate-spin" size={32} />
                        <p className="font-mono text-[10px] uppercase tracking-widest">Sincronizando com o Cloud Storage...</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-center mx-auto text-[var(--text-muted)] opacity-20">
                            <ImageIcon size={32} />
                        </div>
                        <p className="text-[var(--text-muted)] font-mono text-[10px] uppercase tracking-[0.4em]">
                            {searchTerm ? 'Nenhum arquivo encontrado' : 'A galeria está vazia'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredFiles.map((file) => {
                            const url = getUrl(file.name);
                            const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
                            
                            return (
                                <div key={file.id} className="group relative bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden hover:border-[var(--accent-primary)]/50 transition-all">
                                    {/* Preview container */}
                                    <div className="aspect-square flex items-center justify-center bg-[#0a0a0a] overflow-hidden relative">
                                        {isImage ? (
                                            <img 
                                                src={url} 
                                                alt={file.name} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <FileIcon size={32} className="text-[var(--text-muted)]" />
                                        )}
                                        
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                            <button 
                                                onClick={() => copyToClipboard(url)}
                                                className="p-3 bg-white text-black rounded-xl hover:scale-110 transition-all shadow-xl"
                                                title="Copiar URL"
                                            >
                                                {copiedUrl === url ? <Check size={18} /> : <Copy size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(file.name)}
                                                className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-all shadow-xl"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <div className="p-3">
                                        <div className="text-[9px] font-mono font-bold text-[var(--text-primary)] truncate uppercase" title={file.name}>
                                            {file.name}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[7px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
                                                {(file.metadata?.size / 1024).toFixed(0)} KB
                                            </span>
                                            <button 
                                                onClick={() => window.open(url, '_blank')}
                                                className="text-[7px] font-black text-[var(--accent-primary)] hover:underline uppercase tracking-tighter"
                                            >
                                                Abrir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Instructions Alert */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Check size={16} className="text-blue-400" />
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Dica de Fluxo</p>
                    <p className="text-xs text-blue-100/70 leading-relaxed">
                        Suba suas imagens aqui primeiro, clique em <strong>Copiar URL</strong> e cole no campo de imagens do cadastro de produtos ou em qualquer outro lugar do site.
                    </p>
                </div>
            </div>
        </div>
    );
}
