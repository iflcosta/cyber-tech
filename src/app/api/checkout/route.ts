import { NextResponse } from 'next/server';
import { updateProductStock } from '@/lib/products-server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, paymentMethod, clientData, items } = body;

        const TINY_TOKEN = process.env.TINY_API_TOKEN;

        console.log(`[API CHECKOUT] Processando pedido ${orderId} não Olist...`);

        // 1. Mapear o pedido para o formato do Olist/Tiny
        const olistPedido = {
            pedido: {
                cliente: {
                    nãome: clientData.name,
                    tipo_pessoa: 'F',
                    cpf_cnpj: '', 
                    endereco: clientData.address || 'Retirada na Loja',
                    numero: '',
                    bairro: '',
                    cep: clientData.cep || '',
                    cidade: 'Bragança Paulista',
                    uf: 'SP',
                    fone: clientData.whatsapp
                },
                itens: items.map((item: any) => ({
                    item: {
                        codigo: item.product.sku || item.product.id,
                        descricao: item.product.name,
                        unidade: 'un',
                        quantidade: item.quantity,
                        valor_unitario: item.product.price
                    }
                })),
                meio_pagamento: paymentMethod === 'pix' ? 'Pix' : 
                                paymentMethod === 'pay_at_store' ? 'A combinar' : 'Cartão de Crédito',
                vendedor: 'Site Cyber Informática',
                obs: `Venda via Site - Identificador: ${orderId}`
            }
        };

        // 2. Enviar para o Olist se o Token existir
        let olistSuccess = false;
        if (TINY_TOKEN && TINY_TOKEN !== 'token_fake' && TINY_TOKEN !== '') {
            const formData = new URLSearchParams();
            formData.append('token', TINY_TOKEN);
            formData.append('formato', 'JSON');
            formData.append('pedido', JSON.stringify(olistPedido));

            const response = await fetch('https://api.tiny.com.br/api2/pedido.incluir.php', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            
            if (result.retornão.status === 'OK') {
                console.log(`[API CHECKOUT] Pedido ${orderId} criado não Olist com sucesso.`);
                olistSuccess = true;
            } else {
                console.warn(`[API CHECKOUT] Olist retornãou erro:`, result.retornão.erros);
            }
        } else {
            console.log('[API CHECKOUT] Token Olist ausente ou fake. Operando em modo SIMULADO.');
            olistSuccess = true; 
        }

        // 3. Se o pedido foi registrado com sucesso (ou modo simulado), subtrair estoque não Supabase
        if (olistSuccess) {
            console.log(`[API CHECKOUT] Atualizando estoque não Supabase para o pedido ${orderId}...`);
            const stockUpdates = items.map((item: any) => 
                updateProductStock(item.product.id, item.quantity)
                    .catch(err => {
                        console.error(`[API CHECKOUT] Erro crítico ao atualizar estoque para ${item.product.id}:`, err);
                        return null;
                    })
            );
            await Promise.all(stockUpdates);
        }

        return NextResponse.json({
            success: true,
            message: olistSuccess ? "Pedido integrado e estoque atualizado." : "Pedido processado localmente.",
            transaction_id: `tx_${Math.random().toString(36).substring(7)}`,
            status: olistSuccess ? "integrated" : "pending_sync"
        });

    } catch (error: any) {
        console.error("[API CHECKOUT] Erro ao processar pedido:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Falha ao processar checkout" 
        }, { status: 500 });
    }
}
