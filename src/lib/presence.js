import { supabase } from '../supabaseClient'

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Mark the given user as active right now. Call this periodically
 * while the app is open so other users' online indicators stay
 * accurate. Relies on the existing "users can update their own
 * profile" RLS policy — no new grants needed.
 */
export async function touchLastSeen(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

/**
 * Whether a last_seen timestamp counts as "online now".
 */
export function isOnline(lastSeen) {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS
}
