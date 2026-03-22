import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const BG_IMAGE = 'https://images.unsplash.com/photo-1771014846919-3a1cf73aeea1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBwYyUyMHJnYiUyMGRhcmslMjBwcmVtaXVtfGVufDF8fHx8MTc3NDIxMTA4Mnww&ixlib=rb-4.1.0&q=80&w=1080';

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
    try {
        const css = await fetch(
            `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } }
        ).then(r => r.text());
        const url = css.match(/src: url\(([^)]+)\) format\('woff2'\)/)?.[1];
        if (!url) return null;
        return fetch(url).then(r => r.arrayBuffer());
    } catch {
        return null;
    }
}

const TAGS = [
    { id: '01', label: 'PC GAMER' },
    { id: '02', label: 'MANUTENÇÃO' },
    { id: '03', label: 'SMARTPHONE' },
];

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const title = searchParams.get('title');
        const price = searchParams.get('price');
        const category = searchParams.get('category');

        const [rajdhaniBold, jetbrainsMono] = await Promise.all([
            loadFont('Rajdhani', 700),
            loadFont('JetBrains+Mono', 400),
        ]);

        const fonts: any[] = [];
        if (rajdhaniBold) fonts.push({ name: 'Rajdhani', data: rajdhaniBold, weight: 700 });
        if (jetbrainsMono) fonts.push({ name: 'JetBrains Mono', data: jetbrainsMono, weight: 400 });

        const R = 'Rajdhani';
        const M = 'JetBrains Mono';

        // ── BRAND MODE ──────────────────────────────────────────────────────────
        const brandImage = (
            <div style={{ width: 1200, height: 630, background: '#0d0d11', display: 'flex', position: 'relative', overflow: 'hidden' }}>

                {/* Background: gaming PC image (right 60%) */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', display: 'flex' }}>
                    <img src={BG_IMAGE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                    {/* Gradient: left fade */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0d0d11 0%, rgba(13,13,17,0.8) 40%, transparent 100%)', display: 'flex' }} />
                    {/* Gradient: bottom fade */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d11 0%, rgba(13,13,17,0.2) 40%, transparent 100%)', display: 'flex' }} />
                </div>

                {/* Red radial glow bottom-left */}
                <div style={{ position: 'absolute', bottom: '-30%', left: '-10%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.12) 0%, rgba(13,13,17,0) 65%)', display: 'flex' }} />

                {/* Foreground content */}
                <div style={{ position: 'absolute', inset: 0, padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                    {/* Top: location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 2, background: '#E53935', display: 'flex' }} />
                        <span style={{ fontFamily: M, fontWeight: 400, fontSize: 12, color: '#E53935', letterSpacing: '0.4em' }}>
                            BRAGANÇA PAULISTA · SP
                        </span>
                    </div>

                    {/* Center: logo */}
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%', paddingLeft: 44, position: 'relative' }}>
                        {/* Red accent bar */}
                        <div style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 6, background: '#E53935', display: 'flex' }} />

                        <span style={{ fontFamily: R, fontWeight: 700, fontSize: 160, lineHeight: 0.8, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                            cyber
                        </span>
                        <span style={{ fontFamily: M, fontWeight: 400, fontSize: 36, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
                            informática
                        </span>
                    </div>

                    {/* Bottom: tags + url */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32, position: 'relative' }}>
                        {/* Corner markers */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 8, background: 'rgba(255,255,255,0.3)', display: 'flex' }} />
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: 8, background: 'rgba(255,255,255,0.3)', display: 'flex' }} />

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: 20 }}>
                            {TAGS.map(tag => (
                                <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)', paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, background: 'rgba(13,13,17,0.8)', position: 'relative' }}>
                                    {/* Left red accent bar on tag */}
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#E53935', display: 'flex' }} />
                                    <span style={{ fontFamily: M, fontWeight: 400, fontSize: 10, color: '#E53935', opacity: 0.8 }}>
                                        // {tag.id}
                                    </span>
                                    <span style={{ fontFamily: M, fontWeight: 400, fontSize: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em' }}>
                                        {tag.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* URL */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingRight: 8, paddingBottom: 4 }}>
                            <div style={{ width: 30, height: 1, background: 'rgba(229,57,53,0.5)', display: 'flex' }} />
                            <span style={{ fontFamily: M, fontWeight: 400, fontSize: 14, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
                                cyberinformatica.tech
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        );

        // ── PRODUCT MODE ────────────────────────────────────────────────────────
        const productImage = title ? (
            <div style={{ width: 1200, height: 630, background: '#0d0d11', display: 'flex', position: 'relative', overflow: 'hidden' }}>

                {/* Background image */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', display: 'flex' }}>
                    <img src={BG_IMAGE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0d0d11 0%, rgba(13,13,17,0.85) 50%, transparent 100%)', display: 'flex' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d11 0%, rgba(13,13,17,0.2) 50%, transparent 100%)', display: 'flex' }} />
                </div>

                {/* Red glow */}
                <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,57,53,0.12) 0%, transparent 65%)', display: 'flex' }} />

                <div style={{ position: 'absolute', inset: 0, padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Top */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 2, background: '#E53935', display: 'flex' }} />
                        <span style={{ fontFamily: M, fontWeight: 400, fontSize: 12, color: '#E53935', letterSpacing: '0.4em' }}>
                            BRAGANÇA PAULISTA · SP
                        </span>
                    </div>

                    {/* Center */}
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '65%', paddingLeft: 44, position: 'relative', gap: 16 }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: '#E53935', display: 'flex' }} />
                        {category && (
                            <span style={{ fontFamily: M, fontWeight: 400, fontSize: 11, color: '#E53935', letterSpacing: '0.3em', opacity: 0.8 }}>
                                // {category.toUpperCase()}
                            </span>
                        )}
                        <span style={{ fontFamily: R, fontWeight: 700, fontSize: title.length > 25 ? 60 : 76, lineHeight: 0.9, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                            {title}
                        </span>
                        {price && (
                            <span style={{ fontFamily: R, fontWeight: 700, fontSize: 48, color: '#E53935', letterSpacing: '-0.01em' }}>
                                R$ {price}
                            </span>
                        )}
                    </div>

                    {/* Bottom */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 32 }}>
                        <div style={{ display: 'flex', gap: 20 }}>
                            {TAGS.map(tag => (
                                <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.1)', paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, background: 'rgba(13,13,17,0.8)', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#E53935', display: 'flex' }} />
                                    <span style={{ fontFamily: M, fontWeight: 400, fontSize: 10, color: '#E53935', opacity: 0.8 }}>// {tag.id}</span>
                                    <span style={{ fontFamily: M, fontWeight: 400, fontSize: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em' }}>{tag.label}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingRight: 8, paddingBottom: 4 }}>
                            <div style={{ width: 30, height: 1, background: 'rgba(229,57,53,0.5)', display: 'flex' }} />
                            <span style={{ fontFamily: M, fontWeight: 400, fontSize: 14, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>cyberinformatica.tech</span>
                        </div>
                    </div>
                </div>
            </div>
        ) : null;

        return new ImageResponse(
            title ? productImage! : brandImage,
            { width: 1200, height: 630, fonts }
        );

    } catch (err) {
        console.error('[OG] Error:', err);
        return new Response('Error generating image: ' + String(err), { status: 500 });
    }
}
