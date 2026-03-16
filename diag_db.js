const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log("--- PRODUTOS ---");
    const { data: pData, error: pError } = await supabase.from('products').select('*').limit(1);
    if (pError) console.error("Erro Produtos:", pError.message);
    else console.log("Colunas Produtos:", Object.keys(pData[0] || {}));

    console.log("\n--- LEADS ---");
    const { data: lData, error: lError } = await supabase.from('leads').select('*').limit(1);
    if (lError) console.error("Erro Leads:", lError.message);
    else console.log("Colunas Leads:", Object.keys(lData[0] || {}));
}

check();
