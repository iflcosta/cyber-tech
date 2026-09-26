'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export type LeadStatus =
  | 'novo'
  | 'contatado'
  | 'respondeu'
  | 'proposta'
  | 'fechado'
  | 'sem_interesse';

export type LeadNiche =
  | 'saude_clinicas'
  | 'escritorios_servicos'
  | 'agencias_graficas_tech'
  | 'comercio_gastronomia'
  | 'auto_construcao_industria'
  | 'educacao_beleza_hotelaria'
  | 'residencial_pf';

export type PreloadedWhatsAppLead = {
  name: string;
  phone: string;
  segment?: string;
  niche?: LeadNiche | string;
  status?: LeadStatus;
  notes?: string | null;
  lastContactedAt?: string | null;
  isHotLead?: boolean;
  hasDirectChat?: boolean;
  isAddressBook?: boolean;
  msgsSent?: number;
  msgsReceived?: number;
  lastChatDate?: string | null;
};

type UnifiedLead = {
  phoneE164: string;
  phoneFormatted: string;
  ddd: string;
  isRegional: boolean;
  name: string;
  email: string | null;
  segment: 'b2b' | 'b2c';
  niche: LeadNiche;
  inErp: boolean;
  erpCustomerId: string | null;
  osCount: number;
  salesCount: number;
  fromWhatsApp: boolean;
  isHotLead: boolean;
  hasDirectChat: boolean;
  isAddressBook: boolean;
  msgsSent: number;
  msgsReceived: number;
  totalMessages: number;
  lastChatDate: string | null;
  status: LeadStatus;
  notes: string;
  lastContactedAt: string | null;
};

export const NICHE_META: Record<
  LeadNiche,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  saude_clinicas: {
    label: 'Saúde, Clínicas & Consultórios',
    shortLabel: 'Saúde & Clínicas',
    badgeClass: 'bg-zinc-900 text-white border-zinc-900',
  },
  escritorios_servicos: {
    label: 'Escritórios, Jurídico, Imobiliárias & Gestão',
    shortLabel: 'Escritórios & Imobiliárias',
    badgeClass: 'bg-zinc-800 text-white border-zinc-800',
  },
  agencias_graficas_tech: {
    label: 'Agências, Mídia, Gráficas & Tecnologia',
    shortLabel: 'Agências, Gráficas & Tech',
    badgeClass: 'bg-zinc-800 text-white border-zinc-800',
  },
  comercio_gastronomia: {
    label: 'Comércio, Lojas & Gastronomia',
    shortLabel: 'Comércio & Gastronomia',
    badgeClass: 'bg-zinc-900 text-white border-zinc-900',
  },
  auto_construcao_industria: {
    label: 'Automotivo, Construção, Indústria & Logística',
    shortLabel: 'Auto, Construção & Indústria',
    badgeClass: 'bg-zinc-800 text-white border-zinc-800',
  },
  educacao_beleza_hotelaria: {
    label: 'Educação, Beleza, Fitness & Hotelaria',
    shortLabel: 'Escolas, Beleza & Hotéis',
    badgeClass: 'bg-zinc-800 text-white border-zinc-800',
  },
  residencial_pf: {
    label: 'Cliente / Home Office (PF)',
    shortLabel: 'Home Office / PF',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  },
};

export const STATUS_META: Record<
  LeadStatus,
  { label: string; badgeClass: string }
> = {
  novo: {
    label: 'Pendente',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  },
  contatado: {
    label: 'Mensagem Enviada',
    badgeClass: 'bg-zinc-200 text-zinc-900 border-zinc-400',
  },
  respondeu: {
    label: 'Respondeu',
    badgeClass: 'bg-zinc-800 text-white border-zinc-800',
  },
  proposta: {
    label: 'Proposta Enviada',
    badgeClass: 'bg-zinc-900 text-white border-zinc-900',
  },
  fechado: {
    label: 'Fechado (Cliente TI)',
    badgeClass: 'bg-black text-white border-black font-bold',
  },
  sem_interesse: {
    label: 'Sem Interesse',
    badgeClass: 'bg-white text-zinc-400 border-zinc-200 line-through',
  },
};

const FALSE_POSITIVE_B2B_REGEX =
  /\b(cliente loja|ednir loja|luis fernando loja|luiz cliente loja|marco pc loja|matheus loja|lu escola|marcia escola|rute escola|terezinha escola|vilma escola|aliciele escol)\b/i;

const NICHE_RULES: { niche: LeadNiche; regex: RegExp }[] = [
  {
    niche: 'saude_clinicas',
    regex:
      /\b(clinica|clínica|radioclinica|radioclínica|centro médico|centro medico|unimagem|crb imagem|laboratorio|laboratório|unilab|ambulatorio|ambulatório|hospital|husf|odontologia|odonto|dentista|médico|medico|dr\b|dr\.|dra\b|dra\.|doutor|doutora|pediatria|psicologa|psicóloga|psicologia|fisioterapia|fisioterapeuta|nutricionista|nutrição|enfermagem|enfer\b|veterinaria|veterinária|medicina felina|pet\b|petsim|drogaria|farmacia|farmácia|vita pharma|saúde ocupacional)\b/i,
  },
  {
    niche: 'escritorios_servicos',
    regex:
      /\b(advocacia|advogados|advogado|advogada|juridico|jurídico|jurídica|bureau juridico|cartorio|cartório|contabilidade|contador|contadora|escritorio|escritório|imobiliaria|imobiliária|imoveis|imóveis|imobmaxx|corretor|corretora|lotes|geoincorp|condominio|condomínio|condominiais|sindica|síndica|sindico|síndico|administradora|assessoria|consultoria|recursos humanos|adecco|departamento pessoal|adm pessoal|cia de talentos|financeiro|finanças|financeira|consórcio|consorcio|seguros|despachante|detetive)\b/i,
  },
  {
    niche: 'agencias_graficas_tech',
    regex:
      /\b(agência|agencia|ag\.\s*novo|agenzzia|marketing|v2bmkt|mídia|midia|digital|publicidade|lh content|gráfica|grafica|copiadora|print|editora|fotografia|fotografo|fotógrafo|foto acesso|web studio|studio pc3d|3d\b|design|designer|tecnologia|martech|systems|sistemas|isolution|marcomp|informatica|informática|tech|assistencia|assistência|conserta smart|cell|celulares|megacell|pointchip|telcabos|eletrônicos|eletronicos|eletrobidu)\b/i,
  },
  {
    niche: 'comercio_gastronomia',
    regex:
      /\b(comercio|comércio|comercial|loja|store|shop\b|papelaria|embalagens|brindes|bazar|moda\b|modas|fashion|jeans|alianças|joias|ótica|otica|oculos|óculos|perfumes|móveis|moveis|decorações|decoração|paisagismo|utilidades|pechincha|kids|mercado|supermercado|pizzaria|pizza|pizzas|esfiharia|hamburgueria|burger|burguer|churrascaria|espeto|restaurante|lanchonete|lanches|confeitaria|bolos|bolo\b|doces|doce\b|salgados|milk shake|cioccolato|beer|comida caseira|castanhas|queijaria|açaí|açai)\b/i,
  },
  {
    niche: 'auto_construcao_industria',
    regex:
      /\b(autoescola|auto escola|auto moto|auto center|direção certa|pneus|rodas|multimarcas|veículos|veiculos|motors|motos\b|moto elétrica|carros|caminhões|jet&car|oficina|mecanica|mecânica|engenheiro|engenharia|eng\b|construtora|construções|reformas|constru\b|arquitetura|arquiteto|vidros|vidro\b|vidraçaria|marcenaria|serralheria|ferramentas|wylie tools|módulos|containers|depósito|deposito|guaialajes|hidrofiber|energia solar|alesol|elétrica|eletric|manutenção|indústria|industria|maquinas|máquinas|distribuidora|transportes|transportadora|express|logistica|logística|logistics|delivery|ltda|eireli|prestadora de serviços|multiserviços|multiservice)\b/i,
  },
  {
    niche: 'educacao_beleza_hotelaria',
    regex:
      /\b(escola|school|colégio|colegio|emei\b|curso|reforço escolar|capacitação|educacional|academy|academia|fitness|dmfitness|forma fit|athlos fit|cross\b|personal\b|pousada|hotel|chalés|recanto|turismo|tour\b|excursões|festas|eventos|ceremonial|robô de led|estética|estetica|beauty|spa\b|bronzeamento|epilacão|laser\b|espaçolaser|laserficando|studio|estúdio|barber|barbershop|barbearia|salão|salao|cabelos|tranças|sobrancelhas|nails|nail\b|tattoo|ateliê|atelie)\b/i,
  },
];

function inferNiche(name: string, explicitNiche?: string): LeadNiche {
  if (
    explicitNiche &&
    explicitNiche in NICHE_META &&
    explicitNiche !== 'residencial_pf'
  ) {
    return explicitNiche as LeadNiche;
  }
  if (!name || FALSE_POSITIVE_B2B_REGEX.test(name)) {
    return 'residencial_pf';
  }
  for (const r of NICHE_RULES) {
    if (r.regex.test(name)) return r.niche;
  }
  return 'residencial_pf';
}

const MESSAGE_TEMPLATES: Record<string, { title: string; text: string }> = {
  avaliacao_google: {
    title: '⭐ Pedir Avaliação no Google (Pós-Venda Clientes Atendidos)',
    text: `Olá, *{primeiro_nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Muito obrigado por já ter confiado no nosso trabalho e atendimento aqui na loja! 🙏

Estamos reunindo a opinião dos nossos clientes no Google para ajudar mais pessoas de Bragança e região a conhecerem nosso laboratório. Você consegue tirar 30 segundinhos para deixar suas *5 estrelas* e contar rapidinho como foi sua experiência com a gente?

⭐ *Avaliar a Cyber Informática no Google:*
👉 https://www.google.com/maps/search/?api=1&query=Cyber+Inform%C3%A1tica+Rua+Coronel+Te%C3%B3filo+Leme+967+Bragan%C3%A7a+Paulista

Qualquer dúvida, revisão ou suporte que precisar para computador, notebook ou celular, pode contar sempre com a gente por aqui!`,
  },
  clientes_quentes_servicos: {
    title: '🔥 Oferecer Novos Serviços (Para Clientes Já Atendidos)',
    text: `Olá, *{primeiro_nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Como já atendemos você aqui na loja, estamos passando para compartilhar as novidades da nossa estrutura em 2 andares na Cel. Teófilo Leme, 967:

• *Suporte em TI Remoto e Presencial* (para empresas, escritórios e Home Office)
• *Upgrade de SSD NVMe / RAM e Limpeza Térmica* entregues no mesmo dia
• *Laboratório 2º Andar:* Reparo eletrônico de Placas de Vídeo (GPUs) e Troca só do Vidro de Celular mantendo sua tela original de fábrica

Se tiver algum computador, notebook ou aparelho precisando de revisão, upgrade ou suporte técnico, me chama aqui que damos prioridade total para você!
👉 https://www.cyberinformatica.tech`,
  },
  saude_clinicas: {
    title: '🏥 Saúde, Clínicas & Consultórios (Suporte TI)',
    text: `Olá, *{nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Sabemos que em clínica e consultório a recepção, o sistema de agenda/prontuário e as impressoras não podem travar no meio do atendimento aos pacientes.

Por isso, estruturamos uma frente dedicada de *Suporte em TI para Clínicas e Consultórios* aqui na região:
• *Suporte Remoto Imediato* (resolvemos travamentos, rede e impressoras em minutos)
• *Atendimento Presencial Rápido* e manutenção preventiva dos computadores
• *Prioridade na bancada* do nosso laboratório próprio

Hoje vocês já têm algum técnico ou empresa cuidando dos computadores aí, ou posso te mandar um resumo de como funciona nosso atendimento (avulso e mensal)?
👉 https://www.cyberinformatica.tech/suporte-ti`,
  },
  escritorios_servicos: {
    title: '⚖️ Escritórios, Jurídico, Imobiliárias & Condomínios',
    text: `Olá, *{nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Estamos apresentando para os escritórios e empresas parceiras da região o nosso novo serviço de *Suporte Técnico em TI Corporativo* — pensado para eliminar lentidão nos computadores, quedas de rede/Wi-Fi e riscos de perda de arquivos importantes.

Atendemos tanto por *Chamado Avulso* quanto por *Plano Mensal de Suporte (Remoto + Presencial)* com manutenção preventiva, configuração de backup e prioridade total de laboratório.

Faz sentido eu te enviar os detalhes de como podemos apoiar a operação de vocês aí?
👉 https://www.cyberinformatica.tech/suporte-ti`,
  },
  agencias_graficas_tech: {
    title: '💻 Agências, Gráficas, Estúdios & Tecnologia',
    text: `Olá, *{nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Como vocês trabalham direto com produção digital, arquivos pesados e prazos curtos, queria compartilhar uma novidade: criamos uma frente dedicada de *Suporte em TI & Performance de Estações de Trabalho* para agências, gráficas e estúdios.

Cuidamos de:
• Otimização pesada (upgrades de SSD NVMe/RAM, limpeza térmica e prevenção de travamentos)
• Rede local rápida, compartilhamento seguro de arquivos e impressoras
• Suporte remoto imediato e prioridade máxima na nossa bancada

Se tiverem alguma máquina precisando de revisão ou quiserem conhecer nosso suporte empresarial, me dá um alô!
👉 https://www.cyberinformatica.tech/suporte-ti`,
  },
  comercio_gastronomia: {
    title: '🏪 Comércio, Lojas, Farmácias & Gastronomia',
    text: `Olá, *{nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Em loja e comércio, quando o computador do caixa/PDV, o sistema de pedidos ou a internet trava, a venda para na hora.

Pensando nisso, estruturamos nosso serviço de *Suporte Rápido em TI para Comércios*:
• Atendimento *Remoto Imediato* e *Visita Presencial* ágil em Bragança e região
• Manutenção de computadores de balcão/caixa, notebooks, rede Wi-Fi e impressoras
• Prioridade no nosso laboratório para você nunca ficar na mão

Hoje vocês já contam com suporte técnico fixo ou chamam sob demanda quando acontece alguma urgência?
👉 https://www.cyberinformatica.tech/suporte-ti`,
  },
  auto_construcao_industria: {
    title: '🚗 Automotivo, Construção, Oficinas & Logística',
    text: `Olá, *{nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Estamos entrando em contato com as empresas aqui da região para apresentar nosso serviço de *Suporte em TI Empresarial (Remoto e Presencial)*.

Cuidamos dos computadores do escritório/recepção, emissão de notas e orçamentos, rede Wi-Fi, backup e manutenção preventiva para que os equipamentos funcionem rápido e sem dor de cabeça.

Trabalhamos tanto com atendimento avulso quanto acompanhamento mensal. Posso te mandar como funciona para deixar salvo aí quando precisarem?
👉 https://www.cyberinformatica.tech/suporte-ti`,
  },
  educacao_beleza_hotelaria: {
    title: '🎓 Escolas, Academias, Estética & Pousadas',
    text: `Olá, *{nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Passando para apresentar nossa nova frente de *Suporte em TI para Empresas, Escolas e Espaços de Atendimento* aqui na região:
• Manutenção preventiva e corretiva dos computadores de recepção e administração
• Otimização de rede Wi-Fi (para equipe e clientes/alunos)
• Suporte remoto rápido e atendimento presencial quando precisar

Vocês já têm alguém cuidando da parte de computadores e rede hoje, ou posso te explicar rapidinho como funcionam nossos pacotes e chamados?
👉 https://www.cyberinformatica.tech/suporte-ti`,
  },
  residencial_pf: {
    title: '🏠 Home Office, Autônomos & Clientes da Loja',
    text: `Olá, *{primeiro_nome}*! Tudo bem? Aqui é da *Cyber Informática* (Bragança Paulista).

Vimos que já temos seu contato aqui na loja e estamos passando para contar uma novidade: agora contamos com um serviço dedicado de *Suporte em TI (Remoto e Presencial)* para quem trabalha em Home Office, estuda ou depende do computador/notebook 100% do dia.

Se precisar resolver lentidão, travamentos, configuração de impressora/Wi-Fi, backup seguro ou upgrade com rapidez, pode acionar nosso time direto pelo WhatsApp!

Se tiver algum equipamento precisando de revisão agora, me chama por aqui!
👉 https://www.cyberinformatica.tech/suporte-ti`,
  },
  followup: {
    title: '🔄 Follow-up (Retorno Amigável 2 a 3 dias depois)',
    text: `Olá, *{primeiro_nome}*! Tudo bem por aí?

Passando só para deixar nosso contato da *Cyber Informática* fácil aqui no seu WhatsApp. Sempre que precisarem de suporte rápido nos computadores, notebooks ou rede (seja acesso remoto na hora ou assistência em laboratório/presencial), é só mandar mensagem direto por aqui que damos prioridade para vocês!

Um excelente trabalho por aí!`,
  },
};

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
  const local =
    digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
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
  preloadedWhatsAppLeads = [],
  currentUserId,
}: {
  initialLeads: InitialERPLead[];
  preloadedWhatsAppLeads?: PreloadedWhatsAppLead[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [copiedScript, setCopiedScript] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [importedLeads, setImportedLeads] = useState<PreloadedWhatsAppLead[]>(
    preloadedWhatsAppLeads,
  );
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [savingToDb, setSavingToDb] = useState(false);

  // Estado local otimista sincronizado com public.it_support_leads no Supabase
  const [crmOverrides, setCrmOverrides] = useState<
    Record<
      string,
      { status?: LeadStatus; notes?: string; lastContactedAt?: string | null }
    >
  >({});
  const [editingNotePhone, setEditingNotePhone] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [savingRowPhone, setSavingRowPhone] = useState<string | null>(null);

  // Filtros (inicia focado nos Leads Quentes / Clientes Já Atendidos)
  const [filterSegment, setFilterSegment] = useState<
    'hot' | 'direct_chat' | 'b2b' | 'erp' | 'all'
  >('hot');
  const [filterNiche, setFilterNiche] = useState<'all' | LeadNiche>('all');
  const [filterRegion, setFilterRegion] = useState<'regional' | 'all'>(
    'regional',
  );
  const [filterStatus, setFilterStatus] = useState<'all' | LeadStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Script ativo (inicia com Avaliação no Google / Clientes Quentes)
  const [templateKey, setTemplateKey] = useState<string>('avaliacao_google');
  const [customMessage, setCustomMessage] = useState(
    MESSAGE_TEMPLATES.avaliacao_google.text,
  );

  function selectNicheFilter(niche: 'all' | LeadNiche) {
    setFilterNiche(niche);
    if (niche !== 'all' && MESSAGE_TEMPLATES[niche]) {
      setTemplateKey(niche);
      setCustomMessage(MESSAGE_TEMPLATES[niche].text);
    }
  }

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    if (MESSAGE_TEMPLATES[key]) {
      setCustomMessage(MESSAGE_TEMPLATES[key].text);
    }
  }

  function applyQuickCampaign(
    mode: 'google_review' | 'hot_services' | 'b2b_it_support',
  ) {
    if (mode === 'google_review') {
      setFilterSegment('hot');
      setFilterNiche('all');
      handleTemplateChange('avaliacao_google');
    } else if (mode === 'hot_services') {
      setFilterSegment('hot');
      setFilterNiche('all');
      handleTemplateChange('clientes_quentes_servicos');
    } else {
      setFilterSegment('b2b');
      if (filterNiche === 'all' || filterNiche === 'residencial_pf') {
        handleTemplateChange('saude_clinicas');
      } else {
        handleTemplateChange(filterNiche);
      }
    }
  }

  const unifiedLeads = useMemo(() => {
    const map = new Map<string, UnifiedLead>();

    // 1. Carregar base do ERP (OS, PDV, Site)
    for (const item of initialLeads) {
      const p = normalizePhoneBR(item.phone);
      if (!p) continue;
      const ddd = p.slice(2, 4);
      const niche = inferNiche(item.name);
      const isB2B = item.origin === 'site_b2b' || niche !== 'residencial_pf';
      const existing = map.get(p);

      if (!existing) {
        map.set(p, {
          phoneE164: p,
          phoneFormatted: formatPhoneBR(p),
          ddd,
          isRegional: ['11', '19', '12', '35'].includes(ddd),
          name: item.name.trim(),
          email: item.email,
          segment: isB2B ? 'b2b' : 'b2c',
          niche,
          inErp: item.origin === 'erp_customer',
          erpCustomerId: item.id,
          osCount: item.osCount,
          salesCount: item.salesCount,
          fromWhatsApp: false,
          isHotLead: true,
          hasDirectChat: false,
          isAddressBook: false,
          msgsSent: 0,
          msgsReceived: 0,
          totalMessages: 0,
          lastChatDate: null,
          status: 'novo',
          notes: '',
          lastContactedAt: null,
        });
      } else {
        if (item.origin === 'erp_customer') {
          existing.inErp = true;
          existing.erpCustomerId = item.id;
        }
        existing.isHotLead = true;
        existing.osCount += item.osCount;
        existing.salesCount += item.salesCount;
        if (!existing.email && item.email) existing.email = item.email;
        if (isB2B) existing.segment = 'b2b';
        if (existing.niche === 'residencial_pf' && niche !== 'residencial_pf') {
          existing.niche = niche;
        }
      }
    }

    // 2. Mesclar com a base do WhatsApp Desktop / Supabase (it_support_leads)
    for (const wa of importedLeads) {
      const p = normalizePhoneBR(wa.phone);
      if (!p) continue;
      const ddd = p.slice(2, 4);
      const niche = inferNiche(wa.name, wa.niche);
      const isB2B =
        wa.segment?.toLowerCase().includes('b2b') ||
        wa.segment?.toLowerCase().includes('empresa') ||
        niche !== 'residencial_pf';
      const msgsSent = Number(wa.msgsSent || 0);
      const msgsReceived = Number(wa.msgsReceived || 0);
      const totalMessages = msgsSent + msgsReceived;
      const hasDirectChat = Boolean(wa.hasDirectChat || totalMessages > 0);
      const isAddressBook = Boolean(wa.isAddressBook);
      const isHotLead = Boolean(wa.isHotLead || hasDirectChat || isAddressBook);

      const existing = map.get(p);
      if (!existing) {
        map.set(p, {
          phoneE164: p,
          phoneFormatted: formatPhoneBR(p),
          ddd,
          isRegional: ['11', '19', '12', '35'].includes(ddd),
          name: wa.name?.trim() || `Contato WhatsApp ${formatPhoneBR(p)}`,
          email: null,
          segment: isB2B ? 'b2b' : 'b2c',
          niche,
          inErp: false,
          erpCustomerId: null,
          osCount: 0,
          salesCount: 0,
          fromWhatsApp: true,
          isHotLead,
          hasDirectChat,
          isAddressBook,
          msgsSent,
          msgsReceived,
          totalMessages,
          lastChatDate: wa.lastChatDate || null,
          status: wa.status || 'novo',
          notes: wa.notes || '',
          lastContactedAt: wa.lastContactedAt || null,
        });
      } else {
        existing.fromWhatsApp = true;
        if (
          wa.name &&
          !wa.name.startsWith('Contato WhatsApp') &&
          (existing.name === 'Cliente PDV' ||
            wa.name.length > existing.name.length)
        ) {
          existing.name = wa.name.trim();
        }
        if (isB2B) existing.segment = 'b2b';
        if (niche !== 'residencial_pf') existing.niche = niche;
        if (isHotLead) existing.isHotLead = true;
        if (hasDirectChat) existing.hasDirectChat = true;
        if (isAddressBook) existing.isAddressBook = true;
        if (msgsSent > existing.msgsSent) existing.msgsSent = msgsSent;
        if (msgsReceived > existing.msgsReceived) {
          existing.msgsReceived = msgsReceived;
        }
        existing.totalMessages = existing.msgsSent + existing.msgsReceived;
        if (wa.lastChatDate && (!existing.lastChatDate || wa.lastChatDate > existing.lastChatDate)) {
          existing.lastChatDate = wa.lastChatDate;
        }
        if (wa.status && wa.status !== 'novo') existing.status = wa.status;
        if (wa.notes) existing.notes = wa.notes;
        if (wa.lastContactedAt) existing.lastContactedAt = wa.lastContactedAt;
      }
    }

    // 3. Aplicar atualizações otimistas feitas nesta sessão
    for (const [phone, ov] of Object.entries(crmOverrides)) {
      const row = map.get(phone);
      if (row) {
        if (ov.status) row.status = ov.status;
        if (ov.notes !== undefined) row.notes = ov.notes;
        if (ov.lastContactedAt !== undefined) {
          row.lastContactedAt = ov.lastContactedAt;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.isHotLead !== b.isHotLead) return a.isHotLead ? -1 : 1;
      if (a.osCount + a.salesCount !== b.osCount + b.salesCount) {
        return b.osCount + b.salesCount - (a.osCount + a.salesCount);
      }
      if (a.totalMessages !== b.totalMessages) {
        return b.totalMessages - a.totalMessages;
      }
      if (a.lastChatDate !== b.lastChatDate) {
        return (b.lastChatDate || '').localeCompare(a.lastChatDate || '');
      }
      if (a.segment !== b.segment) return a.segment === 'b2b' ? -1 : 1;
      if (a.isRegional !== b.isRegional) return a.isRegional ? -1 : 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [initialLeads, importedLeads, crmOverrides]);

  const stats = useMemo(() => {
    const total = unifiedLeads.length;
    const hot = unifiedLeads.filter((l) => l.isHotLead).length;
    const directChat = unifiedLeads.filter(
      (l) => l.hasDirectChat || l.osCount > 0 || l.salesCount > 0,
    ).length;
    const erp = unifiedLeads.filter((l) => l.inErp || l.osCount > 0 || l.salesCount > 0).length;
    const b2b = unifiedLeads.filter((l) => l.segment === 'b2b').length;
    const b2bRegional = unifiedLeads.filter(
      (l) => l.segment === 'b2b' && l.isRegional,
    ).length;
    const contacted = unifiedLeads.filter((l) => l.status !== 'novo').length;
    const negotiating = unifiedLeads.filter(
      (l) =>
        l.status === 'respondeu' ||
        l.status === 'proposta' ||
        l.status === 'fechado',
    ).length;

    const byNiche: Record<LeadNiche, number> = {
      saude_clinicas: 0,
      escritorios_servicos: 0,
      agencias_graficas_tech: 0,
      comercio_gastronomia: 0,
      auto_construcao_industria: 0,
      educacao_beleza_hotelaria: 0,
      residencial_pf: 0,
    };
    for (const l of unifiedLeads) {
      if (filterRegion === 'regional' && !l.isRegional) continue;
      if (filterSegment === 'hot' && !l.isHotLead) continue;
      if (
        filterSegment === 'direct_chat' &&
        !l.hasDirectChat &&
        l.osCount === 0 &&
        l.salesCount === 0
      ) {
        continue;
      }
      if (filterSegment === 'b2b' && l.segment !== 'b2b') continue;
      if (filterSegment === 'erp' && !l.inErp && l.osCount === 0 && l.salesCount === 0) {
        continue;
      }
      byNiche[l.niche] = (byNiche[l.niche] || 0) + 1;
    }

    return {
      total,
      hot,
      directChat,
      erp,
      b2b,
      b2bRegional,
      contacted,
      negotiating,
      byNiche,
    };
  }, [unifiedLeads, filterRegion, filterSegment]);

  const filteredLeads = useMemo(() => {
    return unifiedLeads.filter((l) => {
      if (filterRegion === 'regional' && !l.isRegional) return false;
      if (filterSegment === 'hot' && !l.isHotLead) return false;
      if (
        filterSegment === 'direct_chat' &&
        !l.hasDirectChat &&
        l.osCount === 0 &&
        l.salesCount === 0
      ) {
        return false;
      }
      if (filterSegment === 'b2b' && l.segment !== 'b2b') return false;
      if (filterSegment === 'erp' && !l.inErp && l.osCount === 0 && l.salesCount === 0) {
        return false;
      }
      if (filterNiche !== 'all' && l.niche !== filterNiche) return false;
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.phoneFormatted.includes(q) ||
          l.phoneE164.includes(q) ||
          l.notes.toLowerCase().includes(q) ||
          NICHE_META[l.niche].label.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    unifiedLeads,
    filterRegion,
    filterSegment,
    filterNiche,
    filterStatus,
    searchQuery,
  ]);

  async function persistLeadUpdate(
    lead: UnifiedLead,
    patch: { status?: LeadStatus; notes?: string; markContactedNow?: boolean },
  ) {
    const nextStatus = patch.status ?? lead.status;
    const nextNotes = patch.notes !== undefined ? patch.notes : lead.notes;
    const nextContactedAt = patch.markContactedNow
      ? new Date().toISOString()
      : lead.lastContactedAt;

    setCrmOverrides((prev) => ({
      ...prev,
      [lead.phoneE164]: {
        status: nextStatus,
        notes: nextNotes,
        lastContactedAt: nextContactedAt,
      },
    }));

    setSavingRowPhone(lead.phoneE164);
    try {
      const supabase = createCRMBrowserClient();
      await supabase.from('it_support_leads').upsert(
        {
          phone_e164: lead.phoneE164,
          name: lead.name,
          segment: lead.segment,
          niche: lead.niche,
          status: nextStatus,
          notes: nextNotes || null,
          last_contacted_at: nextContactedAt,
          updated_by: currentUserId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_e164' },
      );
    } catch {
      // Fallback silencioso caso offline
    } finally {
      setSavingRowPhone(null);
    }
  }

  function buildWhatsAppUrl(lead: UnifiedLead) {
    const firstName =
      lead.name
        .replace(/^Contato WhatsApp.*$/i, 'tudo bem')
        .trim()
        .split(/\s+/)[0] || 'tudo bem';

    const msg = customMessage
      .replace(/\{primeiro_nome\}/gi, firstName)
      .replace(/\{nome\}/gi, lead.name);

    return `https://wa.me/${lead.phoneE164}?text=${encodeURIComponent(msg)}`;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      const parsed: PreloadedWhatsAppLead[] = [];

      try {
        if (file.name.endsWith('.json') || text.trim().startsWith('[')) {
          const arr = JSON.parse(text);
          for (const item of Array.isArray(arr) ? arr : []) {
            parsed.push({
              name: item.name || item.Nome || item.savedName || item.pushName || '',
              phone: item.phone || item.Telefone_E164 || item.phoneFormatted || '',
              segment: item.segment || item.Segmento || '',
              niche: item.niche || undefined,
            });
          }
        } else if (file.name.endsWith('.vcf') || text.includes('BEGIN:VCARD')) {
          const cards = text.split(/BEGIN:VCARD/i).slice(1);
          for (const card of cards) {
            const fnMatch = card.match(/^FN(?:;[^:]*)?:(.+)$/im);
            const name = fnMatch ? fnMatch[1].trim() : '';
            const telMatches = [...card.matchAll(/^TEL(?:;[^:]*)?:(.+)$/gim)];
            for (const tm of telMatches) {
              parsed.push({ name, phone: tm[1].trim() });
            }
          }
        } else {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length > 1) {
            const sep = lines[0].includes(';') ? ';' : ',';
            const headers = lines[0]
              .split(sep)
              .map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase());
            const nameIdx = headers.findIndex((h) =>
              ['nome', 'name', 'first name', 'display name'].includes(h),
            );
            const phoneIdx = headers.findIndex((h) =>
              [
                'telefone_e164',
                'telefone',
                'phone',
                'phone 1 - value',
                'mobile phone',
              ].includes(h),
            );
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i]
                .split(sep)
                .map((c) => c.replace(/^"|"$/g, '').trim());
              const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
              const phone = phoneIdx >= 0 ? cols[phoneIdx] : cols[1];
              if (phone) parsed.push({ name, phone });
            }
          }
        }

        setImportedLeads((prev) => [...prev, ...parsed]);
        setImportStatus(
          `✅ ${parsed.length} registros lidos de "${file.name}" e unificados!`,
        );
      } catch (err) {
        setImportStatus(
          `❌ Erro ao ler o arquivo: ${err instanceof Error ? err.message : 'Formato inválido'}`,
        );
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  async function saveNewLeadsToERP() {
    const toInsert = filteredLeads.filter((l) => !l.inErp);
    if (toInsert.length === 0) {
      setImportStatus(
        'ℹ️ Todos os leads visíveis no filtro atual já estão cadastrados em Clientes.',
      );
      return;
    }

    setSavingToDb(true);
    setImportStatus(null);
    try {
      const supabase = createCRMBrowserClient();
      const rows = toInsert.map((l) => ({
        name: l.name,
        phone: l.phoneFormatted,
        email: l.email,
        notes: `Lead Suporte TI (${NICHE_META[l.niche].shortLabel})`,
        created_by: currentUserId,
      }));

      let insertedCount = 0;
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const { error } = await supabase.from('customers').insert(chunk);
        if (error) throw error;
        insertedCount += chunk.length;
      }

      setImportStatus(
        `✅ ${insertedCount} leads foram salvos no cadastro de Clientes do ERP!`,
      );
      router.refresh();
    } catch (err) {
      setImportStatus(
        `❌ Erro ao salvar no banco: ${err instanceof Error ? err.message : 'Falha desconhecida'}`,
      );
    } finally {
      setSavingToDb(false);
    }
  }

  function exportFilteredCSV() {
    const header =
      'Nome;Telefone_E164;Telefone_Formatado;DDD;Lead_Quente;Conversa_Direta_1a1;Msgs_Trocadas;Msgs_Enviadas_Loja;Msgs_Recebidas_Cliente;Ultima_Conversa;Salvo_Na_Agenda;Segmento;Nicho_TI;Status_Funil;Observacoes;Ja_Cliente_ERP;Qtd_OS;Qtd_Vendas';
    const esc = (v: string | number | null | undefined) =>
      `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = filteredLeads.map((l) =>
      [
        esc(l.name),
        esc(l.phoneE164),
        esc(l.phoneFormatted),
        esc(l.ddd),
        esc(l.isHotLead ? 'Sim' : 'Não'),
        esc(l.hasDirectChat ? 'Sim' : 'Não'),
        l.totalMessages,
        l.msgsSent,
        l.msgsReceived,
        esc(l.lastChatDate),
        esc(l.isAddressBook ? 'Sim' : 'Não'),
        esc(l.segment === 'b2b' ? 'Empresa / B2B' : 'Cliente / Residencial'),
        esc(NICHE_META[l.niche].label),
        esc(STATUS_META[l.status].label),
        esc(l.notes),
        esc(l.inErp ? 'Sim' : 'Não'),
        l.osCount,
        l.salesCount,
      ].join(';'),
    );

    const csv = '\uFEFF' + [header, ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads-cyber-${filterSegment}-${filterNiche}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="space-y-6">
      {/* KPIs da Central de Leads Quentes & Suporte em TI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border-2 border-black bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-900">
            🔥 Leads Quentes (Atendidos)
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">{stats.hot}</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            {stats.directChat} conversas 1-a-1 + agenda/ERP
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Empresas B2B (Região)
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">
            {stats.b2bRegional}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            DDD 11, 19, 12 e 35 ({stats.b2b} no total)
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Já Abordados no Funil
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">
            {stats.contacted}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sincronizados no Supabase
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Em Negociação / Fechados
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-950">
            {stats.negotiating}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Responderam, Proposta ou Fechado
          </p>
        </div>
        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Página Comercial B2B
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            Apresentação Suporte em TI
          </p>
          <Link
            href="/suporte-ti"
            target="_blank"
            className="mt-2 inline-block rounded bg-white px-2.5 py-1 text-xs font-semibold text-black hover:bg-zinc-200"
          >
            Abrir /suporte-ti ↗
          </Link>
        </div>
      </div>

      {/* Atalhos Rápidos de Campanha (1 clique configura Público + Script) */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">
              Escolha o Modo de Campanha (Configura Filtro + Mensagem Automaticamente)
            </h2>
            <p className="text-xs text-zinc-600">
              Selecione o objetivo abaixo para filtrar os clientes certos e já carregar o texto ideal de abordagem:
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-3">
          <button
            type="button"
            onClick={() => applyQuickCampaign('google_review')}
            className={`rounded-md border p-3 text-left transition ${
              templateKey === 'avaliacao_google' && filterSegment === 'hot'
                ? 'border-black bg-black text-white'
                : 'border-zinc-300 bg-zinc-50 text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <div className="text-xs font-bold">
              ⭐ 1. Pedir Avaliação no Google (Pós-Venda)
            </div>
            <p
              className={`mt-1 text-[11px] ${
                templateKey === 'avaliacao_google' && filterSegment === 'hot'
                  ? 'text-zinc-300'
                  : 'text-zinc-600'
              }`}
            >
              Filtra apenas <strong>Clientes Já Atendidos / Conversas 1-a-1</strong> e carrega mensagem pedindo 5 estrelas no Google.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyQuickCampaign('hot_services')}
            className={`rounded-md border p-3 text-left transition ${
              templateKey === 'clientes_quentes_servicos' &&
              filterSegment === 'hot'
                ? 'border-black bg-black text-white'
                : 'border-zinc-300 bg-zinc-50 text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <div className="text-xs font-bold">
              🔥 2. Oferecer Novos Serviços (Clientes Quentes)
            </div>
            <p
              className={`mt-1 text-[11px] ${
                templateKey === 'clientes_quentes_servicos' &&
                filterSegment === 'hot'
                  ? 'text-zinc-300'
                  : 'text-zinc-600'
              }`}
            >
              Aborda clientes que já conhecem a loja oferecendo Suporte TI, Upgrades no mesmo dia, Reparo de GPU e Troca de Vidro.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyQuickCampaign('b2b_it_support')}
            className={`rounded-md border p-3 text-left transition ${
              filterSegment === 'b2b'
                ? 'border-black bg-black text-white'
                : 'border-zinc-300 bg-zinc-50 text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <div className="text-xs font-bold">
              🏢 3. Prospecção B2B por Sub-Nicho (Suporte TI)
            </div>
            <p
              className={`mt-1 text-[11px] ${
                filterSegment === 'b2b' ? 'text-zinc-300' : 'text-zinc-600'
              }`}
            >
              Filtra as <strong>320 Empresas/Comércios</strong> por ramo (Clínicas, Escritórios, Lojas, etc.) com script sob medida.
            </p>
          </button>
        </div>
      </div>

      {/* Seletor de Sub-Nichos Estratégicos + Script de Abordagem */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Coluna Esquerda: Sub-Nichos de Ataque */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-950">
              1. Filtrar por Ramo / Sub-Nicho
            </h2>
            <div className="inline-flex rounded-md border border-zinc-300 bg-zinc-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterRegion('regional')}
                className={`rounded px-2 py-1 font-medium ${
                  filterRegion === 'regional'
                    ? 'bg-black text-white'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                Região (DDD 11/19/12/35)
              </button>
              <button
                type="button"
                onClick={() => setFilterRegion('all')}
                className={`rounded px-2 py-1 font-medium ${
                  filterRegion === 'all'
                    ? 'bg-black text-white'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                Todo Brasil
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            Ao clicar em um sub-nicho empresarial, o script ao lado adapta o
            argumento para a dor daquele setor.
          </p>

          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              onClick={() => selectNicheFilter('all')}
              className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                filterNiche === 'all'
                  ? 'border-black bg-black text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              <span>Todos os Ramos (No Filtro Atual)</span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[11px]">
                {Object.values(stats.byNiche).reduce((a, b) => a + b, 0)}
              </span>
            </button>

            {(
              [
                'saude_clinicas',
                'escritorios_servicos',
                'agencias_graficas_tech',
                'comercio_gastronomia',
                'auto_construcao_industria',
                'educacao_beleza_hotelaria',
                'residencial_pf',
              ] as LeadNiche[]
            ).map((nicheKey) => {
              const active = filterNiche === nicheKey;
              return (
                <button
                  key={nicheKey}
                  type="button"
                  onClick={() => {
                    selectNicheFilter(nicheKey);
                  }}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-medium transition ${
                    active
                      ? 'border-black bg-black text-white'
                      : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  <span>{MESSAGE_TEMPLATES[nicheKey]?.title || NICHE_META[nicheKey].label}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      active
                        ? 'bg-white text-black'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {stats.byNiche[nicheKey] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Script Personalizado + Importação/Exportação */}
        <div className="rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-zinc-950">
                2. Script de Abordagem no WhatsApp
              </h2>
              <p className="text-xs text-zinc-600">
                Use <code className="rounded bg-zinc-100 px-1">{'{nome}'}</code>{' '}
                ou{' '}
                <code className="rounded bg-zinc-100 px-1">
                  {'{primeiro_nome}'}
                </code>{' '}
                para preencher automaticamente o nome da empresa/cliente.
              </p>
            </div>
            <select
              value={templateKey}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-900 focus:border-black focus:outline-none"
            >
              {Object.entries(MESSAGE_TEMPLATES).map(([k, tpl]) => (
                <option key={k} value={k}>
                  {tpl.title}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={7}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="mt-3 w-full rounded-md border border-zinc-300 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-950 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50">
                Importar Arquivo (.json, .csv, .vcf)
                <input
                  type="file"
                  accept=".json,.csv,.vcf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={exportFilteredCSV}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Baixar Planilha do Filtro ({filteredLeads.length})
              </button>

              <button
                type="button"
                onClick={saveNewLeadsToERP}
                disabled={savingToDb}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              >
                {savingToDb ? 'Salvando…' : 'Cadastrar Novos em Clientes'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions((v) => !v)}
              className="text-xs font-medium text-zinc-500 underline hover:text-black"
            >
              {showInstructions
                ? 'Ocultar script de extração Web'
                : 'Extrair de outro WhatsApp Web'}
            </button>
          </div>

          {showInstructions && (
            <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900">
                  Extração rápida via Console do Navegador (F12 no web.whatsapp.com):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(WHATSAPP_CONSOLE_SCRIPT);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 3000);
                  }}
                  className="rounded bg-black px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-800"
                >
                  {copiedScript ? '✓ Script Copiado!' : 'Copiar Script F12'}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Ou no PC da loja com WhatsApp Desktop instalado, execute no
                terminal:{' '}
                <code className="rounded bg-zinc-200 px-1 text-zinc-900">
                  node tools/whatsapp-leads/extract-whatsapp-desktop.mjs
                </code>
              </p>
            </div>
          )}

          {importStatus && (
            <div className="mt-3 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900">
              {importStatus}
            </div>
          )}
        </div>
      </div>

      {/* Barra de Filtros da Lista e Funil */}
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filtro de Segmento */}
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                id: 'hot',
                label: `🔥 Leads Quentes / Já Atendidos (${stats.hot})`,
              },
              {
                id: 'direct_chat',
                label: `💬 Conversas 1-a-1 Ativas (${stats.directChat})`,
              },
              { id: 'b2b', label: `🏢 Empresas / B2B (${stats.b2b})` },
              { id: 'erp', label: `🛠️ Já no ERP (${stats.erp})` },
              { id: 'all', label: `👥 Todos (${stats.total})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilterSegment(
                    tab.id as 'hot' | 'direct_chat' | 'b2b' | 'erp' | 'all',
                  )
                }
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  filterSegment === tab.id
                    ? 'bg-black text-white'
                    : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtro de Status do Funil */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">
              Etapa do Funil:
            </span>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | LeadStatus)
              }
              className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-900 focus:border-black focus:outline-none"
            >
              <option value="all">Todas as Etapas</option>
              <option value="novo">⏳ Pendentes (Não contatados)</option>
              <option value="contatado">📤 Mensagem Enviada</option>
              <option value="respondeu">💬 Respondeu</option>
              <option value="proposta">📄 Proposta Enviada</option>
              <option value="fechado">✅ Fechado (Cliente TI)</option>
              <option value="sem_interesse">🚫 Sem Interesse</option>
            </select>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa, nome, telefone ou nota…"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:w-64"
            />
          </div>
        </div>

        {/* Tabela de Prospecção */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2.5">Cliente / Empresa</th>
                <th className="px-3 py-2.5">WhatsApp</th>
                <th className="px-3 py-2.5">Sub-Nicho TI</th>
                <th className="px-3 py-2.5">Histórico & Conversas 1-a-1</th>
                <th className="px-3 py-2.5">Etapa do Funil</th>
                <th className="px-3 py-2.5">Anotações Comerciais</th>
                <th className="px-3 py-2.5 text-right">Disparo Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredLeads.slice(0, 300).map((lead) => {
                const isEditingNote = editingNotePhone === lead.phoneE164;
                const isSaving = savingRowPhone === lead.phoneE164;
                return (
                  <tr
                    key={lead.phoneE164}
                    className={
                      lead.status === 'sem_interesse'
                        ? 'bg-zinc-50/40 opacity-55'
                        : lead.status !== 'novo'
                          ? 'bg-zinc-50/80'
                          : 'hover:bg-zinc-50'
                    }
                  >
                    <td className="px-3 py-2.5 font-medium text-zinc-950">
                      <div className="flex items-center gap-1.5">
                        <span>{lead.name}</span>
                        {lead.isHotLead && (
                          <span
                            title="Cliente Quente (Já atendido no WhatsApp, Agenda ou ERP)"
                            className="inline-block rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
                          >
                            Quente
                          </span>
                        )}
                      </div>
                      {lead.email && (
                        <div className="text-xs font-normal text-zinc-500">
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-zinc-700">
                      <div>{lead.phoneFormatted}</div>
                      <div className="text-[10px] text-zinc-400">
                        DDD {lead.ddd}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${NICHE_META[lead.niche].badgeClass}`}
                      >
                        {NICHE_META[lead.niche].shortLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-zinc-600">
                      <div className="flex flex-wrap gap-1">
                        {(lead.inErp ||
                          lead.osCount > 0 ||
                          lead.salesCount > 0) && (
                          <span className="rounded border border-zinc-900 bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            🛠️ ERP ({lead.osCount} OS · {lead.salesCount} Vendas)
                          </span>
                        )}
                        {lead.totalMessages > 0 ? (
                          <span
                            title={`${lead.msgsSent} mensagens enviadas pela loja · ${lead.msgsReceived} recebidas do cliente`}
                            className="rounded border border-zinc-400 bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-900"
                          >
                            💬 {lead.totalMessages} msgs ({lead.msgsSent} env ·{' '}
                            {lead.msgsReceived} rec)
                          </span>
                        ) : lead.hasDirectChat ? (
                          <span className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800">
                            💬 Conversa 1-a-1
                          </span>
                        ) : null}
                        {lead.lastChatDate && (
                          <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-600">
                            📅 {lead.lastChatDate}
                          </span>
                        )}
                        {lead.isAddressBook && (
                          <span className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
                            📒 Na Agenda
                          </span>
                        )}
                        {lead.fromWhatsApp &&
                          !lead.inErp &&
                          !lead.hasDirectChat &&
                          !lead.isAddressBook && (
                            <span className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400">
                              Contato Geral / Grupo
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={lead.status}
                        disabled={isSaving}
                        onChange={(e) =>
                          persistLeadUpdate(lead, {
                            status: e.target.value as LeadStatus,
                          })
                        }
                        className={`rounded border px-2 py-1 text-xs font-semibold focus:outline-none ${STATUS_META[lead.status].badgeClass}`}
                      >
                        <option value="novo" className="bg-white text-zinc-900">
                          ⏳ Pendente
                        </option>
                        <option
                          value="contatado"
                          className="bg-white text-zinc-900"
                        >
                          📤 Mensagem Enviada
                        </option>
                        <option
                          value="respondeu"
                          className="bg-white text-zinc-900"
                        >
                          💬 Respondeu
                        </option>
                        <option
                          value="proposta"
                          className="bg-white text-zinc-900"
                        >
                          📄 Proposta Enviada
                        </option>
                        <option
                          value="fechado"
                          className="bg-white text-zinc-900"
                        >
                          ✅ Fechado (Cliente TI)
                        </option>
                        <option
                          value="sem_interesse"
                          className="bg-white text-zinc-900"
                        >
                          🚫 Sem Interesse
                        </option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      {isEditingNote ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Ex: Tem 6 PCs, retornar terça…"
                            className="w-44 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 focus:border-black focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await persistLeadUpdate(lead, {
                                notes: noteDraft.trim(),
                              });
                              setEditingNotePhone(null);
                            }}
                            className="rounded bg-black px-2 py-1 text-[11px] font-semibold text-white hover:bg-zinc-800"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNotePhone(null)}
                            className="rounded border border-zinc-200 px-1.5 py-1 text-[11px] text-zinc-500 hover:text-black"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotePhone(lead.phoneE164);
                            setNoteDraft(lead.notes || '');
                          }}
                          className="group flex items-center gap-1 text-left text-xs text-zinc-600 hover:text-black"
                        >
                          {lead.notes ? (
                            <span className="max-w-[200px] truncate font-medium text-zinc-900">
                              {lead.notes}
                            </span>
                          ) : (
                            <span className="text-zinc-400 group-hover:text-zinc-700">
                              + Adicionar nota
                            </span>
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <a
                        href={buildWhatsAppUrl(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (lead.status === 'novo') {
                            persistLeadUpdate(lead, {
                              status: 'contatado',
                              markContactedNow: true,
                            });
                          } else {
                            persistLeadUpdate(lead, { markContactedNow: true });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                      >
                        {lead.status === 'novo'
                          ? 'Abordar no WhatsApp'
                          : 'Reabrir Conversa'}{' '}
                        ↗
                      </a>
                    </td>
                  </tr>
                );
              })}

              {filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-sm text-zinc-500"
                  >
                    Nenhum lead encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredLeads.length > 300 && (
            <p className="mt-3 text-center text-xs text-zinc-500">
              Exibindo os primeiros 300 de {filteredLeads.length} leads deste
              filtro. Use a busca, filtre por Sub-Nicho ou clique em{' '}
              <strong>Baixar Planilha do Filtro</strong> para ver todos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
