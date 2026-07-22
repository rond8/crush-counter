import { supabase } from '../supabaseClient'

/**
 * The current event, or null if none is set right now. Includes
 * bonus_coins and claimed_by_me (false when logged out).
 */
export async function getCurrentEvent() {
  const { data, error } = await supabase.rpc('get_current_event')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Admin-only: set (or overwrite) the current event. Safe to call
 * repeatedly — each call fully replaces the previous event's details.
 * Scheduling a different start date counts as a new event and resets
 * who's already claimed the bonus; editing text/image with the same
 * start date does not.
 */
export async function setCurrentEvent({ title, body, imageUrl, startsAt, endsAt, bonusCoins }) {
  const { error } = await supabase.rpc('set_current_event', {
    p_title: title.trim(),
    p_body: body.trim(),
    p_image_url: imageUrl?.trim() || null,
    p_starts_at: startsAt || null,
    p_ends_at: endsAt || null,
    p_bonus_coins: bonusCoins || 0,
  })
  if (error) throw error
}

/**
 * Admin-only: remove the current event entirely.
 */
export async function clearCurrentEvent() {
  const { error } = await supabase.rpc('clear_current_event')
  if (error) throw error
}

/**
 * Claim the current event's coin bonus (once per event). Throws with
 * a user-facing message if not eligible yet (event has no bonus,
 * hasn't started, has ended, already claimed, or the caller hasn't
 * participated in anything yet).
 */
export async function claimEventBonus() {
  const { data, error } = await supabase.rpc('claim_event_bonus')
  if (error) throw error
  return data
}