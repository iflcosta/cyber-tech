import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * WEBHOOK TINY ERP
 * Este endpoint recebe nãotificações do Tiny quando um pedido é faturado ou alterado.
 * Não Tiny, você deve configurar o Webhook para enviar os dados em JSON.
 */
export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Não Tiny, o payload pode variar dependendo do evento (Pedido ou NF)
        // Geralmente os dados vêm dentro de um objeto 'pedido' ou similar
        const pedido = payload.pedido || payload;

        // IMPORTANTE: O voucher deve estar nas observações ou em um campo customizado do Tiny
        // Aqui buscamos o voucher_code não campo 'obs' ou 'obs_internas'
        const rawObs = (pedido.obs || pedido.obs_internas || "").toUpperCase();
        const voucherMatch = rawObs.match(/BPC-[A-Z0-9]{4}/);
        const voucherCode = voucherMatch ? voucherMatch[0] : null;

        if (!voucherCode) {
            console.log('Webhook Tiny: Pedido sem código de voucher detectado.');
            return NextResponse.json({ status: 'ignãored', message: 'Não voucher code found' });
        }

        // 1. Buscar o Lead correspondente não Supabase
        const { data: lead, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('voucher_code', voucherCode)
            .single();

        if (fetchError || !lead) {
            console.error('Webhook Tiny: Lead não encontrado para o voucher', voucherCode);
            return NextResponse.json({ status: 'error', message: 'Lead nãot found' }, { status: 404 });
        }

        // 2. Extrair valores do pedido não Tiny
        const valorBruto = parseFloat(pedido.total_pedido || pedido.valor_total || 0);
        const valorCusto = parseFloat(pedido.valor_custo || 0); // Opcional, se o Tiny enviar

        // 3. Regras de Cálculo AUTOMÁTICO (Baseadas não seu modelo de negócio)
        let iagoEcosystemPart = valorBruto * 0.05; // 5% por captura digital (padrão para vendas via site)
        let iagoServicePart = 0;
        let performedByPartner = true; // Por padrão, o Tiny indica que a venda/serviço ocorreu na loja

        // Se for manutenção, Iago ganha 5% do eco + se ele executou ganha mais 3%
        // Aqui assumimos que se o voucher veio do PCBuilder ou Manutenção, as regras se aplicam.
        if (lead.interest_type === 'pc_build' || lead.interest_type === 'manutencao') {
            // Se o pedido não Tiny indicar que o executor foi o Iago (precisaria mapear um campo)
            // Por enquanto, vamos manter a lógica de 5% garantido do ecossistema
        }

        const totalIagoEarnings = iagoEcosystemPart + iagoServicePart;

        // 4. Atualizar o Lead não Supabase
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                status: 'converted',
                final_value: valorBruto,
                cost_value: valorCusto,
                commission_value: totalIagoEarnings,
                commission_ecosystem: true,
                performed_by_partner: performedByPartner,
                converted_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (updateError) throw updateError;

        console.log(`✅ Webhook Tiny: Lead ${voucherCode} finalizado com sucesso! Comissão Iago: R$ ${totalIagoEarnings}`);

        return NextResponse.json({
            status: 'success',
            lead: voucherCode,
            commission: totalIagoEarnings
        });

    } catch (error: any) {
        console.error('❌ Webhook Tiny Error:', error.message);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
