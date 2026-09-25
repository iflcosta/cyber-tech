#!/usr/bin/env node
/**
 * ============================================================================
 * CONSOLIDADOR E HIGIENIZADOR DE LEADS WHATSAPP / VCARD / CSV — CYBER TI
 * ============================================================================
 *
 * Uso:
 *   node tools/whatsapp-leads/consolidate-leads.mjs <arquivo1.csv|json|vcf> [arquivo2...]
 *
 * O que faz:
 *   - Lê arquivos .json ou .csv gerados pelo `extract-whatsapp-web.js`,
 *     CSV do Google Contacts ou .vcf exportado da agenda do celular da loja.
 *   - Normaliza todos os telefones para o padrão brasileiro (DDI 55 + DDD + número).
 *   - Remove duplicados mantendo o registro mais rico (nome salvo > nome perfil).
 *   - Classifica automaticamente entre "Empresa / B2B" e "Cliente / Residencial"
 *     para segmentar a oferta do novo serviço de Suporte em TI.
 *   - Gera `tools/whatsapp-leads/output/leads-consolidados-ti.csv` e `.json`.
 */

import fs from 'node:fs';
import path from 'node:path';

const B2B_REGEX =
  /\b(ltda|me\b|eireli|s\/a|comercio|comércio|servicos|serviços|loja|assistencia|assistência|informatica|informática|tech|cell|celulares|escritorio|escritório|clinica|clínica|advocacia|contabilidade|engenharia|consultoria|mercado|auto|oficina|studio|estúdio|escola|colegio|colégio|imobiliaria|imobiliária|farmacia|farmácia|ótica|otica|padaria|restaurante|hotel|pousada|transportes|logistica|logística|odontologia|dentista|médico|medico|arquitetura|construtora)\b/i;

export function normalizePhoneBR(raw) {
  if (!raw) return null;
  let digits = String(raw).split('@')[0].replace(/\D/g, '');
  digits = digits.replace(/^0+/, '');
  if (!digits) return null;

  // Se tiver 10 ou 11 dígitos (DDD + número sem DDI 55), prefixa 55
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  if (digits.length < 12 || digits.length > 15) {
    return null;
  }
  return digits;
}

export function formatPhoneBR(digits) {
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return `+${digits}`;
}

function parseVCard(content) {
  const results = [];
  const cards = content.split(/BEGIN:VCARD/i).slice(1);
  for (const card of cards) {
    const fnMatch = card.match(/^FN(?:;[^:]*)?:(.+)$/im);
    const nMatch = card.match(/^N(?:;[^:]*)?:([^;]+);([^;]*)/im);
    const name = (fnMatch?.[1] || [nMatch?.[2], nMatch?.[1]].filter(Boolean).join(' ') || '').trim();
    const telMatches = [...card.matchAll(/^TEL(?:;[^:]*)?:(.+)$/gim)];
    for (const tm of telMatches) {
      results.push({
        name,
        phone: tm[1].trim(),
        source: 'vcard_agenda',
      });
    }
  }
  return results;
}

function parseCSV(content) {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const splitRow = (row) =>
    row
      .split(sep)
      .map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = headers.findIndex((h) =>
    ['nome', 'name', 'first name', 'given name', 'cliente'].some((k) => h.includes(k)),
  );
  const phoneIdx = headers.findIndex((h) =>
    ['telefone', 'phone', 'celular', 'whatsapp', 'mobile', 'tel'].some((k) => h.includes(k)),
  );

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
    const phone = phoneIdx >= 0 ? cols[phoneIdx] : cols[1];
    if (phone) {
      results.push({ name: name || '', phone, source: 'csv_import' });
    }
  }
  return results;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Uso: node tools/whatsapp-leads/consolidate-leads.mjs <arquivo1.json|csv|vcf> [arquivo2...]');
    process.exit(0);
  }

  const map = new Map();

  for (const fileArg of args) {
    const abs = path.resolve(fileArg);
    if (!fs.existsSync(abs)) {
      console.warn(`Arquivo não encontrado: ${abs}`);
      continue;
    }
    const raw = fs.readFileSync(abs, 'utf8');
    const ext = path.extname(abs).toLowerCase();

    let records = [];
    if (ext === '.json') {
      const parsed = JSON.parse(raw);
      records = Array.isArray(parsed) ? parsed : [];
    } else if (ext === '.vcf') {
      records = parseVCard(raw);
    } else {
      records = parseCSV(raw);
    }

    for (const r of records) {
      const phone = normalizePhoneBR(r.phone || r.Telefone_E164 || r.phoneFormatted);
      if (!phone) continue;

      const name = String(r.name || r.Nome || r.savedName || r.pushName || '').trim();
      const existing = map.get(phone);
      const isB2B = B2B_REGEX.test(name) || r.segment === 'Empresa / B2B';

      if (!existing) {
        map.set(phone, {
          name: name || `Contato ${formatPhoneBR(phone)}`,
          phone,
          phoneFormatted: formatPhoneBR(phone),
          segment: isB2B ? 'Empresa / B2B' : 'Cliente / Residencial',
          source: r.source || path.basename(abs),
          lastInteraction: r.lastInteraction || '',
        });
      } else {
        if (name && (existing.name.startsWith('Contato ') || name.length > existing.name.length)) {
          existing.name = name;
        }
        if (isB2B) {
          existing.segment = 'Empresa / B2B';
        }
        if (r.lastInteraction && r.lastInteraction > existing.lastInteraction) {
          existing.lastInteraction = r.lastInteraction;
        }
      }
    }
  }

  const outDir = path.resolve('tools/whatsapp-leads/output');
  fs.mkdirSync(outDir, { recursive: true });

  const list = Array.from(map.values()).sort((a, b) => {
    if (a.segment !== b.segment) return a.segment === 'Empresa / B2B' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const csvPath = path.join(outDir, 'leads-consolidados-ti.csv');
  const jsonPath = path.join(outDir, 'leads-consolidados-ti.json');

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvContent =
    '\uFEFF' +
    [
      'Nome;Telefone_E164;Telefone_Formatado;Segmento;Ultima_Interacao;Origem',
      ...list.map((i) =>
        [
          esc(i.name),
          esc(i.phone),
          esc(i.phoneFormatted),
          esc(i.segment),
          esc(i.lastInteraction),
          esc(i.source),
        ].join(';'),
      ),
    ].join('\r\n');

  fs.writeFileSync(csvPath, csvContent, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf8');

  const b2bCount = list.filter((i) => i.segment === 'Empresa / B2B').length;
  console.log(`\n✅ Consolidação concluída!`);
  console.log(`   Total de contatos únicos: ${list.length}`);
  console.log(`   Empresas / B2B detectados: ${b2bCount}`);
  console.log(`   Clientes / Residencial:    ${list.length - b2bCount}`);
  console.log(`\n📄 Arquivos salvos em:`);
  console.log(`   - ${csvPath}`);
  console.log(`   - ${jsonPath}\n`);
}

main();
