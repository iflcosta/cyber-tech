import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Esta rota receberá os "avisos" do Olist vindos do ERP de vocês
export async function POST(request: Request) {
    try {
        // Validação de segurança/assinatura do Webhook (Olist envia Headers para validar a origem)
        const authHeader = request.headers.get('Authorization') || request.headers.get('x-olist-signature');

        // Em produção: if (authHeader !== process.env.OLIST_WEBHOOK_SECRET) return 401;

        const body = await request.json();
        const { event, order_id, product_id, stock_quantity, status } = body;

        console.log(`[WEBHOOK OLIST] Recebeu evento: ${event}`);

        // Exemplo 1: Olist atualizou o estoque de um produto (Venda no Mercado Livre, por exemplo)
        if (event === 'stock_update' && product_id) {
            const { error } = await supabase
                .from('products')
                .update({ stock_quantity: stock_quantity })
                .eq('id', product_id); // Ou UUID equivalente ao SKU do Olist

            if (error) throw error;
            console.log(`[WEBHOOK OLIST] - Estoque do produto ${product_id} sincronizado para ${stock_quantity}.`);
        }

        // Exemplo 2: Olist aprovou ou enviou um pedido feito pelo nosso Checkout
        if (event === 'order_status_update' && order_id) {
            const { error } = await supabase
                .from('orders')
                .update({ payment_status: status })
                .eq('olist_order_id', order_id);

            if (error) throw error;
            console.log(`[WEBHOOK OLIST] - Pedido ${order_id} alterou status para ${status}.`);
        }

        return NextResponse.json({ success: true, message: "Webhook processado com sucesso." });

    } catch (error) {
        console.error("[WEBHOOK OLIST] Falha ao processar:", error);
        return NextResponse.json({ success: false, error: "Falha severa de processamento" }, { status: 500 });
    }
}
