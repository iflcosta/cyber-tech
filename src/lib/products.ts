import { supabase } from './supabase';

export interface Product {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    category: string;
    price: number;
    stock_quantity: number;
    specs: any;
    image_urls?: string[];
    views?: number;
    sku?: string;
    created_at: string;
    show_in_showroom?: boolean;
    show_in_catalog?: boolean;
    show_in_pcbuilder?: boolean;
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

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) return null;
    return data as Product;
};
