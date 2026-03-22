import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

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

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const title = searchParams.get('title');
        const price = searchParams.get('price');
        const category = searchParams.get('category');

        const [rajdhaniBold, dmSansBold] = await Promise.all([
            loadFont('Rajdhani', 700),
            loadFont('DM+Sans', 700),
        ]);

        const fonts: any[] = [];
        if (rajdhaniBold) fonts.push({ name: 'Rajdhani', data: rajdhaniBold, weight: 700 });
        if (dmSansBold) fonts.push({ name: 'DM Sans', data: dmSansBold, weight: 700 });

        const headingFont = rajdhaniBold ? 'Rajdhani' : dmSansBold ? 'DM Sans' : 'sans-serif';

        // ── PRODUCT MODE ────────────────────────────────────────────────────────
        if (title) {
            return new ImageResponse(
                <div style={{ width: 1200, height: 630, background: '#0D0D10', display: 'flex', position: 'relative' }}>
                    {/* Left content */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 72px', flex: 1, zIndex: 2 }}>
                        {/* Top */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 24, height: 2, background: '#E84C4C', display: 'flex' }} />
                            <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, letterSpacing: '0.35em', color: '#E84C4C' }}>
                                BRAGANÇA PAULISTA · SP
                            </span>
                        </div>

                        {/* Center */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {category && (
                                <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(232,76,76,0.35)', padding: '5px 14px', width: 'fit-content' }}>
                                    {category.toUpperCase()}
                                </span>
                            )}
                            <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: title.length > 28 ? 58 : 72, lineHeight: 1, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                                {title}
                            </span>
                            {price && (
                                <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 44, color: '#E84C4C', letterSpacing: '-0.01em' }}>
                                    R$ {price}
                                </span>
                            )}
                        </div>

                        {/* Bottom */}
                        <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.25)' }}>
                            cyberinformatica.tech
                        </span>
                    </div>
                </div>,
                { width: 1200, height: 630, fonts }
            );
        }

        // ── BRAND MODE ──────────────────────────────────────────────────────────
        return new ImageResponse(
            <div style={{ width: 1200, height: 630, background: '#0D0D10', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 80px', position: 'relative' }}>

                {/* Top: location label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 2, background: '#E84C4C', display: 'flex' }} />
                    <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, letterSpacing: '0.38em', color: '#E84C4C' }}>
                        BRAGANÇA PAULISTA · SP
                    </span>
                </div>

                {/* Center: logo block */}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 0 }}>
                    {/* Red vertical bar */}
                    <div style={{ width: 6, background: '#E84C4C', marginRight: 28, borderRadius: 2, display: 'flex' }} />

                    {/* Text */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{
                            fontFamily: headingFont,
                            fontWeight: 700,
                            fontSize: 148,
                            lineHeight: 0.88,
                            color: '#FFFFFF',
                            letterSpacing: '-0.03em',
                        }}>
                            cyber
                        </span>
                        <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 400,
                            fontSize: 36,
                            letterSpacing: '0.28em',
                            color: 'rgba(255,255,255,0.38)',
                        }}>
                            informática
                        </span>
                    </div>
                </div>

                {/* Bottom: tags + url */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {[
                            { n: '01', label: 'PC GAMER' },
                            { n: '02', label: 'MANUTENÇÃO' },
                            { n: '03', label: 'SMARTPHONE' },
                        ].map(tag => (
                            <div
                                key={tag.n}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    border: '1px solid rgba(232,76,76,0.4)',
                                    padding: '8px 16px',
                                }}
                            >
                                <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 11, color: '#E84C4C', letterSpacing: '0.1em' }}>
                                    // {tag.n}
                                </span>
                                <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.22em' }}>
                                    {tag.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <span style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)' }}>
                        cyberinformatica.tech
                    </span>
                </div>
            </div>,
            { width: 1200, height: 630, fonts }
        );

    } catch (err) {
        console.error('[OG] Error:', err);
        return new Response('Error generating image', { status: 500 });
    }
}
