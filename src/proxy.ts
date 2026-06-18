import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy/Middleware para rotas /admin/*.
 *
 * Antes (Cyber Control legado): fazia auth via Supabase antigo
 * (NEXT_PUBLIC_SUPABASE_URL) e redirecionava pra /admin/login.
 *
 * Agora: a Cyber Control foi removida. O unico admin valido e o
 * CRM novo em /admin/crm/*, que tem seu proprio auth check no
 * src/app/admin/crm/layout.tsx.
 *
 * Este middleware agora so:
 *   1. Redireciona /admin (rota de aviso) e /admin/crm/* para
 *      /admin/crm/login se nao houver cookie de sessao do CRM.
 *   2. Nao tenta autenticar no nivel de middleware (o CRM cuida).
 *
 * Para producao, configure a auth check real no client side
 * via contexto (ja feito em src/app/admin/crm/layout.tsx).
 */
export function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Apenas rotas do CRM passam pelo gate de auth
    if (!pathname.startsWith('/admin/crm')) {
        return NextResponse.next();
    }

    // Login sempre liberado
    if (pathname === '/admin/crm/login') {
        return NextResponse.next();
    }

    // /admin/crm (sem sub-rota) -> redireciona pro login
    if (pathname === '/admin/crm' || pathname === '/admin/crm/') {
        const loginUrl = new URL('/admin/crm/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Verifica se ha sessao do CRM no cookie
    // O CRM usa @supabase/ssr que grava cookies com prefixo 'sb-'
    const hasSession = request.cookies.getAll().some((c) =>
        c.name.startsWith('sb-') && c.value && c.value.length > 0
    );

    if (!hasSession) {
        const loginUrl = new URL('/admin/crm/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
