
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
    console.log("Tentando inserir lead de teste...");
    const { data, error } = await supabase.from('leads').insert({
        client_name: 'Teste Agente',
        whatsapp: '11999999999',
        interest_type: 'manutencao',
        description: 'Teste de inserção via script',
        status: 'pending'
    }).select();

    if (error) {
        console.error("Erro ao inserir lead:", error.message, error.details, error.hint);
    } else {
        console.log("Lead inserido com sucesso:", data);
    }
}

testInsert();
