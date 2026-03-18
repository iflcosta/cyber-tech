import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Admin client for server-side updates
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock_quantity: number;
    specs: any;
    image_urls?: string[];
    views?: number;
    created_at: string;
}

export const getProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching products:", error);
        return [];
    }

    return data as Product[];
};

export const updateProductStock = async (id: string, quantityToSubtract: number) => {
    // 1. Fetch current stock
    const { data: product, error: fetchError } = await supabaseAdmin
        .from('products')
        .select('stock_quantity, name')
        .eq('id', id)
        .single();

    if (fetchError || !product) {
        console.error(`[STOCK] Product not found: ${id}`);
        throw new Error(`Produto não encontrado ou ID inválido.`);
    }

    const currentStock = product.stock_quantity || 0;
    const newStock = currentStock - quantityToSubtract;

    if (newStock < 0) {
        console.warn(`[STOCK] Insufficient stock for ${product.name}. Current: ${currentStock}, Requested: ${quantityToSubtract}`);
        throw new Error(`Estoque insuficiente para ${product.name}.`);
    }

    // 2. Perform update
    const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', id);

    if (updateError) {
        console.error(`[STOCK] Failed to update stock for ${id}:`, updateError);
        throw new Error(`Erro ao atualizar estoque no banco de dados.`);
    }

    return newStock;
};
