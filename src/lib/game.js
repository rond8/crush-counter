import { supabase } from '../supabaseClient'

/**
 * Claim the once-per-day coin reward. Safe to call every time the app
 * opens — no-ops if already claimed today.
 */
export async function claimDailyCoins() {
  const { data, error } = await supabase.rpc('claim_daily_coins')
  if (error) throw error
  return data?.[0] ?? { awarded: false, amount: 0, new_balance: 0 }
}

/**
 * Spend coins on a spin. Returns the item won and the new coin balance.
 */
export async function spinWheel() {
  const { data, error } = await supabase.rpc('spin_wheel')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Unused items currently in the caller's inventory.
 */
export async function getMyInventory() {
  const { data, error } = await supabase.rpc('get_my_inventory')
  if (error) throw error
  return data ?? []
}

/**
 * Use a 'fire' item — boosts the caller's own fame. Returns new fame total.
 */
export async function useFire(itemId) {
  const { data, error } = await supabase.rpc('use_fire', { p_item_id: itemId })
  if (error) throw error
  return data
}

/**
 * Use a 'lighter' item — gifts fame to another username.
 */
export async function useLighter(itemId, targetUsername) {
  const { error } = await supabase.rpc('use_lighter', {
    p_item_id: itemId,
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
}

/**
 * Use a 'sword' item — marks the caller's messages to their current
 * crush as priority for 24h. Returns the expiry timestamp.
 */
export async function useSword(itemId) {
  const { data, error } = await supabase.rpc('use_sword', { p_item_id: itemId })
  if (error) throw error
  return data
}
