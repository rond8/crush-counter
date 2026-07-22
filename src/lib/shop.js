import { supabase } from '../supabaseClient'

export async function getShopItems() {
  const { data, error } = await supabase.rpc('get_shop_items')
  if (error) throw error
  return data ?? []
}

export async function buyShopItemWithCoins(itemType) {
  const { data, error } = await supabase.rpc('buy_shop_item_with_coins', { p_item_type: itemType })
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Call after a confirmed real-money purchase (see purchaseConsumable
 * in lib/purchases.js) to actually grant the item.
 */
export async function grantPurchasedItem(itemType) {
  const { data, error } = await supabase.rpc('grant_purchased_item', { p_item_type: itemType })
  if (error) throw error
  return data
}