
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) {
        console.error("Erro ao buscar leads:", error.message);
    } else {
        console.log("Total de leads no banco:", data.length);
        console.table(data);
    }
}

checkData();
