/**
 * ============================================================================
 * EXTRATOR DE CONTATOS E CONVERSAS DO WHATSAPP WEB — CYBER INFORMÁTICA
 * ============================================================================
 *
 * COMO USAR:
 * 1. Abra https://web.whatsapp.com no navegador (Chrome/Edge) conectado no
 *    WhatsApp da loja.
 * 2. Pressione F12 (ou Ctrl+Shift+I) e clique na aba "Console".
 *    (Se o Chrome pedir, digite "allow pasting" ou "permitir colagem" e dê Enter).
 * 3. Cole TODO este script no Console e pressione Enter.
 * 4. Em poucos segundos, ele vai ler o banco interno do WhatsApp Web
 *    (IndexedDB `model-storage` -> `contact` e `chat`) e baixar automaticamente:
 *      - leads-whatsapp-cyber.csv  (pronto para Excel / Google Sheets / ERP Cyber)
 *      - leads-whatsapp-cyber.json (backup estruturado completo)
 * ============================================================================
 */
(async function extractCyberWhatsAppLeads() {
  console.log('%c[Cyber Leads] Iniciando extração completa do WhatsApp Web...', 'color:#000;background:#22c55e;font-weight:bold;padding:4px 8px;border-radius:4px;');

  const contactsMap = new Map();

  function cleanPhone(raw) {
    if (!raw) return '';
    const digits = String(raw).split('@')[0].replace(/\D/g, '');
    if (!digits || digits.length < 10 || digits.length > 15) return '';
    return digits;
  }

  function formatPhoneBR(digits) {
    const d = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
    if (d.length === 11) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    if (d.length === 10) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
    return `+${digits}`;
  }

  function detectB2B(name) {
    if (!name) return false;
    return /\b(ltda|me\b|eireli|comercio|comércio|servicos|serviços|loja|assistencia|assistência|informatica|informática|tech|cell|celulares|escritorio|escritório|clinica|clínica|advocacia|contabilidade|engenharia|consultoria|mercado|auto|oficina|studio|estúdio|escola|colegio|colégio|imobiliaria|imobiliária)\b/i.test(name);
  }

  function upsertLead(phoneRaw, data) {
    const phone = cleanPhone(phoneRaw);
    if (!phone) return;

    const existing = contactsMap.get(phone) || {
      phone,
      phoneFormatted: formatPhoneBR(phone),
      savedName: '',
      pushName: '',
      verifiedName: '',
      isBusiness: false,
      hasChatHistory: false,
      lastMessageTs: 0,
      unreadCount: 0,
      source: 'whatsapp_web',
    };

    if (data.savedName && (!existing.savedName || data.savedName.length > existing.savedName.length)) {
      existing.savedName = data.savedName.trim();
    }
    if (data.pushName && (!existing.pushName || data.pushName.length > existing.pushName.length)) {
      existing.pushName = data.pushName.trim();
    }
    if (data.verifiedName) {
      existing.verifiedName = data.verifiedName.trim();
    }
    if (data.isBusiness) {
      existing.isBusiness = true;
    }
    if (data.hasChatHistory) {
      existing.hasChatHistory = true;
    }
    if (data.lastMessageTs && data.lastMessageTs > existing.lastMessageTs) {
      existing.lastMessageTs = data.lastMessageTs;
    }

    contactsMap.set(phone, existing);
  }

  function readObjectStore(db, storeName) {
    return new Promise((resolve) => {
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // 1. Lê IndexedDB `model-storage` (onde o WhatsApp Web guarda contatos, conversas e metadados)
  try {
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('model-storage');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const [contacts, chats, lidMappings] = await Promise.all([
      readObjectStore(db, 'contact'),
      readObjectStore(db, 'chat'),
      readObjectStore(db, 'lid-mapping'),
    ]);

    console.log(`[Cyber Leads] IndexedDB lido: ${contacts.length} contatos, ${chats.length} conversas.`);

    // Mapa auxiliar de LID -> Número de telefone real (WhatsApp usa @lid em alguns chats recentes)
    const lidToPhone = new Map();
    for (const m of lidMappings) {
      const lid = m.lid || m.id;
      const pn = m.pn || m.phoneNumber || m.user;
      if (lid && pn) {
        lidToPhone.set(String(lid).split('@')[0], cleanPhone(pn));
      }
    }
    for (const c of contacts) {
      const idStr = String(c.id || '');
      if (c.phoneNumber && idStr.includes('@lid')) {
        lidToPhone.set(idStr.split('@')[0], cleanPhone(c.phoneNumber));
      }
    }

    for (const c of contacts) {
      const idStr = String(c.id || '');
      // Ignora grupos, status e canais
      if (idStr.endsWith('@g.us') || idStr.includes('status@broadcast') || idStr.endsWith('@newsletter')) {
        continue;
      }
      let phoneCandidate = c.phoneNumber || idStr;
      if (idStr.endsWith('@lid')) {
        const mapped = lidToPhone.get(idStr.split('@')[0]);
        if (mapped) phoneCandidate = mapped;
        else continue;
      }

      upsertLead(phoneCandidate, {
        savedName: c.name || c.shortName || '',
        pushName: c.pushname || c.notifyName || '',
        verifiedName: c.verifiedName || '',
        isBusiness: Boolean(c.isBusiness || c.isEnterprise || c.verifiedName),
      });
    }

    for (const ch of chats) {
      const idStr = String(ch.id || '');
      if (idStr.endsWith('@g.us') || idStr.includes('status@broadcast') || idStr.endsWith('@newsletter')) {
        continue;
      }
      let phoneCandidate = ch.phoneNumber || idStr;
      if (idStr.endsWith('@lid')) {
        const mapped = lidToPhone.get(idStr.split('@')[0]);
        if (mapped) phoneCandidate = mapped;
        else continue;
      }

      upsertLead(phoneCandidate, {
        savedName: ch.name || ch.formattedTitle || '',
        hasChatHistory: true,
        lastMessageTs: Number(ch.t || ch.timestamp || 0),
      });
    }

    db.close();
  } catch (err) {
    console.warn('[Cyber Leads] Aviso ao ler IndexedDB (usando fallback DOM):', err);
  }

  // 2. Fallback / Complemento pelo DOM visível da lista de conversas
  try {
    const cells = document.querySelectorAll('[role="listitem"], [data-testid="cell-frame-container"]');
    cells.forEach((cell) => {
      const text = cell.innerText || '';
      const match = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/);
      if (match) {
        const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
        upsertLead(match[0], {
          pushName: lines[0] || '',
          hasChatHistory: true,
        });
      }
    });
  } catch {
    // ignora erro de DOM
  }

  // 3. Monta a lista final consolidada e classificada
  const results = Array.from(contactsMap.values())
    .map((item) => {
      const displayName =
        item.savedName ||
        item.verifiedName ||
        item.pushName ||
        `Contato WhatsApp ${item.phoneFormatted}`;

      const isLikelyB2B =
        item.isBusiness ||
        detectB2B(displayName) ||
        detectB2B(item.verifiedName);

      const lastDate =
        item.lastMessageTs > 0
          ? new Date(item.lastMessageTs * 1000).toISOString().slice(0, 10)
          : '';

      return {
        name: displayName,
        phone: item.phone.startsWith('55') ? item.phone : `55${item.phone}`,
        phoneFormatted: item.phoneFormatted,
        savedName: item.savedName,
        pushName: item.pushName,
        verifiedName: item.verifiedName,
        segment: isLikelyB2B ? 'Empresa / B2B' : 'Cliente / Residencial',
        hasChatHistory: item.hasChatHistory ? 'Sim' : 'Não',
        lastInteraction: lastDate,
      };
    })
    .sort((a, b) => {
      if (a.segment !== b.segment) return a.segment === 'Empresa / B2B' ? -1 : 1;
      if (a.lastInteraction !== b.lastInteraction) return (b.lastInteraction || '').localeCompare(a.lastInteraction || '');
      return a.name.localeCompare(b.name);
    });

  console.log(`%c[Cyber Leads] Sucesso! ${results.length} contatos únicos extraídos.`, 'color:#fff;background:#16a34a;font-weight:bold;padding:4px 8px;border-radius:4px;');

  // 4. Faz download do CSV (com BOM UTF-8 para abrir perfeito no Excel)
  const csvHeaders = [
    'Nome',
    'Telefone_E164',
    'Telefone_Formatado',
    'Segmento_Sugerido',
    'Ja_Conversou',
    'Ultima_Interacao',
    'Nome_Salvo_Agenda',
    'Nome_Perfil_WhatsApp',
    'Nome_Empresa_Verificado',
  ];

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvLines = [
    csvHeaders.join(';'),
    ...results.map((r) =>
      [
        esc(r.name),
        esc(r.phone),
        esc(r.phoneFormatted),
        esc(r.segment),
        esc(r.hasChatHistory),
        esc(r.lastInteraction),
        esc(r.savedName),
        esc(r.pushName),
        esc(r.verifiedName),
      ].join(';')
    ),
  ];

  const dateTag = new Date().toISOString().slice(0, 10);

  const csvBlob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const csvUrl = URL.createObjectURL(csvBlob);
  const aCsv = document.createElement('a');
  aCsv.href = csvUrl;
  aCsv.download = `leads-whatsapp-cyber-${dateTag}.csv`;
  document.body.appendChild(aCsv);
  aCsv.click();
  aCsv.remove();

  // 5. Faz download do JSON (para importar no ERP Cyber ou script Node)
  const jsonBlob = new Blob([JSON.stringify(results, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const jsonUrl = URL.createObjectURL(jsonBlob);
  const aJson = document.createElement('a');
  aJson.href = jsonUrl;
  aJson.download = `leads-whatsapp-cyber-${dateTag}.json`;
  document.body.appendChild(aJson);
  aJson.click();
  aJson.remove();

  return results;
})();
