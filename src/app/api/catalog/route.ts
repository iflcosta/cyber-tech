import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Formatação para o padrão de catálogo da Meta (Facebook/Instagram)
        // Nãota: O padrão oficial aceita CSV, XML ou JSON. JSON é mais robusto para Next.js.
        const catalog = products.map(p => ({
            id: p.id,
            title: p.name,
            description: p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(', ') : p.name,
            availability: p.stock_quantity > 0 ? 'in stock' : 'out of stock',
            condition: 'new',
            price: `${p.price} BRL`,
            link: `https://cyber-tech.vercel.app/showroom`, // Idealmente seria o link direto do produto
            image_link: p.image_urls?.[0] || 'https://placehold.co/600x600?text=Cyber+Tech',
            brand: 'Cyber Inform�tica',
            google_product_category: p.category === 'smartphone' ? 'Electronics > Communications > Telephony > Mobile Phones' : 'Electronics > Computers',
            content_type: 'product'
        }));

        return NextResponse.json(catalog);
    } catch (error) {
        console.error('Erro ao gerar catálogo:', error);
        return NextResponse.json({ error: 'Falha ao gerar catálogo' }, { status: 500 });
    }
}
