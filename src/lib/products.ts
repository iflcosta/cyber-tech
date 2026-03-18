import { supabase } from './supabase';

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock_quantity: number;
    specs: any;
    image_urls?: string[];
    views?: number;
    sku?: string;
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
