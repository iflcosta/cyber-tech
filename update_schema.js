const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function updateSchema() {
    console.log("Adicionando coluna 'views' na tabela products...");
    const { error } = await supabase.rpc('execute_sql', {
        sql: "ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;"
    });

    if (error) {
        // Se a RPC não estiver disponível, tentaremos informar ao usuário para rodar no dashboard
        console.error("Erro ao rodar SQL via RPC:", error.message);
        console.log("Por favor, execute o seguinte comando no SQL Editor do Supabase:");
        console.log("ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;");
    } else {
        console.log("Sucesso! Coluna 'views' adicionada.");
    }
}

updateSchema();
