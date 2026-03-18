import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Esta rota receberá os "avisos" do Olist vindos do ERP de vocês
export async function POST(request: Request) {
    try {
        // Validação de segurança/assinatura do Webhook
        const authHeader = request.headers.get('Authorization') || request.headers.get('x-olist-signature');
        const internalToken = process.env.OLIST_WEBHOOK_SECRET;

        if (internalToken && authHeader !== internalToken) {
            console.warn("[WEBHOOK OLIST] Tentativa de acesso não autorizado!");
            return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { event, order_id, product_id, stock_quantity, status } = body;

        console.log(`[WEBHOOK OLIST] Recebeu evento: ${event}`);

        // Exemplo 1: Olist/Tiny atualizou o estoque de um produto
        if ((event === 'stock_update' || event === 'estoque.alterado') && (product_id || body.sku || body.codigo)) {
            const sku = body.sku || body.codigo;
            
            const query = supabase.from('products').update({ stock_quantity: stock_quantity || body.saldo });
            
            if (sku) {
                await query.eq('sku', sku);
            } else {
                await query.eq('id', product_id);
            }
            
            console.log(`[WEBHOOK OLIST] - Estoque do produto ${sku || product_id} sincronizado.`);
        }

        // Exemplo 2: Olist/Tiny atualizou dados do produto (preço, nome, etc)
        if (event === 'product_update' || event === 'produto.alterado') {
            const sku = body.sku || body.codigo;
            if (sku) {
                const { error } = await supabase
                    .from('products')
                    .update({
                        name: body.nome || body.name,
                        price: body.preco || body.price,
                        stock_quantity: body.saldo || body.stock_quantity
                    })
                    .eq('sku', sku);
                
                if (error) throw error;
                console.log(`[WEBHOOK OLIST] - Dados do produto ${sku} atualizados via webhook.`);
            }
        }

        // Exemplo 2: Olist aprovou ou enviou um pedido feito pelo nãosso Checkout
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
