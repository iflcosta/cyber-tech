'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export type InitialERPLead = {
  id: string | null;
  name: string;
  phone: string;
  email: string | null;
  osCount: number;
  salesCount: number;
  origin: 'erp_customer' | 'erp_sale' | 'site_b2b' | 'site_lead';
};

type UnifiedLead = {
  phoneE164: string;
  phoneFormatted: string;
  name: string;
  email: string | null;
  segment: 'b2b' | 'b2c';
  inErp: boolean;
  erpCustomerId: string | null;
  osCount: number;
  salesCount: number;
  fromWhatsApp: boolean;
  lastInteraction: string;
};

const B2B_REGEX =
  /\b(ltda|me\b|eireli|s\/a|comercio|comércio|servicos|serviços|loja|assistencia|assistência|informatica|informática|tech|cell|celulares|escritorio|escritório|clinica|clínica|advocacia|contabilidade|engenharia|consultoria|mercado|auto|oficina|studio|estúdio|escola|colegio|colégio|imobiliaria|imobiliária|farmacia|farmácia|ótica|otica|padaria|restaurante|hotel|pousada|transportes|logistica|logística|odontologia|dentista|médico|medico|arquitetura|construtora)\b/i;

const WHATSAPP_CONSOLE_SCRIPT = `(async function extractCyberWhatsAppLeads(){
  console.log('%c[Cyber Leads] Extraindo contatos do WhatsApp Web...','color:#000;background:#22c55e;font-weight:bold;padding:4px 8px;');
  const map = new Map();
  const clean = (r) => { if(!r) return ''; const d = String(r).split('@')[0].replace(/\\D/g,''); return (d.length>=10 && d.length<=15) ? d : ''; };
  const fmt = (d) => { const l = d.startsWith('55')&&d.length>=12 ? d.slice(2) : d; return l.length===11 ? '('+l.slice(0,2)+') '+l.slice(2,7)+'-'+l.slice(7) : l.length===10 ? '('+l.slice(0,2)+') '+l.slice(2,6)+'-'+l.slice(6) : '+'+d; };
  const isB2B = (n) => /\\b(ltda|me\\b|eireli|comercio|comércio|servicos|serviços|loja|assistencia|assistência|informatica|informática|tech|cell|escritorio|escritório|clinica|clínica|advocacia|contabilidade|engenharia|consultoria|mercado|oficina|escola|imobiliaria|imobiliária)\\b/i.test(n||'');
  const upsert = (raw, info) => {
    const p = clean(raw); if(!p) return;
    const ex = map.get(p) || { phone: p, phoneFormatted: fmt(p), savedName: '', pushName: '', verifiedName: '', isBusiness: false, hasChatHistory: false, lastMessageTs: 0 };
    if(info.savedName && (!ex.savedName || info.savedName.length > ex.savedName.length)) ex.savedName = info.savedName.trim();
    if(info.pushName && (!ex.pushName || info.pushName.length > ex.pushName.length)) ex.pushName = info.pushName.trim();
    if(info.verifiedName) ex.verifiedName = info.verifiedName.trim();
    if(info.isBusiness) ex.isBusiness = true;
    if(info.hasChatHistory) ex.hasChatHistory = true;
    if(info.lastMessageTs && info.lastMessageTs > ex.lastMessageTs) ex.lastMessageTs = info.lastMessageTs;
    map.set(p, ex);
  };
  const readStore = (db, name) => new Promise((res) => {
    if(!db.objectStoreNames.contains(name)) return res([]);
    try { const req = db.transaction(name,'readonly').objectStore(name).getAll(); req.onsuccess = () => res(req.result||[]); req.onerror = () => res([]); } catch { res([]); }
  });
  try {
    const db = await new Promise((res,rej) => { const r = indexedDB.open('model-storage'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const [contacts, chats, lids] = await Promise.all([readStore(db,'contact'), readStore(db,'chat'), readStore(db,'lid-mapping')]);
    const lidMap = new Map();
    for(const m of lids) { const l = m.lid||m.id; const pn = m.pn||m.phoneNumber||m.user; if(l&&pn) lidMap.set(String(l).split('@')[0], clean(pn)); }
    for(const c of contacts) { const id = String(c.id||''); if(c.phoneNumber && id.includes('@lid')) lidMap.set(id.split('@')[0], clean(c.phoneNumber)); }
    for(const c of contacts) {
      const id = String(c.id||''); if(id.endsWith('@g.us')||id.includes('status@broadcast')||id.endsWith('@newsletter')) continue;
      let pn = c.phoneNumber || id; if(id.endsWith('@lid')) { pn = lidMap.get(id.split('@')[0]); if(!pn) continue; }
      upsert(pn, { savedName: c.name||c.shortName||'', pushName: c.pushname||c.notifyName||'', verifiedName: c.verifiedName||'', isBusiness: Boolean(c.isBusiness||c.isEnterprise||c.verifiedName) });
    }
    for(const ch of chats) {
      const id = String(ch.id||''); if(id.endsWith('@g.us')||id.includes('status@broadcast')||id.endsWith('@newsletter')) continue;
      let pn = ch.phoneNumber || id; if(id.endsWith('@lid')) { pn = lidMap.get(id.split('@')[0]); if(!pn) continue; }
      upsert(pn, { savedName: ch.name||ch.formattedTitle||'', hasChatHistory: true, lastMessageTs: Number(ch.t||ch.timestamp||0) });
    }
    db.close();
  } catch(e) { console.warn('Aviso IndexedDB:', e); }
  const out = Array.from(map.values()).map((i) => {
    const name = i.savedName || i.verifiedName || i.pushName || ('Contato WhatsApp ' + i.phoneFormatted);
    const b2b = i.isBusiness || isB2B(name) || isB2B(i.verifiedName);
    return { name, phone: i.phone.startsWith('55')?i.phone:'55'+i.phone, phoneFormatted: i.phoneFormatted, segment: b2b?'Empresa / B2B':'Cliente / Residencial', hasChatHistory: i.hasChatHistory?'Sim':'Não', lastInteraction: i.lastMessageTs>0 ? new Date(i.lastMessageTs*1000).toISOString().slice(0,10) : '' };
  });
  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leads-whatsapp-cyber.json'; document.body.appendChild(a); a.click(); a.remove();
  console.log('%c[Cyber Leads] ' + out.length + ' contatos extraídos! Arquivo leads-whatsapp-cyber.json baixado.', 'color:#fff;background:#16a34a;font-weight:bold;padding:4px 8px;');
})();`;

const MESSAGE_TEMPLATES = {
  b2b: `Olá, {primeiro_nome}! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Estamos estruturando uma frente dedicada de *Suporte Técnico em TI para Empresas e Escritórios* aqui na região — com atendimento rápido (remoto e presencial), manutenção preventiva de computadores/redes e prioridade na bancada para não deixar sua operação parar.

Como já temos seu contato aqui na loja, queria entender: hoje vocês já têm alguém cuidando da TI aí ou faz sentido eu te mandar como funciona o nosso plano de atendimento?`,

  home_office: `Olá, {primeiro_nome}! Tudo bem? Aqui é da *Cyber Informática*.

Passando para contar uma novidade: agora estamos oferecendo *Suporte em TI (Remoto e Presencial)* sob demanda e acompanhamento preventivo para quem trabalha em Home Office ou depende do computador/notebook 100% do tempo.

Se precisar de configuração de rede, lentidão, backup seguro ou suporte rápido sem precisar sair de casa, pode contar direto com nosso time técnico! Quer que eu te explique rapidinho como funciona?`,

  reativacao: `Olá, {primeiro_nome}! Tudo bem? Aqui é da *Cyber Informática*.

Vimos que você já falou com a gente aqui na loja e estamos entrando em contato para apresentar nosso novo serviço de *Suporte Completo em TI* (atendimento rápido para computadores, notebooks, redes Wi-Fi, backup e consultoria técnica para empresas e residências).

Se tiver algum equipamento precisando de revisão ou quiser conhecer nossos pacotes de suporte, me dá um alô por aqui!`,
};

function normalizePhoneBR(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).split('@')[0].replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  if (digits.length < 12 || digits.length > 15) return null;
  return digits;
}

function formatPhoneBR(digits: string): string {
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return `+${digits}`;
}

export function WhatsAppLeadsClient({
  initialLeads,
  currentUserId,
}: {
  initialLeads: InitialERPLead[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [copiedScript, setCopiedScript] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [importedLeads, setImportedLeads] = useState<
    { name: string; phone: string; segment?: string; lastInteraction?: string }[]
  >([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [savingToDb, setSavingToDb] = useState(false);

  const [filterSegment, setFilterSegment] = useState<'all' | 'b2b' | 'erp' | 'whatsapp_new' | 'uncontacted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [templateKey, setTemplateKey] = useState<'b2b' | 'home_office' | 'reativacao'>('b2b');
  const [customMessage, setCustomMessage] = useState(MESSAGE_TEMPLATES.b2b);
  const [contactedPhones, setContactedPhones] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cyber_ti_contacted_phones');
      if (saved) setContactedPhones(JSON.parse(saved));
      const savedImported = localStorage.getItem('cyber_ti_imported_whatsapp_leads');
      if (savedImported) setImportedLeads(JSON.parse(savedImported));
    } catch {
      // ignore storage errors
    }
  }, []);

  function markContacted(phoneE164: string) {
    setContactedPhones((prev) => {
      const next = { ...prev, [phoneE164]: !prev[phoneE164] };
      try {
        localStorage.setItem('cyber_ti_contacted_phones', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function selectTemplate(key: 'b2b' | 'home_office' | 'reativacao') {
    setTemplateKey(key);
    setCustomMessage(MESSAGE_TEMPLATES[key]);
  }

  function copyExtractorScript() {
    navigator.clipboard.writeText(WHATSAPP_CONSOLE_SCRIPT).then(() => {
      setCopiedScript(true);
      setShowInstructions(true);
      setTimeout(() => setCopiedScript(false), 3000);
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const parsedList: { name: string; phone: string; segment?: string; lastInteraction?: string }[] = [];

    for (const file of Array.from(files)) {
      const text = await file.text();
      const ext = file.name.toLowerCase();

      if (ext.endsWith('.json')) {
        try {
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) {
            for (const item of arr) {
              parsedList.push({
                name: String(item.name || item.Nome || item.savedName || item.pushName || '').trim(),
                phone: String(item.phone || item.Telefone_E164 || item.phoneFormatted || ''),
                segment: item.segment,
                lastInteraction: item.lastInteraction || '',
              });
            }
          }
        } catch {
          // ignore malformed JSON
        }
      } else if (ext.endsWith('.vcf')) {
        const cards = text.split(/BEGIN:VCARD/i).slice(1);
        for (const card of cards) {
          const fnMatch = card.match(/^FN(?:;[^:]*)?:(.+)$/im);
          const nMatch = card.match(/^N(?:;[^:]*)?:([^;]+);([^;]*)/im);
          const name = (fnMatch?.[1] || [nMatch?.[2], nMatch?.[1]].filter(Boolean).join(' ') || '').trim();
          const telMatches = [...card.matchAll(/^TEL(?:;[^:]*)?:(.+)$/gim)];
          for (const tm of telMatches) {
            parsedList.push({ name, phone: tm[1].trim() });
          }
        }
      } else {
        // CSV
        const lines = text
          .replace(/^\uFEFF/, '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length >= 2) {
          const sep = lines[0].includes(';') ? ';' : ',';
          const splitRow = (row: string) =>
            row.split(sep).map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
          const headers = splitRow(lines[0]).map((h) => h.toLowerCase());
          const nameIdx = headers.findIndex((h) =>
            ['nome', 'name', 'first name', 'given name', 'cliente'].some((k) => h.includes(k)),
          );
          const phoneIdx = headers.findIndex((h) =>
            ['telefone', 'phone', 'celular', 'whatsapp', 'mobile', 'tel'].some((k) => h.includes(k)),
          );
          for (let i = 1; i < lines.length; i++) {
            const cols = splitRow(lines[i]);
            const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
            const phone = phoneIdx >= 0 ? cols[phoneIdx] : cols[1];
            if (phone) parsedList.push({ name: name || '', phone });
          }
        }
      }
    }

    setImportedLeads((prev) => {
      const merged = [...prev, ...parsedList];
      try {
        localStorage.setItem('cyber_ti_imported_whatsapp_leads', JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    });
    setImportStatus(`✅ ${parsedList.length} registros lidos do arquivo e mesclados sem duplicidade!`);
    e.target.value = '';
  }

  const unifiedLeads = useMemo(() => {
    const map = new Map<string, UnifiedLead>();

    for (const item of initialLeads) {
      const phoneE164 = normalizePhoneBR(item.phone);
      if (!phoneE164) continue;
      const isB2B = item.origin === 'site_b2b' || B2B_REGEX.test(item.name);
      const existing = map.get(phoneE164);
      if (!existing) {
        map.set(phoneE164, {
          phoneE164,
          phoneFormatted: formatPhoneBR(phoneE164),
          name: item.name,
          email: item.email,
          segment: isB2B ? 'b2b' : 'b2c',
          inErp: Boolean(item.id),
          erpCustomerId: item.id,
          osCount: item.osCount,
          salesCount: item.salesCount,
          fromWhatsApp: false,
          lastInteraction: '',
        });
      } else {
        existing.osCount += item.osCount;
        existing.salesCount += item.salesCount;
        if (item.id && !existing.erpCustomerId) {
          existing.erpCustomerId = item.id;
          existing.inErp = true;
        }
        if (isB2B) existing.segment = 'b2b';
      }
    }

    for (const w of importedLeads) {
      const phoneE164 = normalizePhoneBR(w.phone);
      if (!phoneE164) continue;
      const isB2B = w.segment === 'Empresa / B2B' || B2B_REGEX.test(w.name);
      const existing = map.get(phoneE164);
      if (!existing) {
        map.set(phoneE164, {
          phoneE164,
          phoneFormatted: formatPhoneBR(phoneE164),
          name: w.name || `Contato WhatsApp ${formatPhoneBR(phoneE164)}`,
          email: null,
          segment: isB2B ? 'b2b' : 'b2c',
          inErp: false,
          erpCustomerId: null,
          osCount: 0,
          salesCount: 0,
          fromWhatsApp: true,
          lastInteraction: w.lastInteraction || '',
        });
      } else {
        existing.fromWhatsApp = true;
        if (
          w.name &&
          !w.name.startsWith('Contato WhatsApp') &&
          (existing.name === 'Cliente PDV' || w.name.length > existing.name.length)
        ) {
          existing.name = w.name;
        }
        if (isB2B) existing.segment = 'b2b';
        if (w.lastInteraction && w.lastInteraction > existing.lastInteraction) {
          existing.lastInteraction = w.lastInteraction;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.segment !== b.segment) return a.segment === 'b2b' ? -1 : 1;
      if (a.osCount + a.salesCount !== b.osCount + b.salesCount) {
        return b.osCount + b.salesCount - (a.osCount + a.salesCount);
      }
      return a.name.localeCompare(b.name);
    });
  }, [initialLeads, importedLeads]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unifiedLeads.filter((l) => {
      if (filterSegment === 'b2b' && l.segment !== 'b2b') return false;
      if (filterSegment === 'erp' && !l.inErp) return false;
      if (filterSegment === 'whatsapp_new' && l.inErp) return false;
      if (filterSegment === 'uncontacted' && contactedPhones[l.phoneE164]) return false;
      if (q) {
        return (
          l.name.toLowerCase().includes(q) ||
          l.phoneE164.includes(q) ||
          l.phoneFormatted.includes(q)
        );
      }
      return true;
    });
  }, [unifiedLeads, filterSegment, searchQuery, contactedPhones]);

  const stats = useMemo(() => {
    const total = unifiedLeads.length;
    const b2b = unifiedLeads.filter((l) => l.segment === 'b2b').length;
    const inErp = unifiedLeads.filter((l) => l.inErp).length;
    const newFromWa = unifiedLeads.filter((l) => !l.inErp).length;
    const contacted = unifiedLeads.filter((l) => contactedPhones[l.phoneE164]).length;
    return { total, b2b, inErp, newFromWa, contacted };
  }, [unifiedLeads, contactedPhones]);

  function buildWhatsAppUrl(lead: UnifiedLead): string {
    const firstName = lead.name.split(/\s+/)[0] || 'tudo bem';
    const text = customMessage
      .replace(/\{primeiro_nome\}/gi, firstName)
      .replace(/\{nome\}/gi, lead.name);
    return `https://wa.me/${lead.phoneE164}?text=${encodeURIComponent(text)}`;
  }

  function exportFilteredCSV() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      'Nome;Telefone_E164;Telefone_Formatado;Segmento;Ja_Cliente_ERP;Qtd_OS;Qtd_Compras;Ultima_Interacao;Contatado',
      ...filteredLeads.map((l) =>
        [
          esc(l.name),
          esc(l.phoneE164),
          esc(l.phoneFormatted),
          esc(l.segment === 'b2b' ? 'Empresa / B2B' : 'Cliente / Residencial'),
          esc(l.inErp ? 'Sim' : 'Não'),
          esc(l.osCount),
          esc(l.salesCount),
          esc(l.lastInteraction),
          esc(contactedPhones[l.phoneE164] ? 'Sim' : 'Não'),
        ].join(';'),
      ),
    ];
    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads-suporte-ti-cyber-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function saveNewWhatsAppLeadsToERP() {
    const newLeads = unifiedLeads.filter((l) => !l.inErp);
    if (newLeads.length === 0) return;

    setSavingToDb(true);
    setImportStatus(null);
    try {
      const supabase = createCRMBrowserClient();
      const payload = newLeads.map((l) => ({
        name: l.name,
        phone: l.phoneFormatted,
        email: l.email,
        notes: 'Importado via extração do WhatsApp da loja (Campanha Suporte em TI)',
        created_by: currentUserId,
      }));

      // Insere em lotes de 200
      let inserted = 0;
      for (let i = 0; i < payload.length; i += 200) {
        const batch = payload.slice(i, i + 200);
        const { error } = await supabase.from('customers').insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }

      setImportStatus(`✅ ${inserted} novos contatos salvos com sucesso na tabela de Clientes do ERP!`);
      router.refresh();
    } catch (e) {
      setImportStatus(`❌ Erro ao salvar no banco: ${(e as Error).message}`);
    } finally {
      setSavingToDb(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-3.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total de Leads</p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Empresas / B2B</p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.b2b}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Já no ERP</p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.inErp}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Novos (WhatsApp)</p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.newFromWa}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3.5 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Já Contatados</p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">
            {stats.contacted} <span className="text-sm font-normal text-zinc-400">/ {stats.total}</span>
          </p>
        </div>
      </div>

      {/* Passo 1 & Passo 2: Extrair do WhatsApp Web + Importar arquivo */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Passo 1
              </span>
              <h2 className="mt-1.5 text-base font-bold text-zinc-950">
                Extrair todos os contatos do WhatsApp Web da loja
              </h2>
              <p className="mt-0.5 text-xs text-zinc-600">
                Extrai tanto contatos salvos quanto números não salvos que já conversaram com a loja.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={copyExtractorScript}
              className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              {copiedScript ? '✓ Script copiado para a área de transferência!' : '📋 Copiar Script do WhatsApp Web'}
            </button>
            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {showInstructions ? 'Ocultar passo a passo' : 'Como usar (30 segundos)'}
            </button>
          </div>

          {showInstructions && (
            <ol className="mt-2 list-decimal space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-3 pl-7 text-xs text-zinc-800">
              <li>
                Abra <strong>web.whatsapp.com</strong> no navegador conectado no WhatsApp da loja.
              </li>
              <li>
                Aperte <kbd className="rounded border border-zinc-300 bg-white px-1 font-mono">F12</kbd> (ou{' '}
                <kbd className="rounded border border-zinc-300 bg-white px-1 font-mono">Ctrl+Shift+I</kbd>) e clique na
                aba <strong>Console</strong>.
              </li>
              <li>
                Se o navegador pedir permissão na primeira vez, digite{' '}
                <code className="rounded bg-zinc-200 px-1 font-mono">allow pasting</code> e dê Enter.
              </li>
              <li>
                Cole (<kbd className="rounded border border-zinc-300 bg-white px-1 font-mono">Ctrl+V</kbd>) o script
                copiado acima e aperte <strong>Enter</strong>.
              </li>
              <li>
                O arquivo <code className="font-mono">leads-whatsapp-cyber.json</code> será baixado automaticamente.
                Depois, basta soltá-lo no <strong>Passo 2</strong> ao lado!
              </li>
            </ol>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 space-y-3">
          <div>
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Passo 2
            </span>
            <h2 className="mt-1.5 text-base font-bold text-zinc-950">
              Importar contatos extraídos (.json, .csv ou .vcf da agenda)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Cruza automaticamente com os clientes do ERP, remove duplicados e identifica empresas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="cursor-pointer rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:border-black hover:bg-zinc-100 transition">
              📂 Selecionar arquivo (.json, .csv, .vcf)
              <input
                type="file"
                accept=".json,.csv,.vcf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {stats.newFromWa > 0 && (
              <button
                type="button"
                onClick={saveNewWhatsAppLeadsToERP}
                disabled={savingToDb}
                className="rounded-md bg-black px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {savingToDb
                  ? 'Salvando no ERP…'
                  : `💾 Salvar ${stats.newFromWa} novos contatos no ERP`}
              </button>
            )}
          </div>

          {importStatus && (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs font-medium text-zinc-900">
              {importStatus}
            </p>
          )}
        </section>
      </div>

      {/* Passo 3: Mensagem da Campanha de Suporte em TI */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Passo 3
            </span>
            <h2 className="mt-1.5 text-base font-bold text-zinc-950">
              Mensagem de Oferta — Novo Serviço de Suporte em TI
            </h2>
            <p className="text-xs text-zinc-500">
              Use <code className="font-mono text-zinc-800">{'{primeiro_nome}'}</code> ou{' '}
              <code className="font-mono text-zinc-800">{'{nome}'}</code> para personalizar automaticamente cada disparo.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => selectTemplate('b2b')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                templateKey === 'b2b'
                  ? 'bg-black text-white'
                  : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              🏢 Template Empresas (B2B)
            </button>
            <button
              type="button"
              onClick={() => selectTemplate('home_office')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                templateKey === 'home_office'
                  ? 'bg-black text-white'
                  : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              💻 Template Home Office / Autônomos
            </button>
            <button
              type="button"
              onClick={() => selectTemplate('reativacao')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                templateKey === 'reativacao'
                  ? 'bg-black text-white'
                  : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              🔄 Template Geral Clientes da Loja
            </button>
          </div>
        </div>

        <textarea
          rows={5}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </section>

      {/* Lista Unificada + Filtros + Exportação */}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: `Todos (${unifiedLeads.length})` },
                { id: 'b2b', label: `Empresas / B2B (${stats.b2b})` },
                { id: 'erp', label: `Clientes ERP (${stats.inErp})` },
                { id: 'whatsapp_new', label: `Novos do WhatsApp (${stats.newFromWa})` },
                { id: 'uncontacted', label: `Não contatados (${stats.total - stats.contacted})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterSegment(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  filterSegment === tab.id
                    ? 'bg-black text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nome ou telefone…"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="button"
              onClick={exportFilteredCSV}
              className="rounded-md border border-zinc-900 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              📥 Exportar Planilha (.CSV)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Nome / Contato</th>
                <th className="px-3 py-2 font-medium">WhatsApp</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Perfil</th>
                <th className="hidden px-3 py-2 text-center font-medium md:table-cell">Histórico ERP</th>
                <th className="px-3 py-2 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredLeads.slice(0, 300).map((lead) => {
                const isDone = Boolean(contactedPhones[lead.phoneE164]);
                return (
                  <tr key={lead.phoneE164} className={isDone ? 'bg-zinc-50/70 opacity-60' : 'hover:bg-zinc-50'}>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => markContacted(lead.phoneE164)}
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          isDone
                            ? 'bg-zinc-900 text-white'
                            : 'border border-zinc-300 bg-white text-zinc-600 hover:border-black'
                        }`}
                      >
                        {isDone ? '✓ Contatado' : 'Pendente'}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-900">
                      {lead.name}
                      {!lead.inErp && (
                        <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-800">
                          Novo (WhatsApp)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-700">{lead.phoneFormatted}</td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          lead.segment === 'b2b'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {lead.segment === 'b2b' ? '🏢 Empresa / B2B' : '👤 Cliente / Residencial'}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2 text-center font-mono text-xs text-zinc-600 md:table-cell">
                      {lead.osCount > 0 || lead.salesCount > 0
                        ? `${lead.osCount} OS · ${lead.salesCount} Vendas`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <a
                        href={buildWhatsAppUrl(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (!contactedPhones[lead.phoneE164]) {
                            markContacted(lead.phoneE164);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                      >
                        📲 Abordar no WhatsApp →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLeads.length > 300 && (
            <p className="mt-3 text-center text-xs text-zinc-500">
              Exibindo os primeiros 300 de {filteredLeads.length} contatos na tela. Use o botão{' '}
              <strong>📥 Exportar Planilha (.CSV)</strong> para baixar todos os {filteredLeads.length} contatos.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
