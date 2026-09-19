import { supabase } from '../supabaseClient'

/**
 * Send a gift to another user.
 * Costs 5 coins for Rose, 10 for Chocolate, 50 for Crown.
 */
export async function sendGift(targetUsername, giftType) {
  const { data, error } = await supabase.rpc('send_virtual_gift', {
    p_target_username: targetUsername.trim().toLowerCase(),
    p_gift_type: giftType,
  })
  if (error) throw error
  return data
}

/**
 * Get gifts received by the current user.
 */
export async function getMyReceivedGifts() {
  const { data, error } = await supabase
    .from('gifts')
    .select('id, gift_type, from_username, created_at')
    .eq('to_user_id', (await supabase.auth.getUser()).data.user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
