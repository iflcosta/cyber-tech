import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedProfile, isIagoUser } from '@/app/admin/lib/auth';
import {
  WhatsAppLeadsClient,
  type InitialERPLead,
  type PreloadedWhatsAppLead,
  type LeadStatus,
} from './WhatsAppLeadsClient';

export const dynamic = 'force-dynamic';

export default async function ClientesLeadsPage() {
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) redirect('/admin/login');
  // Aba exclusiva para o Iago (Desenvolvimento & Marketing da Cyber)
  if (!isIagoUser(user, profile)) {
    redirect('/admin/os');
  }

  const [
    { data: customers },
    { data: osRows },
    { data: salesRows },
    { data: siteLeads },
    { data: crmLeads },
  ] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .order('name'),
    supabase.from('service_orders').select('customer_id, equipment_type'),
    supabase
      .from('sales')
      .select('customer_id, customer_name, customer_phone')
      .is('voided_at', null),
    supabase
      .from('contact_leads')
      .select('name, phone, email, type, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('it_support_leads')
      .select(
        'phone_e164, name, segment, niche, status, notes, last_contacted_at, is_hot_lead, has_direct_chat, is_address_book, msgs_sent, msgs_received, last_chat_date',
      )
      .eq('is_address_book', false)
      .neq('phone_e164', '5511919691542'),
  ]);

  const osCountByCustomer = new Map<string, number>();
  for (const r of osRows ?? []) {
    if (r.customer_id) {
      osCountByCustomer.set(
        r.customer_id,
        (osCountByCustomer.get(r.customer_id) ?? 0) + 1,
      );
    }
  }

  const salesCountByCustomer = new Map<string, number>();
  for (const r of salesRows ?? []) {
    if (r.customer_id) {
      salesCountByCustomer.set(
        r.customer_id,
        (salesCountByCustomer.get(r.customer_id) ?? 0) + 1,
      );
    }
  }

  const initialLeads: InitialERPLead[] = [];

  for (const c of customers ?? []) {
    if (!c.phone) continue;
    initialLeads.push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      osCount: osCountByCustomer.get(c.id) ?? 0,
      salesCount: salesCountByCustomer.get(c.id) ?? 0,
      origin: 'erp_customer',
    });
  }

  for (const s of salesRows ?? []) {
    if (!s.customer_id && s.customer_phone) {
      initialLeads.push({
        id: null,
        name: s.customer_name || 'Cliente PDV',
        phone: s.customer_phone,
        email: null,
        osCount: 0,
        salesCount: 1,
        origin: 'erp_sale',
      });
    }
  }

  for (const l of siteLeads ?? []) {
    if (!l.phone) continue;
    initialLeads.push({
      id: null,
      name: l.name,
      phone: l.phone,
      email: l.email,
      osCount: 0,
      salesCount: 0,
      origin: l.type === 'lojista' ? 'site_b2b' : 'site_lead',
    });
  }

  // Mesclar leads do arquivo local (se existir) + registros salvos na tabela it_support_leads do Supabase
  const preloadedMap = new Map<string, PreloadedWhatsAppLead>();

  try {
    const jsonPath = path.join(
      process.cwd(),
      'tools',
      'whatsapp-leads',
      'output',
      'leads-whatsapp-nomeados.json',
    );
    if (fs.existsSync(jsonPath)) {
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          const p = String(item.phone || '');
          if (!p || p === '5511919691542' || p === '5511954369269' || item.isAddressBook) continue;
          preloadedMap.set(p, {
            name: String(item.name || ''),
            phone: p,
            segment: item.segment ? String(item.segment) : undefined,
            niche: item.niche ? String(item.niche) : undefined,
            status: 'novo',
            notes: null,
            lastContactedAt: null,
            isHotLead: Boolean(item.isHotLead),
            hasDirectChat: Boolean(item.hasDirectChat),
            isAddressBook: false,
            msgsSent: Number(item.msgsSent || 0),
            msgsReceived: Number(item.msgsReceived || 0),
            lastChatDate: item.lastChatDate ? String(item.lastChatDate) : null,
          });
        }
      }
    }
  } catch {
    // Ignorar se arquivo local não estiver disponível
  }

  for (const row of crmLeads ?? []) {
    if (row.is_address_book || row.phone_e164 === '5511919691542' || row.phone_e164 === '5511954369269') {
      continue;
    }
    const existing = preloadedMap.get(row.phone_e164);
    preloadedMap.set(row.phone_e164, {
      name: row.name || existing?.name || '',
      phone: row.phone_e164,
      segment:
        row.segment === 'b2b'
          ? 'Empresa / B2B'
          : existing?.segment || 'Cliente / Residencial',
      niche: row.niche || existing?.niche || 'residencial_pf',
      status: (row.status as LeadStatus) || 'novo',
      notes: row.notes ?? null,
      lastContactedAt: row.last_contacted_at ?? null,
      isHotLead: Boolean(row.is_hot_lead ?? existing?.isHotLead),
      hasDirectChat: Boolean(row.has_direct_chat ?? existing?.hasDirectChat),
      isAddressBook: false,
      msgsSent: Number(row.msgs_sent ?? existing?.msgsSent ?? 0),
      msgsReceived: Number(row.msgs_received ?? existing?.msgsReceived ?? 0),
      lastChatDate: row.last_chat_date ?? existing?.lastChatDate ?? null,
    });
  }

  const preloadedWhatsAppLeads = Array.from(preloadedMap.values());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/clientes"
            className="text-sm text-zinc-600 hover:text-black"
          >
            ← Voltar para Clientes
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-950">
              Central CRM de Leads Quentes, Pós-Venda & Suporte em TI
            </h1>
            <span className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-white">
              Exclusivo · Iago (Mkt & Dev)
            </span>
          </div>
          <p className="text-sm text-zinc-600">
            Base limpa do WhatsApp da loja (sem agenda pessoal): conversas 1-a-1
            reais e nomes extraídos dos perfis WhatsApp / WhatsApp Business.
          </p>
        </div>
      </div>

      <WhatsAppLeadsClient
        initialLeads={initialLeads}
        preloadedWhatsAppLeads={preloadedWhatsAppLeads}
        currentUserId={user.id}
      />
    </div>
  );
}
