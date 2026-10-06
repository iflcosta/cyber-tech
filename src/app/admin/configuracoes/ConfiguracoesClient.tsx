'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPrintAgentUrl, setPrintAgentUrl, checkPrintAgentStatus, sendToPrintAgent } from '@/app/admin/lib/printAgent';
import { QRCodeImage } from '@/app/admin/components/QRCode';

const CHROME_KIOSK_COMMAND = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --user-data-dir="%LOCALAPPDATA%\\Google\\Chrome\\CyberBalcao" --kiosk-printing --test-type --app=https://www.cyberinformatica.tech/admin/os`;

export type ProfileRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'owner' | 'technician';
  can_delete: boolean;
  active: boolean;
  commission_rate: number | string | null;
  created_at?: string;
};

interface ConfiguracoesClientProps {
  userName: string;
  userRole: string;
  isOwner?: boolean;
  currentUserId?: string;
  initialProfiles?: ProfileRecord[];
}

export function ConfiguracoesClient({
  userName,
  userRole,
  isOwner = false,
  currentUserId,
  initialProfiles = [],
}: ConfiguracoesClientProps) {
  // Estado da Equipe & Permissões
  const [profiles, setProfiles] = useState<ProfileRecord[]>(initialProfiles);
  // Estado do Agente de Impressão Local (MPT-II 58mm)
  const [agentUrl, setAgentUrlState] = useState('http://127.0.0.1:9100');
  const [agentStatus, setAgentStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [agentSavedNotice, setAgentSavedNotice] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [receiptFeedback, setReceiptFeedback] = useState<string | null>(null);

  // Estado do Atalho de Kiosk
  const [copiedShortcut, setCopiedShortcut] = useState(false);

  // Estado do Teste de WhatsApp
  const [testPhone, setTestPhone] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waFeedback, setWaFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // Modal de Teste da Etiqueta Knup
  const [showLabelModal, setShowLabelModal] = useState(false);

  useEffect(() => {
    const currentUrl = getPrintAgentUrl();
    setAgentUrlState(currentUrl);
    pingAgent();
  }, []);

  async function pingAgent() {
    setAgentStatus('checking');
    const res = await checkPrintAgentStatus();
    setAgentStatus(res.ok ? 'online' : 'offline');
  }

  async function handleSaveProfile(
    targetUserId: string,
    updates: {
      role: 'owner' | 'technician';
      canDelete: boolean;
      active: boolean;
      commissionRate: number;
    },
  ): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          role: updates.role,
          canDelete: updates.canDelete,
          active: updates.active,
          commissionRate: updates.commissionRate,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        return { ok: false, message: data.error || 'Erro ao atualizar permissões.' };
      }
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === targetUserId
            ? {
                ...p,
                role: updates.role,
                can_delete: updates.canDelete,
                active: updates.active,
                commission_rate: updates.commissionRate,
              }
            : p,
        ),
      );
      return { ok: true, message: 'Permissões atualizadas com sucesso!' };
    } catch (err) {
      return { ok: false, message: (err as Error).message || 'Erro de conexão ao salvar.' };
    }
  }

  function handleSaveAgentUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!agentUrl.trim()) return;
    setPrintAgentUrl(agentUrl.trim());
    setAgentSavedNotice(true);
    setTimeout(() => setAgentSavedNotice(false), 2500);
    pingAgent();
  }

  async function handlePrintTestReceipt() {
    setPrintingReceipt(true);
    setReceiptFeedback(null);
    try {
      const cols = 22;
      const eq = '='.repeat(cols);
      const dash = '-'.repeat(cols);
      const now = new Date().toLocaleString('pt-BR');

      const lines = [
        eq,
        '  CYBER INFORMATICA   ',
        '   TESTE DE CUPOM     ',
        eq,
        'DATA: ' + now.slice(0, 16),
        'IMP: MPT-II (58MM)',
        'PORTA: LOCALHOST:9100',
        dash,
        'STATUS: CONECTADO OK',
        'SISTEMA: MODO PROGRAMA',
        dash,
        '  IMPRESSAO DIRETA    ',
        '  SEM DIALOGO WINDOWS ',
        eq,
        '      OBRIGADO!       ',
        '.', '.', '.', '.', '.', '.', '.', '.'
      ];
      const text = lines.join('\n') + '\n\n\n\n';
      const bytes = new TextEncoder().encode(text);
      const res = await sendToPrintAgent(bytes);

      if (res.ok) {
        setReceiptFeedback('✓ Recibo térmico enviado com sucesso para a MPT-II!');
      } else {
        setReceiptFeedback(`Erro: ${res.error}`);
      }
    } catch (err) {
      setReceiptFeedback(`Erro ao emitir recibo: ${(err as Error).message}`);
    } finally {
      setPrintingReceipt(false);
    }
  }

  function handleCopyKioskCommand() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(CHROME_KIOSK_COMMAND);
      setCopiedShortcut(true);
      setTimeout(() => setCopiedShortcut(false), 2500);
    }
  }

  async function handleSendTestWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setSendingWa(true);
    setWaFeedback(null);

    try {
      const res = await fetch('/api/notify/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWaFeedback({
          ok: true,
          message: `✓ Mensagem enviada com sucesso! (ID: ${data.messageId || 'ok'})`,
        });
      } else {
        setWaFeedback({
          ok: false,
          message: data.error || 'Falha ao enviar mensagem de teste.',
        });
      }
    } catch (err) {
      setWaFeedback({
        ok: false,
        message: (err as Error).message || 'Erro de conexão ao testar WhatsApp.',
      });
    } finally {
      setSendingWa(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white tracking-widest">
              Painel de Operação
            </span>
            <h1 className="mt-1 font-mono text-2xl font-black uppercase tracking-tight text-zinc-950">
              Configurações do Sistema
            </h1>
            <p className="font-mono text-xs text-zinc-600">
              Terminal de Balcão · Impressoras Térmicas · Modo Programa & Notificações
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-bold text-zinc-950 uppercase">{userName}</p>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">{userRole}</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: GESTÃO DE EQUIPE & CONTROLE DE PERMISSÕES */}
      <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                <span>👥</span> Gestão de Equipe &amp; Controle de Permissões
              </span>
              <span className="bg-zinc-950 text-white font-mono text-[10px] font-bold px-2 py-0.5 uppercase">
                {profiles.length} Membros
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-600 font-mono">
              Controle de acesso total, permissão de exclusão de dados (can_delete), status ativo e taxas de comissão.
            </p>
          </div>

          {!isOwner && (
            <span className="border border-amber-500 bg-amber-50 px-2.5 py-1 font-mono text-xs font-bold text-amber-900">
              🔒 Somente Proprietários podem alterar permissões
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((prof) => (
            <UserPermissionCard
              key={prof.id}
              profile={prof}
              isCurrentUser={prof.id === currentUserId}
              canEdit={isOwner}
              onSave={handleSaveProfile}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SEÇÃO 1: MODO PROGRAMA / STANDALONE DESKTOP */}
        <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                <span>🖥️</span> Modo Programa (Desktop)
              </h2>
              <span className="border border-zinc-300 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-700 uppercase">
                Standalone
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
              O Cyber ERP pode ser executado como um programa independente do Windows, sem barra de abas ou navegação do Chrome, com impressão silenciosa direta nas impressoras térmicas.
            </p>

            <div className="mt-4 border-2 border-zinc-950 bg-zinc-50 p-3 font-mono text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[11px] uppercase text-zinc-700">Comando do Atalho Windows:</span>
                <button
                  type="button"
                  onClick={handleCopyKioskCommand}
                  className="font-bold uppercase text-[11px] underline hover:text-zinc-950 cursor-pointer"
                >
                  {copiedShortcut ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="bg-white p-2.5 border border-zinc-300 break-all select-all font-mono text-[11px] text-zinc-900 leading-tight">
                {CHROME_KIOSK_COMMAND}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-zinc-700">
              <p className="font-mono font-bold text-[11px] uppercase text-zinc-900">
                Atalhos Rápidos de Operação:
              </p>
              <ul className="space-y-1 font-mono text-[11px]">
                <li><kbd className="bg-zinc-200 px-1 py-0.5 font-bold text-zinc-900">← Voltar</kbd>: Botão no topo esquerdo para retornar à tela anterior sem navegador.</li>
                <li><kbd className="bg-zinc-200 px-1 py-0.5 font-bold text-zinc-900">Alt + C</kbd>: Abre o Cyber Camera Sync (fotos do celular na bancada).</li>
                <li><kbd className="bg-zinc-200 px-1 py-0.5 font-bold text-zinc-900">F11</kbd>: Alterna entre tela cheia total e janela redimensionável.</li>
                <li><kbd className="bg-zinc-200 px-1 py-0.5 font-bold text-zinc-900">Ctrl + P</kbd>: Protegido no painel (evita impressões acidentais de páginas inteiras).</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 border-t border-zinc-200 pt-3">
            <button
              type="button"
              onClick={handleCopyKioskCommand}
              className="w-full border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              {copiedShortcut ? '✓ Comando Copiado para a Área de Transferência' : '📋 Copiar Comando do Atalho Windows'}
            </button>
          </div>
        </div>

        {/* SEÇÃO 2: ETIQUETAS TÉRMICAS KNUP KP-IM608 (40x60mm) */}
        <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                <span>🏷️</span> Etiqueta Knup KP-IM608 (40x60mm)
              </h2>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                40×60mm
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
              Impressora térmica de etiquetas adesivas para identificação física de aparelhos na bancada e peças no estoque, com QR Code escaneável.
            </p>

            <div className="mt-4 border-2 border-zinc-950 bg-zinc-50 p-3 space-y-2 text-xs">
              <p className="font-mono font-bold uppercase text-[11px] text-zinc-950">
                Calibração Recomendada nas Preferências do Windows:
              </p>
              <ul className="space-y-1 font-mono text-[11px] text-zinc-700">
                <li>• <strong>Papel:</strong> 40mm x 60mm (Retrato)</li>
                <li>• <strong>Margens:</strong> Nenhuma (0mm) ou Mínimas</li>
                <li>• <strong>Cabeçalho e Rodapé:</strong> Desmarcado</li>
                <li>• <strong>Escala:</strong> 100% (Padrão)</li>
              </ul>
            </div>

            <p className="mt-3 text-[11px] font-mono text-zinc-500">
              Área útil calibrada: 38mm de largura com 1mm de respiro lateral e 55mm de altura para prevenir manchas ou cortes no fim da etiqueta.
            </p>
          </div>

          <div className="mt-5 space-y-2 border-t border-zinc-200 pt-3">
            <button
              type="button"
              onClick={() => setShowLabelModal(true)}
              className="w-full border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
            >
              👁️ Visualizar Prévia da Etiqueta
            </button>
            <Link
              href="/admin/configuracoes/etiqueta-teste"
              className="block w-full border-2 border-zinc-950 bg-zinc-950 px-4 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
            >
              🖨️ Imprimir Etiqueta de Teste (40x60mm)
            </Link>
          </div>
        </div>

        {/* SEÇÃO 3: RECIBOS TÉRMICOS MPT-II (58mm) & AGENTE LOCAL */}
        <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                <span>🧾</span> Recibos MPT-II (58mm)
              </h2>
              <span
                className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                  agentStatus === 'online'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : agentStatus === 'checking'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-red-100 text-red-900 border-red-300'
                }`}
              >
                {agentStatus === 'online'
                  ? '🟢 Agente Ativo'
                  : agentStatus === 'checking'
                  ? '🟡 Verificando…'
                  : '🔴 Agente Offline'}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
              Impressora térmica de bobina para comprovantes de entrada de OS e recibos de vendas no balcão.
            </p>

            <div className="mt-4 border-2 border-zinc-950 bg-zinc-50 p-3 space-y-2 text-xs">
              <p className="font-mono font-bold uppercase text-[11px] text-zinc-950">
                Dispositivo Conectado no Computador:
              </p>
              <ul className="space-y-1 font-mono text-[11px] text-zinc-700">
                <li>• <strong>Dispositivo:</strong> MPT-II (Generic / Text Only)</li>
                <li>• <strong>Porta Física:</strong> USB006</li>
                <li>• <strong>Largura da Bobina:</strong> 58mm (Bobina Térmica)</li>
                <li>• <strong>Roteamento:</strong> Agente Cyber ERP (Porta 9100) direciona direto para MPT-II</li>
              </ul>
            </div>

            <p className="mt-3 text-[11px] font-mono text-zinc-500">
              A Knup (40x60mm) permanece como padrão para etiquetas, enquanto a MPT-II recebe os recibos via Agente sem abrir diálogos do Windows.
            </p>

            {receiptFeedback && (
              <p
                className={`mt-3 p-2 font-mono text-xs font-bold border ${
                  receiptFeedback.startsWith('✓')
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-red-50 text-red-900 border-red-300'
                }`}
              >
                {receiptFeedback}
              </p>
            )}

            {agentStatus === 'offline' && (
              <div className="mt-3 border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-950 font-mono space-y-1">
                <p className="font-bold text-amber-900">⚠️ Agente de Impressão não detectado em {agentUrl}:</p>
                <p>1. O atalho de inicialização <code className="bg-white px-1 border border-zinc-300">CyberERP-PrintAgent.vbs</code> roda o agente silenciosamente ao iniciar o Windows.</p>
                <p>2. Se o agente foi fechado, execute <code className="bg-white px-1 border border-zinc-300">print-agent/run.bat</code> na pasta do sistema.</p>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-zinc-200 pt-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={pingAgent}
                className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              >
                🔄 Testar Conexão
              </button>
              <button
                type="button"
                onClick={handlePrintTestReceipt}
                disabled={printingReceipt}
                className="flex-1 border-2 border-zinc-950 bg-zinc-950 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
              >
                {printingReceipt ? 'Enviando…' : '🖨️ Imprimir na MPT-II'}
              </button>
            </div>
            <Link
              href="/admin/configuracoes/recibo-teste"
              className="block w-full border border-zinc-300 bg-zinc-50 px-4 py-1.5 text-center font-mono text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 transition"
            >
              👁️ Abrir Tela de Teste Completa
            </Link>
          </div>
        </div>

        {/* SEÇÃO 4: WHATSAPP & EVOLUTION API */}
        <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
                <span>💬</span> WhatsApp & Mensagens Automáticas
              </h2>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                Evolution API
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-700 leading-relaxed">
              Disparo automático de comprovantes de entrada com link rastreável do portal do cliente no momento da abertura de cada Ordem de Serviço.
            </p>

            <form onSubmit={handleSendTestWhatsApp} className="mt-4 space-y-2">
              <label className="block font-mono text-[11px] font-bold uppercase text-zinc-800">
                Enviar WhatsApp de Teste para o Número:
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 border-2 border-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-950 bg-white"
                  placeholder="(11) 99999-9999"
                />
                <button
                  type="submit"
                  disabled={sendingWa || !testPhone.trim()}
                  className="border-2 border-zinc-950 bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {sendingWa ? 'Enviando…' : 'Enviar Teste'}
                </button>
              </div>
              <p className="font-mono text-[10px] text-zinc-500">
                Dica: Digite seu próprio telefone para testar o envio sem afetar clientes.
              </p>
            </form>

            {waFeedback && (
              <p className={`mt-3 p-2 font-mono text-xs font-bold border ${waFeedback.ok ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'}`}>
                {waFeedback.message}
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-zinc-200 pt-3 text-xs text-zinc-700 font-mono">
            <span className="font-bold text-zinc-950">Instância Ativa:</span> cyber-loja · Servidor Próprio VPS
          </div>
        </div>

        {/* SEÇÃO 5: DADOS DA LOJA & PONTO DE ATENDIMENTO */}
        <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs md:col-span-2">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
            <span>🏢</span> Dados da Loja & Identificação Balcão
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3 font-mono text-xs text-zinc-800">
            <div className="border border-zinc-200 bg-zinc-50 p-3">
              <span className="block font-bold uppercase text-[10px] text-zinc-500">Razão Social / Nome Fantasia</span>
              <span className="mt-1 block font-bold text-zinc-950 text-sm">CYBER INFORMÁTICA</span>
              <span className="text-[11px] text-zinc-600">Loja & Assistência Técnica Especializada</span>
            </div>
            <div className="border border-zinc-200 bg-zinc-50 p-3">
              <span className="block font-bold uppercase text-[10px] text-zinc-500">Endereço Balcão</span>
              <span className="mt-1 block font-bold text-zinc-950">Rua Cel. Teófilo Leme, 967</span>
              <span className="text-[11px] text-zinc-600">Centro · Bragança Paulista - SP</span>
            </div>
            <div className="border border-zinc-200 bg-zinc-50 p-3">
              <span className="block font-bold uppercase text-[10px] text-zinc-500">Portal Online do Cliente</span>
              <span className="mt-1 block font-bold text-zinc-950">cyberinformatica.tech</span>
              <span className="text-[11px] text-zinc-600">Rastreamento de OS em tempo real</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE PRÉVIA DA ETIQUETA KNUP */}
      {showLabelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md border-2 border-zinc-950 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-3">
              <h3 className="font-mono text-sm font-black uppercase tracking-wider text-zinc-950">
                Prévia Física: Knup KP-IM608 (40x60mm)
              </h3>
              <button
                type="button"
                onClick={() => setShowLabelModal(false)}
                className="font-mono text-sm font-bold text-zinc-500 hover:text-zinc-950 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-6 flex justify-center">
              {/* Representação visual proporcional da etiqueta 40x60mm */}
              <div
                style={{
                  width: '38mm',
                  minHeight: '55mm',
                  maxHeight: '55mm',
                  padding: '2.5mm 1mm',
                }}
                className="border-2 border-dashed border-zinc-950 bg-white text-black font-mono flex flex-col justify-between overflow-hidden shadow-md"
              >
                {/* Cabeçalho */}
                <div className="border-b border-black pb-1 flex items-baseline justify-between">
                  <span className="font-black text-[12px] tracking-tight leading-none">OS-2026-TESTE</span>
                  <span className="font-bold text-[8.5px] leading-none text-zinc-800">
                    {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Cliente */}
                <div className="pt-1 leading-tight">
                  <p className="font-bold text-[9px] uppercase leading-none truncate">CLIENTE TESTE LOJA</p>
                  <p className="text-[8px] leading-none mt-0.5 text-zinc-700">(11) 99999-9999</p>
                </div>

                {/* Aparelho */}
                <div className="pt-1 leading-tight">
                  <p className="text-[8px] font-bold text-zinc-600 uppercase leading-none">APARELHO:</p>
                  <p className="font-black text-[9.5px] leading-snug line-clamp-2">Notebook Dell Inspiron 15</p>
                </div>

                {/* Sintoma */}
                <div className="pt-0.5 leading-tight">
                  <p className="text-[7.5px] font-bold text-zinc-600 uppercase leading-none">SINTOMA:</p>
                  <p className="text-[8px] font-medium leading-tight line-clamp-2">Calibração de etiqueta Knup</p>
                </div>

                {/* QR Code */}
                <div className="pt-1 flex flex-col items-center justify-center">
                  <div
                    style={{ width: '22mm', height: '22mm' }}
                    className="flex items-center justify-center overflow-hidden"
                  >
                    <QRCodeImage
                      value="https://cyberinformatica.tech/status?os=TESTE"
                      size={180}
                      alt="QR Code Teste"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[7.5px] font-black tracking-widest mt-0.5 text-center leading-none">
                    #TESTE · RASTREIO
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLabelModal(false)}
                className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              >
                Fechar
              </button>
              <Link
                href="/admin/configuracoes/etiqueta-teste"
                className="flex-1 border-2 border-zinc-950 bg-zinc-950 px-3 py-2 text-center font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
              >
                🖨️ Imprimir na Knup
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserPermissionCard({
  profile,
  isCurrentUser,
  canEdit,
  onSave,
}: {
  profile: ProfileRecord;
  isCurrentUser: boolean;
  canEdit: boolean;
  onSave: (
    targetUserId: string,
    updates: {
      role: 'owner' | 'technician';
      canDelete: boolean;
      active: boolean;
      commissionRate: number;
    },
  ) => Promise<{ ok: boolean; message: string }>;
}) {
  const [role, setRole] = useState<'owner' | 'technician'>(profile.role);
  const [canDelete, setCanDelete] = useState<boolean>(profile.can_delete);
  const [active, setActive] = useState<boolean>(profile.active ?? true);
  const [commissionRate, setCommissionRate] = useState<string>(
    profile.commission_rate !== null && profile.commission_rate !== undefined
      ? String(profile.commission_rate)
      : '0',
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const isOwnerRole = role === 'owner';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || saving) return;

    setSaving(true);
    setFeedback(null);
    const parsedCommission = parseFloat(commissionRate.replace(',', '.')) || 0;
    const res = await onSave(profile.id, {
      role,
      canDelete,
      active,
      commissionRate: parsedCommission,
    });
    setSaving(false);
    setFeedback(res);
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`border-2 p-4 transition space-y-3 ${
        isCurrentUser ? 'border-zinc-950 bg-zinc-50/70 shadow-xs' : 'border-zinc-300 bg-white'
      } ${!active ? 'opacity-70 bg-zinc-100' : ''}`}
    >
      {/* Topo do Usuário */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-200 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isOwnerRole ? '👑' : '🛠️'}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <strong className="font-mono text-sm uppercase text-zinc-950">
                {profile.full_name || 'Sem Nome'}
              </strong>
              {isCurrentUser && (
                <span className="bg-zinc-950 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 uppercase">
                  Você
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] text-zinc-500 block truncate max-w-[200px]">
              {profile.email}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {canEdit ? (
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 border cursor-pointer transition ${
                active
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-red-600 bg-red-50 text-red-800'
              }`}
              title="Clique para ativar/desativar conta"
            >
              {active ? '● Ativo' : '○ Inativo'}
            </button>
          ) : (
            <span
              className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 border ${
                active
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-red-600 bg-red-50 text-red-800'
              }`}
            >
              {active ? '● Ativo' : '○ Inativo'}
            </span>
          )}
        </div>
      </div>

      {/* Controles de Permissão */}
      <div className="space-y-2.5 font-mono text-xs">
        {/* Papel no Sistema */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
            Papel / Nível de Acesso:
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'owner' | 'technician')}
            disabled={!canEdit}
            className="w-full border-2 border-zinc-950 bg-white px-2.5 py-1 text-xs font-bold text-zinc-950 disabled:bg-zinc-100 disabled:border-zinc-300"
          >
            <option value="owner">👑 Dono / Administrador (Acesso Total)</option>
            <option value="technician">🛠️ Técnico Bancada (Ordens de Serviço)</option>
          </select>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            {role === 'owner'
              ? '✓ Acesso a Configurações, Financeiro, Relatórios e Permissões.'
              : '✓ Acesso focado em OS, Balcão, Peças e Execução de Serviços.'}
          </span>
        </div>

        {/* Permissão de Exclusão (can_delete) */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
            Permissão para Excluir Dados (can_delete):
          </label>
          {canEdit ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCanDelete(true)}
                className={`py-1.5 px-2 font-mono text-xs font-bold uppercase border cursor-pointer transition ${
                  canDelete
                    ? 'border-emerald-700 bg-emerald-600 text-white shadow-xs'
                    : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                ✅ Liberado
              </button>
              <button
                type="button"
                onClick={() => setCanDelete(false)}
                className={`py-1.5 px-2 font-mono text-xs font-bold uppercase border cursor-pointer transition ${
                  !canDelete
                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                    : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                🚫 Bloqueado
              </button>
            </div>
          ) : (
            <div
              className={`p-1.5 text-xs font-bold uppercase border text-center ${
                canDelete
                  ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-700'
              }`}
            >
              {canDelete ? '✅ Pode Excluir (Liberado)' : '🚫 Exclusão Bloqueada'}
            </div>
          )}
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            {canDelete
              ? '⚠️ Usuário pode apagar OSs, excluir clientes e remover itens de estoque.'
              : '🔒 Botões de apagar OSs, estoque e clientes ficam ocultos.'}
          </span>
        </div>

        {/* Taxa de Comissão */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
            Taxa de Comissão (%):
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="decimal"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              disabled={!canEdit}
              placeholder="Ex: 30 ou 0.5"
              className="w-24 border border-zinc-400 bg-white px-2 py-1 text-xs font-bold text-zinc-950 disabled:bg-zinc-100"
            />
            <span className="font-bold text-zinc-700 text-xs">%</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Percentual pago sobre os serviços concluídos na sexta-feira.
          </span>
        </div>
      </div>

      {/* Feedback e Botão Salvar */}
      {feedback && (
        <div
          className={`p-2 font-mono text-xs font-bold border ${
            feedback.ok
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {canEdit && (
        <div className="pt-2 border-t border-zinc-200">
          <button
            type="submit"
            disabled={saving}
            className="w-full border-2 border-zinc-950 bg-zinc-950 py-1.5 px-3 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? 'Gravando Alterações…' : `💾 Salvar Permissões de ${profile.full_name || 'Usuário'}`}
          </button>
        </div>
      )}
    </form>
  );
}
