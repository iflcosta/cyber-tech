const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setupCampaign(p1_name, p1_price, p1_img, p2_name, p2_price, p2_img) {
  console.log('🚀 Iniciando cadastro da campanha...');

  const products = [
    {
      name: p1_name,
      category: 'smartphone',
      price: parseFloat(p1_price),
      stock_quantity: 5,
      specs: { model: p1_name, color: 'Padrão' },
      image_urls: [p1_img],
      views: 0
    },
    {
      name: p2_name,
      category: 'smartphone',
      price: parseFloat(p2_price),
      stock_quantity: 5,
      specs: { model: p2_name, color: 'Padrão' },
      image_urls: [p2_img],
      views: 0
    }
  ];

  const { data, error } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (error) {
    console.error('❌ Erro ao cadastrar:', error.message);
  } else {
    console.log('✅ Campanha cadastrada com sucesso!');
    console.log('Produtos:', data.map(p => `${p.name} - R$ ${p.price}`));
  }
}

// Exemplos de uso pela linha de comando se quiser rodar manual:
// node setup_campaign.js "iPhone 15" 5000 "link_da_foto" "Samsung S24" 4500 "link_outra_foto"

const args = process.argv.slice(2);
if (args.length >= 6) {
    setupCampaign(args[0], args[1], args[2], args[3], args[4], args[5]);
} else {
    console.log('Aguardando definição dos produtos. Você pode rodar este script quando tiver os dados.');
}
