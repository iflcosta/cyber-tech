const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTypes() {
    console.log("--- DETALHES DAS COLUNAS (products) ---");
    const { data, error } = await supabase.rpc('get_column_details', { table_name: 'products' });

    // Se a RPC falhar, tentaremos via query direta se as permissões permitirem
    if (error) {
        console.log("RPC get_column_details não disponível. Tentando buscar um registro para inferir tipos.");
        const { data: pData } = await supabase.from('products').select('*').limit(1);
        if (pData && pData[0]) {
            console.log("Exemplo de dados:", JSON.stringify(pData[0].image_urls));
            console.log("É array?", Array.isArray(pData[0].image_urls));
        }
    } else {
        console.table(data);
    }
}

checkTypes();
