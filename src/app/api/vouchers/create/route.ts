import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateVoucher } from '@/lib/voucher';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { marketing_source, utm_parameters } = body;

        const voucher = generateVoucher();

        // Insere o "Lead Anônimo" para reservar o voucher no banco de dados.
        // Como o usuário ainda não forneceu nome/telefone, eles ficam vazios/null,
        // mas o voucher fica reservado como 'pending'.
        const { error } = await supabase
            .from('leads')
            .insert({
                voucher_code: voucher,
                status: 'pending',
                marketing_source: marketing_source || 'organic_session',
                utm_parameters: utm_parameters || {},
                interest_type: 'sessao_iniciada',
                description: 'Lead anônimo gerado ao iniciar interação com a sessão.'
            });

        if (error) {
            console.error('[API] Erro ao reservar voucher no Supabase:', error);
            throw error;
        }

        return NextResponse.json({ voucher });
    } catch (e) {
        console.error('Create Voucher Error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
