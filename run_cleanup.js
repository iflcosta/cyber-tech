const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local manualmente
const envPath = path.resolve(__dirname, '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envFile.split('\n')
        .filter(line => line.includes('='))
        .map(line => {
            const [key, ...value] = line.split('=');
            return [key.trim(), value.join('=').trim()];
        })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanup() {
    console.log('🧹 Iniciando limpeza de dados...');

    // Limpar Reviews
    const { data: revs } = await supabase.from('reviews').select('id');
    if (revs && revs.length > 0) {
        console.log(`Reviews encontradas: ${revs.length}. Deletando...`);
        for (const r of revs) {
            const { error, count } = await supabase.from('reviews').delete().eq('id', r.id);
            if (error) console.error(`Erro ao deletar review ${r.id}:`, error.message);
        }
        console.log(`✅ Operação de limpeza de Reviews concluída.`);
    }

    // Limpar Leads
    const { data: lds } = await supabase.from('leads').select('id');
    if (lds && lds.length > 0) {
        console.log(`Leads encontrados: ${lds.length}. Deletando...`);
        for (const l of lds) {
            const { error, count } = await supabase.from('leads').delete().eq('id', l.id);
            if (error) console.error(`Erro ao deletar lead ${l.id}:`, error.message);
        }
        console.log(`✅ Operação de limpeza de Leads concluída.`);
    }

    // Limpar Produtos
    const { data: prods } = await supabase.from('products').select('id');
    if (prods && prods.length > 0) {
        console.log(`Produtos encontrados: ${prods.length}. Deletando...`);
        for (const p of prods) {
            const { error, count } = await supabase.from('products').delete().eq('id', p.id);
            if (error) console.error(`Erro ao deletar produto ${p.id}:`, error.message);
        }
        console.log(`✅ Operação de limpeza de Produtos concluída.`);
    }

    console.log('✨ Ambiente pronto para novos testes!');
}

cleanup();
