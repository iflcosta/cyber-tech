import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Fallback em memória para garantir funcionamento 100% mesmo em ambiente
 * local/dev antes da aplicação da migration 0036 no banco remoto.
 */
type SyncSessionState = {
  session_token: string;
  photos: string[];
  status: 'active' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
};

const memorySessions = new Map<string, SyncSessionState>();

function getSupabaseServiceOrAnon() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_CRM_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_CRM_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token || token.length < 6) {
    return NextResponse.json(
      { error: 'Token de sessão inválido.' },
      { status: 400 },
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
          photos: Array.isArray(data.photos) ? data.photos : [],
          status: data.status ?? 'active',
          created_at: data.created_at,
          updated_at: data.updated_at,
          expires_at: data.expires_at,
        };
        memorySessions.set(token, session);
        return NextResponse.json(session);
      }
    } catch {
      // Fallback silencioso para memória se tabela ainda não existir no remoto
    }
  }

  const mem = memorySessions.get(token);
  if (mem) {
    return NextResponse.json(mem);
  }

  // Se ainda não foi inicializada, cria sessão ativa automaticamente
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 60 * 1000);
  const initial: SyncSessionState = {
    session_token: token,
    photos: [],
    status: 'active',
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
  memorySessions.set(token, initial);
  return NextResponse.json(initial);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const action = typeof body.action === 'string' ? body.action : 'init';

    if (!token || token.length < 6) {
      return NextResponse.json(
        { error: 'Token de sessão inválido.' },
        { status: 400 },
      );
    }

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000);

    // Recupera estado atual (Banco ou Memória)
    let current: SyncSessionState = memorySessions.get(token) ?? {
      session_token: token,
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

    if (action === 'add_photo' && typeof body.photoUrl === 'string' && body.photoUrl.trim()) {
      const url = body.photoUrl.trim();
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
    }

    memorySessions.set(token, current);

    if (supabase) {
      try {
        await supabase.from('camera_sync_sessions').upsert(
          {
            session_token: current.session_token,
            photos: current.photos,
            status: current.status,
            updated_at: current.updated_at,
            expires_at: current.expires_at,
          },
          { onConflict: 'session_token' },
        );
      } catch {
        // Ignora erro caso a tabela ainda não tenha sido migrada no ambiente remoto
      }
    }

    return NextResponse.json(current);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Erro ao processar sessão de câmera.' },
      { status: 500 },
    );
  }
}
