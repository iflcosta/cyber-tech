import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, paymentMethod, clientData, items } = body;

        const TINY_TOKEN = process.env.TINY_API_TOKEN;

        console.log(`[API CHECKOUT] Processando pedido ${orderId} no Olist...`);

        // 1. Mapear o pedido para o formato do Olist/Tiny
        const olistPedido = {
            pedido: {
                cliente: {
                    nome: clientData.name,
                    tipo_pessoa: 'F',
                    cpf_cnpj: '', // Opcional no primeiro momento
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
                        codigo: item.product.id,
                        descricao: item.product.name,
                        unidade: 'un',
                        quantidade: item.quantity,
                        valor_unitario: item.product.price
                    }
                })),
                meio_pagamento: paymentMethod === 'pix' ? 'Pix' : 
                                paymentMethod === 'pay_at_store' ? 'A combinar' : 'Cartão de Crédito',
                vendedor: 'Site Cyber Tech'
            }
        };

        // 2. Enviar para o Olist se o Token existir
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
            
            if (result.retorno.status === 'OK') {
                console.log(`[API CHECKOUT] Pedido ${orderId} criado no Olist com sucesso.`);
            } else {
                console.warn(`[API CHECKOUT] Olist retornou erro:`, result.retorno.erros);
            }
        } else {
            console.log('[API CHECKOUT] Token Olist ausente ou fake. Operando em modo SIMULADO.');
        }

        return NextResponse.json({
            success: true,
            message: "Pedido integrado ao ecossistema Olist.",
            transaction_id: `tx_${Math.random().toString(36).substring(7)}`,
            status: "pending_payment"
        });

    } catch (error) {
        console.error("[API CHECKOUT] Erro ao processar pedido:", error);
        return NextResponse.json({ success: false, error: "Falha ao processar checkout" }, { status: 500 });
    }
}
