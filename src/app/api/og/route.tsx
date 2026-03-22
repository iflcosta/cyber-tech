import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const BG_IMAGE = 'https://images.unsplash.com/photo-1771014846919-3a1cf73aeea1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBwYyUyMHJnYiUyMGRhcmslMjBwcmVtaXVtfGVufDF8fHx8MTc3NDIxMTA4Mnww&ixlib=rb-4.1.0&q=80&w=1080';
const BG = '#0d0d11';
const RED = '#E53935';

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const css = await fetch(
            `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }, signal: controller.signal }
        ).then(r => r.text()).finally(() => clearTimeout(timeout));
        const url = css.match(/src: url\(([^)]+)\) format\('woff2'\)/)?.[1];
        if (!url) return null;
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 3000);
        return fetch(url, { signal: controller2.signal })
            .then(r => r.arrayBuffer())
            .finally(() => clearTimeout(timeout2));
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

        const R = rajdhaniBold ? 'Rajdhani' : 'sans-serif';
        const M = jetbrainsMono ? 'JetBrains Mono' : 'monospace';

        const bottomSection = (
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(255,255,255,0.1)',
                paddingTop: 32, position: 'relative',
            }}>
                {/* Corner markers */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex' }} />

                {/* Tags */}
                <div style={{ display: 'flex', gap: 20 }}>
                    {TAGS.map(tag => (
                        <div key={tag.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)',
                            paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10,
                            backgroundColor: 'rgba(13,13,17,0.8)', position: 'relative',
                        }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: RED, display: 'flex' }} />
                            <span style={{ fontFamily: M, fontWeight: 400, fontSize: 10, color: RED, opacity: 0.8 }}>
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
                    <div style={{ width: 30, height: 1, backgroundColor: 'rgba(229,57,53,0.5)', display: 'flex' }} />
                    <span style={{ fontFamily: M, fontWeight: 400, fontSize: 14, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
                        cyberinformatica.tech
                    </span>
                </div>
            </div>
        );

        return new ImageResponse(
            <div style={{ width: 1200, height: 630, backgroundColor: BG, display: 'flex', position: 'relative', overflow: 'hidden' }}>

                {/* Background: gaming PC image (right 60%) */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 720, height: 630, display: 'flex' }}>
                    <img src={BG_IMAGE} alt="" style={{ width: 720, height: 630, objectFit: 'cover', opacity: 0.9 }} />
                    {/* Left fade */}
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 460, backgroundImage: `linear-gradient(to right, ${BG} 0%, rgba(13,13,17,0.75) 55%, transparent 100%)`, display: 'flex' }} />
                    {/* Bottom fade */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundImage: `linear-gradient(to top, ${BG} 0%, transparent 100%)`, display: 'flex' }} />
                </div>

                {/* Red radial glow bottom-left */}
                <div style={{
                    position: 'absolute', bottom: -270, left: -90, width: 900, height: 900,
                    borderRadius: 450,
                    backgroundImage: `radial-gradient(circle, rgba(229,57,53,0.12) 0%, rgba(13,13,17,0) 65%)`,
                    display: 'flex',
                }} />

                {/* Foreground */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                    {/* Top: location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 2, backgroundColor: RED, display: 'flex' }} />
                        <span style={{ fontFamily: M, fontWeight: 400, fontSize: 12, color: RED, letterSpacing: '0.4em' }}>
                            BRAGANÇA PAULISTA · SP
                        </span>
                    </div>

                    {/* Center: logo */}
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: title ? '65%' : '70%', paddingLeft: 44, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 6, backgroundColor: RED, display: 'flex' }} />

                        {title ? (
                            <>
                                {category && (
                                    <span style={{ fontFamily: M, fontWeight: 400, fontSize: 11, color: RED, letterSpacing: '0.3em', opacity: 0.8, marginBottom: 12 }}>
                                        // {category.toUpperCase()}
                                    </span>
                                )}
                                <span style={{ fontFamily: R, fontWeight: 700, fontSize: title.length > 25 ? 62 : 78, lineHeight: 0.9, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                                    {title}
                                </span>
                                {price && (
                                    <span style={{ fontFamily: R, fontWeight: 700, fontSize: 48, color: RED, letterSpacing: '-0.01em', marginTop: 16 }}>
                                        R$ {price}
                                    </span>
                                )}
                            </>
                        ) : (
                            <>
                                <span style={{ fontFamily: R, fontWeight: 700, fontSize: 160, lineHeight: 0.8, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                                    cyber
                                </span>
                                <span style={{ fontFamily: M, fontWeight: 400, fontSize: 36, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
                                    informática
                                </span>
                            </>
                        )}
                    </div>

                    {/* Bottom */}
                    {bottomSection}
                </div>
            </div>,
            { width: 1200, height: 630, fonts }
        );

    } catch (err) {
        console.error('[OG] Error:', err);
        return new Response('OG Error: ' + String(err), { status: 500 });
    }
}
