import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;
    const isLoginRoute = pathname === '/admin/crm/login' || pathname === '/admin/login';
    const isAuthed = !!user;

    // Se estiver tentando acessar o admin e NÃO houver usuário logado
    if (pathname.startsWith('/admin') && !isAuthed) {
        // Permite acesso à página de login para evitar loop infinito
        if (isLoginRoute) {
            return response;
        }
        // Redireciona para o login do CRM (rota nova, apos remocao da Cyber Control)
        return NextResponse.redirect(new URL('/admin/crm/login', request.url));
    }

    // Se estiver logado e tentar ir para qualquer pagina de login, manda pro /admin (aviso)
    if (isLoginRoute && isAuthed) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*'],
};
