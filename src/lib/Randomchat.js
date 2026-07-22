import { supabase } from '../supabaseClient'

/**
 * Try to pair with whoever's waited longest. Returns either a live
 * match (matched: true, session_id, partner_*) or, if nobody's
 * waiting, joins the queue and returns a random profile to browse
 * (matched: false, fallback_*).
 */
export async function findRandomMatch(anonymous) {
  const { data, error } = await supabase.rpc('find_random_match', { p_anonymous: anonymous })
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * While waiting in the queue, check whether someone else has since
 * paired with me. Returns null (still waiting) or session/partner info.
 */
export async function checkRandomMatch() {
  const { data, error } = await supabase.rpc('check_random_match')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Leave the queue without matching (Cancel, or navigating away
 * while still waiting).
 */
export async function leaveRandomQueue() {
  const { error } = await supabase.rpc('leave_random_queue')
  if (error) throw error
}

export async function sendRandomChatMessage(sessionId, body) {
  const { error } = await supabase.rpc('send_random_chat_message', {
    p_session_id: sessionId,
    p_body: body,
  })
  if (error) throw error
}

export async function getRandomChatMessages(sessionId) {
  const { data, error } = await supabase.rpc('get_random_chat_messages', { p_session_id: sessionId })
  if (error) throw error
  return data ?? []
}

/**
 * End a session — used for both "Skip" (immediately look for a new
 * match after) and "Leave" (go back to idle).
 */
export async function endRandomChat(sessionId) {
  const { error } = await supabase.rpc('end_random_chat', { p_session_id: sessionId })
  if (error) throw error
}

/**
 * Poll while in an active chat to notice if the other person ended
 * it, since that doesn't come through as a message.
 */
export async function getRandomChatStatus(sessionId) {
  const { data, error } = await supabase.rpc('get_random_chat_status', { p_session_id: sessionId })
  if (error) throw error
  return data?.[0] ?? { ended: false, ended_by_me: false }
}