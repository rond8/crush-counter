import { supabase } from '../supabaseClient'

/**
 * Set (or change) the current user's single crush.
 * Calling this again with a new username replaces the previous one.
 */
export async function setCrush(targetUsername) {
  const { error } = await supabase.rpc('set_crush', {
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
}

/**
 * The current user's crush (or null if they haven't set one),
 * with a computed status: 'yellow' | 'green' | 'purple' | 'pending'
 */
export async function getMyCrush() {
  const { data, error } = await supabase.rpc('get_my_crush')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Total number of accounts whose current crush is the caller.
 * Reveals a count only, never identities.
 */
export async function getReceivedCount() {
  const { data, error } = await supabase.rpc('get_my_received_count')
  if (error) throw error
  return data ?? 0
}

/**
 * Anonymous count of people who currently have the caller as their
 * crush (excluding already-revealed mutual matches).
 */
export async function getAdmirerStatus() {
  const { data, error } = await supabase.rpc('get_my_admirer_status')
  if (error) throw error
  return data?.[0] ?? { has_admirer: false, admirer_count: 0 }
}

/**
 * Checks whether the caller has new admirers since they last checked.
 * Always updates the server-side "last seen" count as a side effect,
 * so each increase is only ever reported once.
 */
export async function checkNewAdmirers() {
  const { data, error } = await supabase.rpc('check_new_admirers')
  if (error) throw error
  return data?.[0] ?? { has_new: false, new_count: 0, current_count: 0 }
}

/**
 * Anonymized clues about each secret admirer (masked username initial,
 * gender, age, location — never enough to fully identify them).
 */
export async function getAdmirerHints() {
  const { data, error } = await supabase.rpc('get_my_admirer_hints')
  if (error) throw error
  return data ?? []
}

/**
 * Usernames of mutual matches (identity is only ever revealed here,
 * once both sides' current crush points at each other).
 */
export async function getMatches() {
  const { data, error } = await supabase.rpc('get_my_matches')
  if (error) throw error
  return data ?? []
}

/**
 * Gets timestamps for when admirers set the current user as their crush.
 */
export async function getAdmirerDates() {
  const { data, error } = await supabase.rpc('get_my_admirer_dates')
  if (error) throw error
  return data ?? []
}