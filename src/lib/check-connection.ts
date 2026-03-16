import { supabase } from './supabase';

async function checkConnection() {
  console.log('--- Teste de Conexão Supabase ---');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    const { data, error } = await supabase.from('products').select('*').limit(1);

    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      console.error('Dica: Verifique se você já rodou o schema.sql no SQL Editor do Supabase.');
    } else {
      console.log('✅ Conexão bem-sucedida!');
      console.log('Dados recebidos (amostra):', data);
    }
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

checkConnection();
