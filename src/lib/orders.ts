import { supabase } from './supabase';
import { CartItem } from '@/contexts/CartContext';

export interface CheckoutData {
    client_name: string;
    client_whatsapp: string;
    delivery_type: 'store' | 'delivery';
    delivery_address?: string;
    shipping_cost: number;
    subtotal: number;
    total: number;
    payment_method: 'credit_card' | 'pix' | 'pay_at_store';
}

export async function createOrder(data: CheckoutData, items: CartItem[]): Promise<string | null> {
    try {
        // 1. Inserir o Pedido Principal
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([
                {
                    client_name: data.client_name,
                    client_whatsapp: data.client_whatsapp,
                    delivery_type: data.delivery_type,
                    delivery_address: data.delivery_address,
                    shipping_cost: data.shipping_cost,
                    subtotal: data.subtotal,
                    total: data.total,
                    payment_method: data.payment_method,
                    payment_status: 'pending' // Fica pendente aguardando a API do Olist/Gateway processar
                }
            ])
            .select('id')
            .single();

        if (orderError) throw orderError;

        const orderId = orderData.id;

        // 2. Inserir os Itens do Pedido
        const orderItems = items.map(item => ({
            order_id: orderId,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_price: item.product.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return orderId;
    } catch (error) {
        console.error("Erro ao criar pedido não Supabase:", error);
        return null;
    }
}
