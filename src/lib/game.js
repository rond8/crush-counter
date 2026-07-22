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

/**
 * Use a 'star' item — boosts the caller's own fame (same shape as
 * useFire, just a bigger number since it's rarer). Returns new fame
 * total.
 */
export async function useStar(itemId) {
  const { data, error } = await supabase.rpc('use_star', { p_item_id: itemId })
  if (error) throw error
  return data
}

/**
 * Use a 'shield' item — protects the caller's fame from arrows for
 * 24h. Returns the expiry timestamp.
 */
export async function useShield(itemId) {
  const { data, error } = await supabase.rpc('use_shield', { p_item_id: itemId })
  if (error) throw error
  return data
}

/**
 * Use an 'arrow' item — reduces another username's fame by 5 (never
 * below 0). Throws if the target is currently shielded — in that
 * case the item is NOT consumed server-side, so it's still usable
 * against someone else.
 */
export async function useArrow(itemId, targetUsername) {
  const { error } = await supabase.rpc('use_arrow', {
    p_item_id: itemId,
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
}

/**
 * Use a 'magnet' item — steals 3 fame from target player.
 */
export async function useMagnet(itemId, targetUsername) {
  const { data, error } = await supabase.rpc('use_magnet', {
    p_item_id: itemId,
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
  return data
}

/**
 * Use a 'clover' item — grants +10 coins instantly.
 */
export async function useClover(itemId) {
  const { data, error } = await supabase.rpc('use_clover', { p_item_id: itemId })
  if (error) throw error
  return data
}

/**
 * Use a 'mirror' item — reflects arrow attacks back for 24h.
 */
export async function useMirror(itemId) {
  const { data, error } = await supabase.rpc('use_mirror', { p_item_id: itemId })
  if (error) throw error
  return data
}

/**
 * Use a 'spear' item — pierces shields/mirrors and reduces target's fame by 8.
 */
export async function useSpear(itemId, targetUsername) {
  const { data, error } = await supabase.rpc('use_spear', {
    p_item_id: itemId,
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
  return data
}

/**
 * Send a handshake request to target user.
 */
export async function sendHandshake(itemId, targetUsername) {
  const { data, error } = await supabase.rpc('send_handshake', {
    p_item_id: itemId,
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
  return data
}

/**
 * Accept or decline a handshake request.
 */
export async function respondHandshake(requestId, accept) {
  const { data, error } = await supabase.rpc('respond_handshake', {
    p_request_id: requestId,
    p_accept: accept,
  })
  if (error) throw error
  return data
}