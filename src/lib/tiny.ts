import { supabase } from './supabase';

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2';

export interface TinyOrderData {
    client_name: string;
    whatsapp: string;
    interest_type: string;
    description: string;
    final_value?: number;
    delivery_type?: 'store' | 'delivery'; // 'store' = Retirada na Loja, 'delivery' = Entrega Local
    delivery_address?: string;
    items?: Array<{
        description: string;
        quantity: number;
        unit_price: number;
    }>;
}

export async function createTinyOrder(data: TinyOrderData) {
    if (!TINY_API_TOKEN) {
        console.warn('TINY_API_TOKEN não configurado. Simulando criação de pedido.');
        return { status: 'simulated', id: `TINY-SIM-${Date.now()}` };
    }

    try {
        // Formata os itens para o padrão Tiny ERP
        let itensXml = '';
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                itensXml += `
                    <item>
                        <codigo></codigo>
                        <descricao><![CDATA[${item.description}]]></descricao>
                        <unidade>UN</unidade>
                        <quantidade>${item.quantity}</quantidade>
                        <valor_unitario>${item.unit_price}</valor_unitario>
                        <tipo>P</tipo>
                    </item>
                `;
            });
        } else {
            // Fallback genérico caso não haja itens
            const fallbackPrice = data.final_value || 0;
            itensXml = `
                <item>
                    <codigo></codigo>
                    <descricao><![CDATA[Serviço/Produto Nexus Tech: ${data.interest_type === 'pc_build' ? 'Montagem de PC' : data.interest_type === 'manutencao' ? 'Manutenção' : 'Produto'}]]></descricao>
                    <unidade>UN</unidade>
                    <quantidade>1</quantidade>
                    <valor_unitario>${fallbackPrice}</valor_unitario>
                    <tipo>S</tipo>
                </item>
            `;
        }

        const xmlPedido = `
            <?xml version="1.0" encoding="UTF-8"?>
            <pedidos>
                <pedido>
                    <cliente>
                        <nome><![CDATA[${data.client_name}]]></nome>
                        <tipo_pessoa>F</tipo_pessoa>
                        <fone><![CDATA[${data.whatsapp}]]></fone>
                    </cliente>
                    <itens>
                        ${itensXml}
                    </itens>
                    <parcelas>
                        <parcela>
                            <dias>0</dias>
                            <data>${new Date().toISOString().split('T')[0]}</data>
                            <valor>${data.final_value || 0}</valor>
                            <obs>Pagamento a combinar / via status do site</obs>
                        </parcela>
                    </parcelas>
                    <obs>Pedido gerado automaticamente via Nexus Tech. Retirada: ${data.delivery_type === 'delivery' ? 'Entrega Local - ' + data.delivery_address : 'Na Loja'}. Descrição do lead: ${data.description}</obs>
                    <forma_pagamento>A Combinar</forma_pagamento>
                    <situacao>aberto</situacao>
                </pedido>
            </pedidos>
        `.trim();

        const formData = new URLSearchParams();
        formData.append('token', TINY_API_TOKEN);
        formData.append('pedido', xmlPedido);
        formData.append('formato', 'json');

        const response = await fetch(`${TINY_API_URL}/pedido.incluir.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        const result = await response.json();

        if (result.retorno.status === 'Erro') {
            console.error('Erro na API Tiny:', result.retorno.erros);
            throw new Error(`Tiny API Error: ${result.retorno.erros[0]?.erro}`);
        }

        return {
            status: 'success',
            id: result.retorno.registros.registro.numero,
            tinyInfo: result.retorno.registros.registro
        };

    } catch (error) {
        console.error('Erro ao integrar com Tiny:', error);
        throw error;
    }
}

export async function getTinyPaymentLink(orderId: string) {
    if (!TINY_API_TOKEN) {
        // Simulação do Link/QR Code para ambiente local sem o Token
        return {
            pixCode: '00020126360014br.gov.bcb.pix0114+55119999999995204000053039865802BR5915Nexus Tech6009Sao Paulo62070503***6304A1B2',
            checkoutUrl: 'https://pay.tiny.com.br/checkout/simulator-link-123'
        };
    }

    try {
        // Em um cenário real, você faria um POST para obter os dados do contas a receber / link de pagamento
        // Essa é uma simulação do payload retornado pelo gateway configurado no Tiny
        return {
            pixCode: '00020126360014br.gov.bcb.pix0114+55119999999995204000053039865802BR5915Nexus Tech6009Sao Paulo62070503***6304A1B2',
            checkoutUrl: '#'
        };
    } catch (e) {
        console.error('Falha ao buscar link de pagamento:', e);
        return null;
    }
}

/**
 * Busca a lista de produtos ativos no Tiny ERP
 */
export async function fetchTinyProducts() {
    if (!TINY_API_TOKEN) throw new Error("TINY_API_TOKEN não configurado.");

    try {
        const formData = new URLSearchParams();
        formData.append('token', TINY_API_TOKEN);
        formData.append('formato', 'json');
        
        const response = await fetch(`${TINY_API_URL}/produtos.pesquisa.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const result = await response.json();

        if (result.retorno.status === 'Erro') {
            if (result.retorno.erros[0]?.erro.includes('não encontrou')) return [];
            throw new Error(`Tiny API Error: ${result.retorno.erros[0]?.erro}`);
        }

        return result.retorno.produtos.map((p: any) => p.produto);
    } catch (error) {
        console.error('Erro ao buscar produtos no Tiny:', error);
        throw error;
    }
}

/**
 * Sincroniza os produtos do Tiny com o banco de dados Supabase
 */
export async function syncTinyProductsToSupabase() {
    try {
        const tinyProducts = await fetchTinyProducts();
        if (!tinyProducts || tinyProducts.length === 0) return { count: 0 };

        const productsToUpsert = tinyProducts.map((tp: any) => ({
            sku: tp.codigo,
            name: tp.nome,
            price: tp.preco,
            stock_quantity: tp.saldo,
            category: 'hardware', // Categoria padrão, pode ser ajustada via mapeamento
            olist_product_id: tp.id?.toString()
        }));

        // Upsert no Supabase usando o SKU como chave de conflito
        const { data, error } = await supabase
            .from('products')
            .upsert(productsToUpsert, { onConflict: 'sku' });

        if (error) throw error;

        return { count: productsToUpsert.length };
    } catch (error) {
        console.error('Erro na sincronização de produtos:', error);
        throw error;
    }
}
