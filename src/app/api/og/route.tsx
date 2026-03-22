import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
    try {
        const css = await fetch(
            `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
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
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');       // product name
    const price = searchParams.get('price');       // product price (formatted)
    const category = searchParams.get('category'); // product category label
    const imgUrl = searchParams.get('img');        // product image URL

    const fontBold = await loadFont('Rajdhani', 700);
    const fontSemi = await loadFont('Rajdhani', 600);

    const fonts: any[] = [];
    if (fontBold) fonts.push({ name: 'Rajdhani', data: fontBold, weight: 700, style: 'normal' });
    if (fontSemi) fonts.push({ name: 'Rajdhani', data: fontSemi, weight: 600, style: 'normal' });

    const fontFamily = fonts.length > 0 ? 'Rajdhani' : 'sans-serif';

    // ─── PRODUCT MODE ──────────────────────────────────────────────────────────
    if (title) {
        return new ImageResponse(
            <div
                style={{
                    width: 1200,
                    height: 630,
                    background: '#121216',
                    display: 'flex',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Red glow bottom-right (behind product image) */}
                <div style={{
                    position: 'absolute',
                    right: -100,
                    bottom: -100,
                    width: 700,
                    height: 700,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(232,76,76,0.18) 0%, transparent 70%)',
                    display: 'flex',
                }} />

                {/* Left content */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '64px 72px',
                    width: imgUrl ? 580 : 1200,
                    zIndex: 10,
                }}>
                    {/* Top: brand */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{
                            fontFamily,
                            fontWeight: 700,
                            fontSize: 14,
                            letterSpacing: '0.4em',
                            textTransform: 'uppercase',
                            color: '#E84C4C',
                        }}>
                            CYBER INFORMÁTICA · BRAGANÇA PAULISTA
                        </span>
                    </div>

                    {/* Center: product name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {category && (
                            <span style={{
                                fontFamily,
                                fontWeight: 700,
                                fontSize: 12,
                                letterSpacing: '0.35em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.4)',
                                border: '1px solid rgba(232,76,76,0.3)',
                                padding: '4px 12px',
                                width: 'fit-content',
                            }}>
                                {category}
                            </span>
                        )}
                        <span style={{
                            fontFamily,
                            fontWeight: 700,
                            fontSize: title.length > 30 ? 52 : 64,
                            lineHeight: 1,
                            color: '#FFFFFF',
                            textTransform: 'uppercase',
                            letterSpacing: '-0.01em',
                        }}>
                            {title}
                        </span>
                        {price && (
                            <span style={{
                                fontFamily,
                                fontWeight: 700,
                                fontSize: 42,
                                color: '#E84C4C',
                                letterSpacing: '-0.01em',
                            }}>
                                R$ {price}
                            </span>
                        )}
                    </div>

                    {/* Bottom: CTA */}
                    <span style={{
                        fontFamily,
                        fontWeight: 600,
                        fontSize: 13,
                        letterSpacing: '0.25em',
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                    }}>
                        cyberinformatica.tech
                    </span>
                </div>

                {/* Right: product image */}
                {imgUrl && (
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 620,
                        height: 630,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {/* Gradient fade left */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 200,
                            height: '100%',
                            background: 'linear-gradient(to right, #121216, transparent)',
                            zIndex: 2,
                            display: 'flex',
                        }} />
                        <img
                            src={imgUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: 0.9,
                            }}
                        />
                    </div>
                )}

                {/* Subtle grid overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    display: 'flex',
                }} />
            </div>,
            { width: 1200, height: 630, fonts }
        );
    }

    // ─── BRAND MODE (default) ───────────────────────────────────────────────────
    return new ImageResponse(
        <div
            style={{
                width: 1200,
                height: 630,
                background: '#121216',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '72px 88px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background glow */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '40%',
                transform: 'translate(-50%, -50%)',
                width: 900,
                height: 400,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(232,76,76,0.07) 0%, transparent 70%)',
                display: 'flex',
            }} />

            {/* Grid overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
                display: 'flex',
            }} />

            {/* Top: eyebrow */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
            }}>
                <div style={{ width: 32, height: 1, background: '#E84C4C', display: 'flex' }} />
                <span style={{
                    fontFamily,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.4em',
                    textTransform: 'uppercase',
                    color: '#E84C4C',
                }}>
                    ESPECIALISTAS EM TECNOLOGIA · BRAGANÇA PAULISTA
                </span>
            </div>

            {/* Center: logo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, zIndex: 10 }}>
                <span style={{
                    fontFamily,
                    fontWeight: 700,
                    fontSize: 140,
                    lineHeight: 0.9,
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                }}>
                    CYBER
                </span>
                <span style={{
                    fontFamily,
                    fontWeight: 700,
                    fontSize: 60,
                    lineHeight: 1,
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                }}>
                    INFORMÁTICA
                </span>
            </div>

            {/* Bottom: tags + url */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                zIndex: 10,
            }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {['PC GAMER', 'MANUTENÇÃO', 'WORKSTATIONS', 'SMARTPHONES'].map((tag) => (
                        <span
                            key={tag}
                            style={{
                                fontFamily,
                                fontWeight: 700,
                                fontSize: 11,
                                letterSpacing: '0.25em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.45)',
                                border: '1px solid rgba(232,76,76,0.25)',
                                padding: '6px 14px',
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <span style={{
                    fontFamily,
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: '0.2em',
                    color: 'rgba(255,255,255,0.25)',
                }}>
                    cyberinformatica.tech
                </span>
            </div>
        </div>,
        { width: 1200, height: 630, fonts }
    );
}
