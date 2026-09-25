#!/usr/bin/env node
/**
 * ============================================================================
 * EXPORTADOR DE LEADS DO BANCO SUPABASE (ERP CYBER) -> CSV / JSON
 * ============================================================================
 *
 * Uso:
 *   node --env-file=.env.local tools/whatsapp-leads/fetch-erp-leads.mjs
 *
 * Busca todos os clientes de OS, vendas avulsas do PDV e leads do site
 * direto do Supabase e salva em `tools/whatsapp-leads/output/leads-erp.json`
 * e `leads-erp.csv`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizePhoneBR, formatPhoneBR } from './consolidate-leads.mjs';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
  const serviceKey =
    process.env.SUPABASE_CRM_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      '❌ Defina NEXT_PUBLIC_SUPABASE_CRM_URL e SUPABASE_CRM_SERVICE_ROLE_KEY no .env.local',
    );
    process.exit(1);
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  const [customersRes, salesRes, leadsRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/customers?select=id,name,phone,email`, { headers }),
    fetch(
      `${supabaseUrl}/rest/v1/sales?select=customer_name,customer_phone&voided_at=is.null`,
      { headers },
    ),
    fetch(`${supabaseUrl}/rest/v1/contact_leads?select=name,phone,email,type`, { headers }),
  ]);

  const customers = (await customersRes.json()) || [];
  const sales = (await salesRes.json()) || [];
  const siteLeads = (await leadsRes.json()) || [];

  const map = new Map();

  for (const c of customers) {
    const phone = normalizePhoneBR(c.phone);
    if (!phone) continue;
    map.set(phone, {
      name: c.name,
      phone,
      phoneFormatted: formatPhoneBR(phone),
      email: c.email || '',
      source: 'erp_customers',
    });
  }

  for (const s of sales) {
    const phone = normalizePhoneBR(s.customer_phone);
    if (!phone || map.has(phone)) continue;
    map.set(phone, {
      name: s.customer_name || 'Cliente PDV',
      phone,
      phoneFormatted: formatPhoneBR(phone),
      email: '',
      source: 'erp_sales',
    });
  }

  for (const l of siteLeads) {
    const phone = normalizePhoneBR(l.phone);
    if (!phone || map.has(phone)) continue;
    map.set(phone, {
      name: l.name,
      phone,
      phoneFormatted: formatPhoneBR(phone),
      email: l.email || '',
      source: `site_${l.type || 'lead'}`,
    });
  }

  const outDir = path.resolve('tools/whatsapp-leads/output');
  fs.mkdirSync(outDir, { recursive: true });

  const list = Array.from(map.values());
  const jsonPath = path.join(outDir, 'leads-erp.json');
  const csvPath = path.join(outDir, 'leads-erp.csv');

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv =
    '\uFEFF' +
    [
      'Nome;Telefone_E164;Telefone_Formatado;Email;Origem',
      ...list.map((i) =>
        [esc(i.name), esc(i.phone), esc(i.phoneFormatted), esc(i.email), esc(i.source)].join(';'),
      ),
    ].join('\r\n');

  fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf8');
  fs.writeFileSync(csvPath, csv, 'utf8');

  console.log(`✅ ${list.length} contatos do ERP exportados para ${csvPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
