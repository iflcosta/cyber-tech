import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Proxy/Middleware para rotas /admin/*.
 *
 * Responsabilidades:
 *   1. Renovar automaticamente o JWT de sessão via @supabase/ssr (evita "JWT expired"
 *      durante o expediente e telas brancas quando o access_token expira).
 *   2. Redirecionar usuários não autenticados em /admin/* para /admin/login.
 *   3. Redirecionar /admin (raiz) para /admin/os (se logado) ou /admin/login.
 */
export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (!pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY;

    // Se as variáveis ainda não estiverem configuradas no ambiente, deixa o layout exibir o aviso
    if (!url || !anon) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(url, anon, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value } of cookiesToSet) {
                    request.cookies.set(name, value);
                }
                response = NextResponse.next({
                    request,
                });
                for (const { name, value, options } of cookiesToSet) {
                    response.cookies.set(name, value, options);
                }
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (pathname === '/admin/login') {
        if (user) {
            return NextResponse.redirect(new URL('/admin/os', request.url));
        }
        return response;
    }

    if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (pathname === '/admin' || pathname === '/admin/') {
        return NextResponse.redirect(new URL('/admin/os', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*'],
};
