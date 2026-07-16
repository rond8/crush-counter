import { supabase } from '../supabaseClient'

/**
 * Send a message to the current user's active crush.
 * Fails server-side if no crush is set.
 */
export async function sendMessage(body) {
  const { error } = await supabase.rpc('send_message', { p_body: body.trim() })
  if (error) throw error
}

/**
 * Messages received by the current user. `from_username` is only
 * populated for current mutual matches — otherwise the sender stays
 * anonymous.
 */
export async function getMyMessages() {
  const { data, error } = await supabase.rpc('get_my_messages')
  if (error) throw error
  return data ?? []
}

/**
 * Messages the current user has sent (they already know who they
 * sent them to, so this reads the table directly).
 */
export async function getMySentMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, target_username, body, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}
