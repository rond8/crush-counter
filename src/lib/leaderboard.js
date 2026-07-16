import { supabase } from '../supabaseClient'

/**
 * Top 10 profiles by fame — opted-in accounts only, and only once at
 * least 25 accounts exist overall (returns an empty array before that,
 * or if nobody has opted in yet).
 */
export async function getLeaderboard() {
  const { data, error } = await supabase.rpc('get_leaderboard')
  if (error) throw error
  return data ?? []
}

/**
 * Total registered accounts, to show "X/25 users" progress before the
 * leaderboard unlocks.
 */
export async function getTotalUserCount() {
  const { data, error } = await supabase.rpc('get_total_user_count')
  if (error) throw error
  return data ?? 0
}

/**
 * Record the caller's answer to "want to be featured on the
 * leaderboard if you rank in the top 10?"
 */
export async function setLeaderboardOptIn(optIn) {
  const { error } = await supabase.rpc('set_leaderboard_opt_in', { p_opt_in: optIn })
  if (error) throw error
}
