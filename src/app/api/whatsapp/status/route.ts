import { NextResponse } from 'next/server';

const VPS_URL = process.env.CYBER_VPS_WA_URL || 'http://148.113.247.44:8085';
const VPS_API_KEY = process.env.CYBER_VPS_WA_KEY || 'cyber_wa_sec_2026_braganca_ifl';
const INSTANCE_NAME = process.env.CYBER_VPS_WA_INSTANCE || 'cyber-loja';

export async function GET() {
  try {
    const res = await fetch(`${VPS_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      headers: {
        apikey: VPS_API_KEY,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        error: `VPS retornou status ${res.status}`,
      });
    }

    const data = await res.json();
    const state = data?.instance?.state || data?.state || 'close';

    return NextResponse.json({
      connected: state === 'open',
      status: state,
      instance: INSTANCE_NAME,
      vpsHost: '148.113.247.44:8085',
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      status: 'error',
      error: (err as Error).message,
    });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();

    if (action === 'connect') {
      const res = await fetch(`${VPS_URL}/instance/connect/${INSTANCE_NAME}`, {
        headers: {
          apikey: VPS_API_KEY,
        },
        cache: 'no-store',
      });

      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'restart') {
      const res = await fetch(`${VPS_URL}/instance/restart/${INSTANCE_NAME}`, {
        method: 'PUT',
        headers: {
          apikey: VPS_API_KEY,
        },
      });

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
