import { supabase } from '../supabaseClient'

/**
 * Fetch received messages for the logged-in user
 */
export async function getMyMessages() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch profile to get current user's username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile?.username) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('target_username', profile.username)
    .eq('deleted_by_receiver', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching received messages:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch sent messages by the logged-in user
 */
export async function getMySentMessages() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('sender_id', user.id)
    .eq('deleted_by_sender', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sent messages:', error)
    throw error
  }

  return data || []
}

/**
 * Send a message to a specific recipient, falling back to the user's active crush
 */
export async function sendMessage(body, recipientUsername = null, parentId = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be logged in to send a message.')

  let targetUser = recipientUsername

  // If no direct recipient was supplied, look up active crush as fallback
  if (!targetUser) {
    const { data: crush, error: crushErr } = await supabase
      .from('crushes')
      .select('target_username')
      .eq('user_id', user.id)
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
        body,
        parent_id: parentId,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    throw error
  }

  return data
}

/**
 * Soft-delete a message for either sender or receiver
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
 * Mark all unread received messages as read for the logged-in user
 */
export async function markMessagesAsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile?.username) return

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('target_username', profile.username)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
  }
}

/**
 * Count of unread, non-deleted received messages for the logged-in
 * user — for the navbar badge. Same access pattern as getMyMessages()
 * (recipients can read their own target_username rows directly).
 */
export async function getUnreadMessageCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile?.username) return 0

  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('target_username', profile.username)
    .eq('is_read', false)
    .eq('deleted_by_receiver', false)

  if (error) {
    console.error('Error fetching unread message count:', error)
    return 0
  }

  return count || 0
}