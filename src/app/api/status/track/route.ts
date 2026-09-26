import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() ?? '';
    const phone = searchParams.get('phone')?.trim() ?? '';

    if (!query && !phone) {
      return NextResponse.json(
        { found: false, error: 'Informe o número da OS ou telefone para consulta.' },
        { status: 400 }
      );
    }

    const url =
      process.env.NEXT_PUBLIC_SUPABASE_CRM_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://avfcsuyackxiaglldyvo.supabase.co';
    const serviceKey = process.env.SUPABASE_CRM_SERVICE_ROLE_KEY;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && (serviceKey || anonKey)) {
      try {
        const client = createClient(url, serviceKey || anonKey!, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // 1. Tenta RPC pública de rastreio
        const { data: rpcData, error: rpcError } = await client.rpc('rpc_track_service_order', {
          p_query: query,
          p_phone: phone,
        });

        if (!rpcError && rpcData && rpcData.found) {
          return NextResponse.json(rpcData);
        }

        // 2. Consulta direta na tabela service_orders
        let soQuery = client
          .from('service_orders')
          .select(`
            id,
            short_id,
            os_number,
            status,
            equipment_type,
            equipment_brand,
            equipment_model,
            reported_defect,
            accessories_in,
            entry_checklist,
            equipment_photos,
            estimated_value,
            labor_cost,
            payment_status,
            payment_method,
            estimated_ready_at,
            created_at,
            updated_at,
            delivered_at,
            customer:customers(name, phone, phone_search)
          `)
          .order('created_at', { ascending: false })
          .limit(1);

        if (query) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
          if (isUUID) {
            soQuery = soQuery.eq('id', query);
          } else if (query.startsWith('#')) {
            soQuery = soQuery.eq('os_number', query.slice(1));
          } else if (/^\d+$/.test(query)) {
            soQuery = soQuery.or(`os_number.eq.${query},short_id.ilike.%${query}%`);
          } else {
            soQuery = soQuery.ilike('short_id', `%${query}%`);
          }
        }

        const { data: orders } = await soQuery;
        if (orders && orders.length > 0) {
          return NextResponse.json(formatSafeOS(orders[0]));
        }
      } catch (e) {
        console.warn('Erro ao consultar Supabase em /api/status/track:', e);
      }
    }

    return NextResponse.json(
      {
        found: false,
        error:
          'Nenhuma Ordem de Serviço encontrada com o número ou WhatsApp informado. Verifique o código no seu comprovante ou fale com nosso balcão.',
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao consultar OS.';
    return NextResponse.json({ found: false, error: message }, { status: 500 });
  }
}

function formatSafeOS(so: any) {
  const customerName = so.customer?.name ?? 'Cliente';
  const firstName = customerName.split(' ')[0] || 'Cliente';

  return {
    found: true,
    id: so.id,
    short_id: so.short_id || `CYB-${so.id.slice(0, 6).toUpperCase()}`,
    os_number: so.os_number,
    status: so.status,
    equipment_type: so.equipment_type,
    equipment_brand: so.equipment_brand || 'Equipamento',
    equipment_model: so.equipment_model || 'Hardware',
    reported_defect: so.reported_defect,
    accessories_in: so.accessories_in,
    entry_checklist: so.entry_checklist || {},
    equipment_photos: so.equipment_photos || [],
    estimated_value: Number(so.estimated_value || 0),
    labor_cost: Number(so.labor_cost || 0),
    payment_status: so.payment_status || 'pending',
    payment_method: so.payment_method,
    estimated_ready_at: so.estimated_ready_at,
    created_at: so.created_at,
    updated_at: so.updated_at,
    delivered_at: so.delivered_at,
    customer_first_name: firstName,
    timeline: [],
    parts_applied: [],
  };
}
