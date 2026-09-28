import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Fallback em memória para garantir funcionamento 100% mesmo em ambiente
 * local/dev de testes unitários sem variáveis de banco.
 */
type SyncSessionState = {
  session_token: string;
  os_id?: string | null;
  photos: string[];
  status: 'active' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
};

const memorySessions = new Map<string, SyncSessionState>();

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

function getSupabaseServiceOrAnon() {
  const crmUrl = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
  const crmKey =
    process.env.SUPABASE_CRM_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY;

  if (crmUrl && crmKey) {
    return createClient(crmUrl, crmKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  const fallbackUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const fallbackKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!fallbackUrl || !fallbackKey) return null;
  return createClient(fallbackUrl, fallbackKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureStorageUrlIfDataUri(
  supabase: ReturnType<typeof getSupabaseServiceOrAnon>,
  token: string,
  photoUrl: string,
): Promise<string> {
  if (!supabase || !photoUrl.startsWith('data:image/')) {
    return photoUrl;
  }
  try {
    const match = photoUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return photoUrl;
    const contentType = match[1] || 'image/jpeg';
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
    const storagePath = `sync-${safeToken}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;

    const { error: upErr } = await supabase.storage
      .from('equipment-photos')
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (!upErr) {
      const { data: pub } = supabase.storage
        .from('equipment-photos')
        .getPublicUrl(storagePath);
      if (pub?.publicUrl) {
        return pub.publicUrl;
      }
    }
  } catch {
    // Se falhar conversão, preserva dataUrl como fallback
  }
  return photoUrl;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token || token.length < 6) {
    return NextResponse.json(
      { error: 'Token de sessão inválido.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const supabase = getSupabaseServiceOrAnon();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('camera_sync_sessions')
        .select('*')
        .eq('session_token', token)
        .maybeSingle();

      if (!error && data) {
        const session: SyncSessionState = {
          session_token: data.session_token,
          os_id: data.os_id ?? null,
          photos: Array.isArray(data.photos) ? data.photos : [],
          status: data.status ?? 'active',
          created_at: data.created_at,
          updated_at: data.updated_at,
          expires_at: data.expires_at,
        };
        memorySessions.set(token, session);
        return NextResponse.json(session, { headers: NO_STORE_HEADERS });
      }
    } catch {
      // Fallback silencioso para memória se tabela não estiver acessível
    }
  }

  const mem = memorySessions.get(token);
  if (mem) {
    return NextResponse.json(mem, { headers: NO_STORE_HEADERS });
  }

  // Se ainda não foi inicializada, cria sessão ativa automaticamente
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 60 * 1000);
  const initial: SyncSessionState = {
    session_token: token,
    os_id: null,
    photos: [],
    status: 'active',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  memorySessions.set(token, initial);

  if (supabase) {
    try {
      await supabase.from('camera_sync_sessions').upsert(
        {
          session_token: initial.session_token,
          photos: initial.photos,
          status: initial.status,
          updated_at: initial.updated_at,
          expires_at: initial.expires_at,
        },
        { onConflict: 'session_token' },
      );
    } catch {
      // Ignora erro em ambiente de teste offline
    }
  }

  return NextResponse.json(initial, { headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const action = typeof body.action === 'string' ? body.action : 'init';
    const incomingOsId =
      typeof body.osId === 'string' && body.osId.trim().length > 0
        ? body.osId.trim()
        : undefined;

    if (!token || token.length < 6) {
      return NextResponse.json(
        { error: 'Token de sessão inválido.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000);

    // Recupera estado atual (Banco ou Memória)
    let current: SyncSessionState = memorySessions.get(token) ?? {
      session_token: token,
      os_id: incomingOsId ?? null,
      photos: [],
      status: 'active',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };

    const supabase = getSupabaseServiceOrAnon();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('camera_sync_sessions')
          .select('*')
          .eq('session_token', token)
          .maybeSingle();

        if (data) {
          current = {
            session_token: data.session_token,
            os_id: incomingOsId ?? data.os_id ?? current.os_id ?? null,
            photos: Array.isArray(data.photos) ? data.photos : [],
            status: data.status ?? 'active',
            created_at: data.created_at,
            updated_at: data.updated_at,
            expires_at: data.expires_at,
          };
        }
      } catch {
        // Continua com memória
      }
    }

    if (incomingOsId) {
      current.os_id = incomingOsId;
    }

    if (action === 'add_photo' && typeof body.photoUrl === 'string' && body.photoUrl.trim()) {
      const rawUrl = body.photoUrl.trim();
      const url = await ensureStorageUrlIfDataUri(supabase, token, rawUrl);
      if (!current.photos.includes(url)) {
        current.photos = [...current.photos, url];
      }
      current.updated_at = now.toISOString();
    } else if (action === 'remove_photo' && typeof body.photoUrl === 'string') {
      current.photos = current.photos.filter((p) => p !== body.photoUrl);
      current.updated_at = now.toISOString();
    } else if (action === 'complete') {
      current.status = 'completed';
      current.updated_at = now.toISOString();
    } else if (action === 'link_os' && incomingOsId) {
      current.os_id = incomingOsId;
      current.updated_at = now.toISOString();
    }

    memorySessions.set(token, current);

    if (supabase) {
      try {
        const payload: Record<string, unknown> = {
          session_token: current.session_token,
          photos: current.photos,
          status: current.status,
          updated_at: current.updated_at,
          expires_at: current.expires_at,
        };
        if (current.os_id) {
          payload.os_id = current.os_id;
        }
        await supabase
          .from('camera_sync_sessions')
          .upsert(payload, { onConflict: 'session_token' });
      } catch {
        // Ignora erro em ambiente de teste offline
      }
    }

    return NextResponse.json(current, { headers: NO_STORE_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Erro ao processar sessão de câmera.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

