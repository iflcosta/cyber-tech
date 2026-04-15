const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log("--- PRODUTOS ---");
    const { data: pData, error: pError } = await supabase.from('products').select('*').limit(1);
    if (pError) console.error("Erro Produtos:", pError.message);
    else console.log("Colunas Produtos:", Object.keys(pData[0] || {}));

    console.log("\n--- REVIEWS ---");
    const { data: rData, error: rError } = await supabase.from('reviews').select('*').limit(5);
    if (rError) console.error("Erro Reviews:", rError.message);
    else {
        console.log("Número de reviews:", rData.length);
        console.log("Colunas Reviews:", Object.keys(rData[0] || {}));
        console.log("Reviews:", rData);
    }
}

check();
