import { supabase } from '../supabase';

/**
 * Webhook handler for Tiny ERP
 * Validates stock updates and syncs with Supabase
 */
export async function handleTinyWebhook(payload: any) {
  console.log('Tiny Webhook received:', payload);
  const { sku, stock } = payload;
  
  if (!sku) return { error: 'Missing SKU' };

  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: stock })
    .eq('sku', sku);

  return { success: !error, error };
}

/**
 * Webhook handler for Olist Pay
 * Updates lead status to 'paid' when payment is confirmed
 */
export async function handleOlistWebhook(payload: any) {
  console.log('Olist Webhook received:', payload);
  const { external_id, status } = payload;

  if (status === 'approved') {
    const { error } = await supabase
      .from('leads')
      .update({ payment_status: 'paid' })
      .eq('id', external_id);
      
    return { success: !error, error };
  }

  return { success: true };
}
