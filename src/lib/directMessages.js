import { supabase } from '../supabaseClient'

/**
 * Whether the caller and the given username are currently a mutual
 * match (required before chat unlocks).
 */
export async function isMutualMatch(username) {
  const { data, error } = await supabase.rpc('is_mutual_match', {
    p_other_username: username.trim().toLowerCase(),
  })
  if (error) throw error
  return Boolean(data)
}

/**
 * Send a direct message to a matched user. Fails server-side if
 * there's no current mutual match.
 */
export async function sendDirectMessage(username, body) {
  const { error } = await supabase.rpc('send_direct_message', {
    p_recipient_username: username.trim().toLowerCase(),
    p_body: body,
  })
  if (error) throw error
}

/**
 * Full conversation with a matched user, oldest first.
 */
export async function getConversation(username) {
  const { data, error } = await supabase.rpc('get_conversation', {
    p_other_username: username.trim().toLowerCase(),
  })
  if (error) throw error
  return data ?? []
}
