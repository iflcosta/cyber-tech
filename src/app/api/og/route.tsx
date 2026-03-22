import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const BG = '#0d0d11';
const RED = '#E53935';

async function loadFonts() {
    try {
        const { readFile } = await import('fs/promises');
        const { join } = await import('path');
        const [r, j] = await Promise.all([
            readFile(join(process.cwd(), 'public/fonts/Rajdhani-Bold.woff2')),
            readFile(join(process.cwd(), 'public/fonts/JetBrainsMono-Regular.woff2')),
        ]);
        return { rajdhaniBold: r.buffer as ArrayBuffer, jetbrainsMono: j.buffer as ArrayBuffer };
    } catch {
        return { rajdhaniBold: null, jetbrainsMono: null };
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const title = searchParams.get('title');
        const price = searchParams.get('price');
        const category = searchParams.get('category');

        const { rajdhaniBold, jetbrainsMono } = await loadFonts();

        const fonts: any[] = [];
        if (rajdhaniBold) fonts.push({ name: 'Rajdhani', data: rajdhaniBold, weight: 700 });
        if (jetbrainsMono) fonts.push({ name: 'JetBrains Mono', data: jetbrainsMono, weight: 400 });

        const R = rajdhaniBold ? 'Rajdhani' : 'sans-serif';
        const M = jetbrainsMono ? 'JetBrains Mono' : 'monospace';

        return new ImageResponse(
            <div style={{ width: 1200, height: 630, backgroundColor: BG, display: 'flex', position: 'relative', overflow: 'hidden' }}>

                {/* Red glow */}
                <div style={{ position: 'absolute', bottom: -270, left: -90, width: 900, height: 900, borderRadius: 450, backgroundImage: 'radial-gradient(circle, rgba(229,57,53,0.15) 0%, rgba(13,13,17,0) 65%)', display: 'flex' }} />

                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

                    {/* Top */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 2, backgroundColor: RED, display: 'flex' }} />
                        <span style={{ fontFamily: M, fontWeight: 400, fontSize: 12, color: RED, letterSpacing: '0.4em' }}>
                            BRAGANÇA PAULISTA · SP
                        </span>
                    </div>

                    {/* Center */}
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%', paddingLeft: 44, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 6, backgroundColor: RED, display: 'flex' }} />
                        {title ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {category ? <span style={{ fontFamily: M, fontSize: 11, color: RED, letterSpacing: '0.3em' }}>// {category.toUpperCase()}</span> : null}
                                <span style={{ fontFamily: R, fontWeight: 700, fontSize: title.length > 25 ? 62 : 78, lineHeight: 0.9, letterSpacing: '-0.02em', color: '#FFFFFF' }}>{title}</span>
                                {price ? <span style={{ fontFamily: R, fontWeight: 700, fontSize: 48, color: RED }}>R$ {price}</span> : null}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontFamily: R, fontWeight: 700, fontSize: 160, lineHeight: 0.8, letterSpacing: '-0.02em', color: '#FFFFFF' }}>cyber</span>
                                <span style={{ fontFamily: M, fontWeight: 400, fontSize: 36, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>informática</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 32, position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex' }} />
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex' }} />
                        <div style={{ display: 'flex', gap: 20 }}>
                            {[
                                { id: '01', label: 'PC GAMER' },
                                { id: '02', label: 'MANUTENÇÃO' },
                                { id: '03', label: 'SMARTPHONE' },
                            ].map(tag => (
                                <div key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)', paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: 'rgba(13,13,17,0.8)', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: RED, display: 'flex' }} />
                                    <span style={{ fontFamily: M, fontSize: 10, color: RED, opacity: 0.8 }}>// {tag.id}</span>
                                    <span style={{ fontFamily: M, fontSize: 12, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em' }}>{tag.label}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ width: 30, height: 1, backgroundColor: 'rgba(229,57,53,0.5)', display: 'flex' }} />
                            <span style={{ fontFamily: M, fontSize: 14, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>cyberinformatica.tech</span>
                        </div>
                    </div>
                </div>
            </div>,
            { width: 1200, height: 630, fonts }
        );

    } catch (err) {
        console.error('[OG] Error:', err);
        return new Response('OG Error: ' + String(err), { status: 500 });
    }
}
