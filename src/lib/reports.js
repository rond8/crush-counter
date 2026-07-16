import { supabase } from '../supabaseClient'

export const REPORT_REASONS = [
  'Harassment or bullying',
  'Spam',
  'Inappropriate content',
  'Fake profile',
  'Underage user',
  'Other',
]

/**
 * Report a specific message. The sender is resolved server-side for
 * moderation review — never revealed back to the reporter, even for
 * anonymous admirer messages.
 */
export async function reportMessage(messageId, reason, details) {
  const { error } = await supabase.rpc('report_message', {
    p_message_id: messageId,
    p_reason: reason,
    p_details: details?.trim() || null,
  })
  if (error) throw error
}

/**
 * Report a user's profile directly.
 */
export async function reportUser(username, reason, details) {
  const { error } = await supabase.rpc('report_user', {
    p_username: username.trim().toLowerCase(),
    p_reason: reason,
    p_details: details?.trim() || null,
  })
  if (error) throw error
}
