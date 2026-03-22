import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const title = searchParams.get('title') ?? 'cyber';

        return new ImageResponse(
            <div
                style={{
                    width: 1200,
                    height: 630,
                    backgroundColor: '#0d0d11',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                }}
            >
                <div style={{ width: 40, height: 4, backgroundColor: '#E53935', display: 'flex' }} />
                <span style={{ fontSize: 120, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    {title}
                </span>
                <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>
                    cyberinformatica.tech
                </span>
            </div>,
            { width: 1200, height: 630 }
        );
    } catch (err) {
        return new Response('OG Error: ' + String(err), { status: 500 });
    }
}
