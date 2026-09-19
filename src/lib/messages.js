import { supabase } from '../supabaseClient'

/**
 * All received messages, newest first. Anonymity is resolved
 * server-side: `from_username` is only populated for a current
 * mutual match; everyone else comes back as a stable per-recipient
 * `admirer_label` (e.g. "Anonymous Admirer 2") so the client never
 * sees a raw sender_id for anonymous senders.
 */
export async function getMyMessages() {
  const { data, error } = await supabase.rpc('get_my_messages')
  if (error) throw error
  return data ?? []
}

/**
 * Messages the current user has sent. Anonymity is resolved
 * server-side the same way as getMyMessages(): `to_username` is
 * only populated for a current mutual match, otherwise the reply
 * comes back tagged with the same stable `admirer_label` used for
 * that person's incoming thread, so sent + received replies to an
 * anonymous admirer collapse into one conversation instead of two.
 */
export async function getMySentMessages() {
  const { data, error } = await supabase.rpc('get_my_sent_messages')
  if (error) throw error
  return data ?? []
}

/**
 * Upload a photo attachment to the 'message-photos' bucket, scoped to
 * the sender's own folder, and return its public URL. Auto-deleted
 * 24h after send via a DB trigger + hourly cron job (see schema.sql).
 */
export async function uploadMessagePhoto(userId, file) {
  const MAX_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    throw new Error('Photo is too large — max 5MB.')
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('message-photos')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('message-photos').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Send a message to a specific recipient, falling back to the user's
 * active crush if none given. Either body text or a photo (or both)
 * must be present. Photos are wiped 24h after sending.
 */
export async function sendMessage(body, recipientUsername = null, parentId = null, imageUrl = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in to send a message.')

  const cleanBody = (body || '').trim()
  if (!cleanBody && !imageUrl) {
    throw new Error('Message cannot be empty.')
  }

  let targetUser = recipientUsername

  if (!targetUser) {
    const { data: crush, error: crushErr } = await supabase
      .from('crushes')
      .select('target_username')
      .eq('sender_id', user.id)
      .maybeSingle()

    if (crushErr || !crush?.target_username) {
      throw new Error('You must select a crush before sending a message.')
    }
    targetUser = crush.target_username
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        sender_id: user.id,
        target_username: targetUser.trim().toLowerCase(),
        body: cleanBody,
        parent_id: parentId,
        image_url: imageUrl || null,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft-delete a message for either sender or receiver.
 */
export async function deleteMessage(messageId, isSender = false) {
  const { error } = await supabase.rpc('delete_message', {
    p_message_id: messageId,
    p_is_sender: isSender,
  })
  if (error) throw error
  return true
}

/**
 * Mark received messages as read. Pass a sender_id to mark just one
 * thread (used when opening a conversation); omit it to mark
 * everything read at once.
 */
export async function markMessagesAsRead(senderId = null) {
  const { error } = await supabase.rpc('mark_messages_read', { p_sender_id: senderId })
  if (error) throw error
}

/**
 * Count of unread, non-deleted received messages — for the navbar
 * badge.
 */
export async function getUnreadMessageCount() {
  const { data, error } = await supabase.rpc('get_unread_message_count')
  if (error) throw error
  return data ?? 0
}

export async function replyToAdmirer(admirerLabel, body, imageUrl = null) {
  const { error } = await supabase.rpc('reply_to_labeled_sender', {
    p_admirer_label: admirerLabel,
    p_body: body,
    p_image_url: imageUrl,
  })
  if (error) throw error
}

/**
 * Mark just one thread's messages as read — by known username, or by
 * the stable admirer_label for an anonymous sender. Never needs a
 * raw sender_id client-side.
 */
export async function markThreadRead({ username = null, admirerLabel = null } = {}) {
  const { error } = await supabase.rpc('mark_thread_read', {
    p_username: username,
    p_admirer_label: admirerLabel,
  })
  if (error) throw error
}