import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { WhatsAppLeadsClient, type InitialERPLead } from './WhatsAppLeadsClient';

export const dynamic = 'force-dynamic';

export default async function ClientesLeadsPage() {
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const [
    { data: customers },
    { data: osRows },
    { data: salesRows },
    { data: siteLeads },
  ] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .order('name'),
    supabase
      .from('service_orders')
      .select('customer_id, equipment_type'),
    supabase
      .from('sales')
      .select('customer_id, customer_name, customer_phone')
      .is('voided_at', null),
    supabase
      .from('contact_leads')
      .select('name, phone, email, type, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const osCountByCustomer = new Map<string, number>();
  for (const r of osRows ?? []) {
    if (r.customer_id) {
      osCountByCustomer.set(r.customer_id, (osCountByCustomer.get(r.customer_id) ?? 0) + 1);
    }
  }

  const salesCountByCustomer = new Map<string, number>();
  for (const r of salesRows ?? []) {
    if (r.customer_id) {
      salesCountByCustomer.set(r.customer_id, (salesCountByCustomer.get(r.customer_id) ?? 0) + 1);
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

  // Vendas avulsas no PDV que tinham telefone digitado mas sem customer_id
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

  // Leads do formulário de contato do site público
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/clientes" className="text-sm text-zinc-600 hover:text-black">
            ← Voltar para Clientes
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-zinc-950">
            Central de Leads & Extração WhatsApp (Suporte em TI)
          </h1>
          <p className="text-sm text-zinc-600">
            Extraia todos os contatos do WhatsApp da loja, unifique com o banco do ERP e dispare sua campanha de Suporte em TI.
          </p>
        </div>
      </div>

      <WhatsAppLeadsClient initialLeads={initialLeads} currentUserId={user.id} />
    </div>
  );
}
