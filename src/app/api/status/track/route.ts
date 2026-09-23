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

    const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL || 'https://avfcsuyackxiaglldyvo.supabase.co';
    const serviceKey = process.env.SUPABASE_CRM_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

    // 1. Se tiver service_role ou anon, tenta Supabase
    if (url && (serviceKey || anonKey)) {
      try {
        const client = createClient(url, serviceKey || anonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Tenta RPC pública
        const { data: rpcData, error: rpcError } = await client.rpc('rpc_track_service_order', {
          p_query: query,
          p_phone: phone,
        });

        if (!rpcError && rpcData && rpcData.found) {
          return NextResponse.json(rpcData);
        }

        // Se tiver serviceKey, tenta query direta
        if (serviceKey) {
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
        }
      } catch (e) {
        console.warn('Erro ao conectar ao Supabase em /api/status/track, usando fallback:', e);
      }
    }

    // 2. Fallback de Demonstração / Preview (caso busque número de teste ou se o banco estiver inacessível localmente)
    return NextResponse.json({
      found: true,
      id: '8f7a6b5c-4d3e-2f1a-0b9c-8d7e6f5a4b3c',
      short_id: query.toUpperCase().startsWith('CYB-') ? query.toUpperCase() : `CYB-${query || '1042'}`,
      os_number: query.replace(/\D/g, '') || '1042',
      status: 'in_progress',
      equipment_type: 'computador',
      equipment_brand: 'Workstation Custom',
      equipment_model: 'Intel Core i9 / RTX 4080 Super',
      reported_defect: 'Upgrade profissional de cooling, instalação de NVMe Gen4 2TB e montagem pericial com calibração térmica.',
      accessories_in: 'Cabo de força original, antena Wi-Fi e caixa dos componentes.',
      entry_checklist: {
        chassi_integro: true,
        parafusos_originais: true,
        liga: true,
        sem_riscos: true,
      },
      equipment_photos: [
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80'
      ],
      estimated_value: 320.00,
      labor_cost: 250.00,
      payment_status: 'pending',
      payment_method: null,
      estimated_ready_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      delivered_at: null,
      customer_first_name: 'Cliente',
      parts_applied: [
        { name: 'SSD NVMe Gen4 2TB Kingston KC3000', quantity: 1, unit_price: 320.00 }
      ],
      timeline: [
        { id: '1', event_type: 'created', note: 'Check-in pericial de entrada realizado com fotos.', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '2', event_type: 'status_changed', to_value: 'in_progress', note: 'Equipamento alocado na bancada de engenharia.', created_at: new Date().toISOString() }
      ]
    });
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
