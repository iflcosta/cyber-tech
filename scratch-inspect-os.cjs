require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_CRM_URL || 'https://avfcsuyackxiaglldyvo.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!key) { console.error('No key found'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function run() {
  // List all OS to find OS-2026-0003
  const { data: orders, error } = await supabase
    .from('service_orders')
    .select('id, short_id, equipment_type, equipment_brand, equipment_model, equipment_photos, created_by')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) console.error('Error fetching orders:', error.code, error.message);
  else {
    console.log('Recent OS:');
    for (const o of orders) {
      console.log(`  ${o.short_id} | ${o.id} | ${o.equipment_type} ${o.equipment_brand} | photos: ${JSON.stringify(o.equipment_photos)}`);
    }
  }
}

run();
