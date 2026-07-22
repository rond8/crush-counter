import { supabase } from '../supabaseClient'

// Shared with Register.jsx — the localStorage key used to remember a
// referral code between signup (when email confirmation means there's
// no session yet) and first real login.
export const PENDING_REFERRAL_STORAGE_KEY = 'pendingReferralCode'

/**
 * Live progress for every mission (daily + weekly), computed
 * server-side from recent activity.
 */
export async function getMyMissions() {
  const { data, error } = await supabase.rpc('get_my_missions')
  if (error) throw error
  return data ?? []
}

/**
 * Claim a completed, unclaimed mission's reward. Returns the new
 * coin/fame totals.
 */
export async function claimMission(missionKey) {
  const { data, error } = await supabase.rpc('claim_mission', { p_mission_key: missionKey })
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Credit a referral using the inviter's username (from a ?ref= link).
 * Safe to call with an empty/invalid code — it just no-ops server-side.
 */
export async function claimReferral(refCode) {
  if (!refCode) return
  const { error } = await supabase.rpc('claim_referral', { p_ref_code: refCode })
  if (error) throw error
}

/**
 * How many people I've invited, plus my own username (used to build
 * my invite link).
 */
export async function getMyReferralStats() {
  const { data, error } = await supabase.rpc('get_my_referral_stats')
  if (error) throw error
  return data?.[0] ?? { invited_count: 0, username: null }
}