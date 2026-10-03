import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

function maskPhoneNumbers(text: string): string {
  if (!text) return text;
  return text.replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}/g, (match) => {
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 8) {
      const last4 = digits.slice(-4);
      return `(••) •••••-${last4}`;
    }
    return match;
  });
}

function sanitizeTrackingPayload(data: Record<string, unknown>) {
  if (!data) return data;
  const sanitized = { ...data };

  if (Array.isArray(sanitized.timeline)) {
    sanitized.timeline = (sanitized.timeline as Array<Record<string, unknown>>).map((event) => {
      if (!event) return event;
      const ev = { ...event };
      if (typeof ev.note === 'string') {
        ev.note = maskPhoneNumbers(ev.note);
      }
      if (ev.payload && typeof (ev.payload as Record<string, unknown>).note === 'string') {
        ev.payload = {
          ...(ev.payload as Record<string, unknown>),
          note: maskPhoneNumbers((ev.payload as Record<string, unknown>).note as string),
        };
      }
      return ev;
    });
  }

  if (typeof sanitized.repair_notes === 'string') {
    sanitized.repair_notes = maskPhoneNumbers(sanitized.repair_notes);
  }

  return sanitized;
}

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = (forwardedFor ? forwardedFor.split(',')[0] : request.headers.get('x-real-ip') || '127.0.0.1').trim();

    // Proteção contra brute force / enumeração de OSs públicas
    const rl = await checkRateLimit(ip, { max: 20, windowMs: 60_000, prefix: 'track' });
    if (rl.limited) {
      return NextResponse.json(
        { found: false, error: 'Muitas consultas recentes. Por favor, aguarde um momento antes de tentar novamente.' },
        {
          status: 429,
          headers: {
            ...NO_CACHE_HEADERS,
            'Retry-After': String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (
      searchParams.get('q') ||
      searchParams.get('os') ||
      searchParams.get('code') ||
      searchParams.get('id') ||
      ''
    ).trim();
    const phone = searchParams.get('phone')?.trim() ?? '';

    if (!query && !phone) {
      return NextResponse.json(
        { found: false, error: 'Informe o número da OS ou telefone para consulta.' },
        { status: 400, headers: NO_CACHE_HEADERS }
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
          return NextResponse.json(sanitizeTrackingPayload(rpcData), { headers: NO_CACHE_HEADERS });
        }

        // 2. Consulta direta na tabela service_orders (fallback seguro caso RPC não retorne)
        const cleanQuery = query.replace(/^#/, '').trim();
        const noPrefix = cleanQuery.replace(/^OS-?/i, '').trim();

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
            equipment_color,
            equipment_serial,
            reported_defect,
            repair_notes,
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

        if (cleanQuery) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
          if (isUUID) {
            soQuery = soQuery.eq('id', cleanQuery);
          } else {
            soQuery = soQuery.or(
              `os_number.ilike.${cleanQuery},os_number.ilike.OS-${noPrefix},short_id.ilike.${cleanQuery},short_id.ilike.OS-${noPrefix}`,
            );
          }
        } else if (phone) {
          const digitsOnly = phone.replace(/\D/g, '');
          if (digitsOnly.length >= 8) {
            const { data: matchedCustomers } = await client
              .from('customers')
              .select('id')
              .or(`phone_search.ilike.%${digitsOnly}%,phone.ilike.%${digitsOnly}%`)
              .limit(5);

            const customerIds = (matchedCustomers || []).map((c: { id: string }) => c.id);
            if (customerIds.length === 0) {
              return NextResponse.json(
                { found: false, error: 'Nenhuma Ordem de Serviço encontrada para este telefone.' },
                { status: 404, headers: NO_CACHE_HEADERS }
              );
            }
            soQuery = soQuery.in('customer_id', customerIds);
          } else {
            return NextResponse.json(
              { found: false, error: 'Informe um número de telefone com DDD válido.' },
              { status: 400, headers: NO_CACHE_HEADERS }
            );
          }
        } else {
          return NextResponse.json(
            { found: false, error: 'Informe o número da OS ou telefone para consulta.' },
            { status: 400, headers: NO_CACHE_HEADERS }
          );
        }

        const { data: orders } = await soQuery;
        if (orders && orders.length > 0) {
          return NextResponse.json(sanitizeTrackingPayload(formatSafeOS(orders[0])), { headers: NO_CACHE_HEADERS });
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
      { status: 404, headers: NO_CACHE_HEADERS }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao consultar OS.';
    return NextResponse.json({ found: false, error: message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

function formatSafeOS(
  so: Record<string, unknown> & {
    customer?: { name?: string } | Array<{ name?: string }> | null;
  },
) {
  const custObj = Array.isArray(so.customer) ? so.customer[0] : so.customer;
  const customerName = custObj?.name ?? 'Cliente';
  const firstName = customerName.split(' ')[0] || 'Cliente';

  return {
    found: true,
    id: so.id,
    short_id: so.short_id || `CYB-${String(so.id).slice(0, 6).toUpperCase()}`,
    os_number: so.os_number,
    status: so.status,
    equipment_type: so.equipment_type,
    equipment_brand: so.equipment_brand || '',
    equipment_model: so.equipment_model || '',
    equipment_color: so.equipment_color || null,
    equipment_serial: so.equipment_serial || null,
    reported_defect: so.reported_defect,
    repair_notes: so.repair_notes || null,
    accessories_in: so.accessories_in,
    entry_checklist: so.entry_checklist || {},
    equipment_photos: so.equipment_photos || [],
    estimated_value: Number(so.estimated_value || 0),
    labor_cost: Number(so.labor_cost || 0),
    parts_total: 0,
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
