import { supabase } from '../supabaseClient'

/**
 * Send a friend request to another user by username.
 */
export async function sendFriendRequest(targetUsername) {
  const { error } = await supabase.rpc('send_friend_request', {
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
}

/**
 * Get all pending incoming friend requests for the current user.
 */
export async function getPendingFriendRequests() {
  const { data, error } = await supabase.rpc('get_pending_friend_requests')
  if (error) throw error
  return data ?? []
}

/**
 * Accept a friend request by ID.
 */
export async function acceptFriendRequest(requestId) {
  const { error } = await supabase.rpc('accept_friend_request', {
    p_request_id: requestId,
  })
  if (error) throw error
}

/**
 * Reject / Cancel a friend request by ID.
 */
export async function rejectFriendRequest(requestId) {
  const { error } = await supabase.rpc('reject_friend_request', {
    p_request_id: requestId,
  })
  if (error) throw error
}

/**
 * List all current friends.
 */
export async function getFriendsList() {
  const { data, error } = await supabase.rpc('get_friends_list')
  if (error) throw error
  return data ?? []
}

/**
 * Remove a friend by their profile ID.
 */
export async function removeFriend(friendId) {
  const { error } = await supabase.rpc('remove_friend', {
    p_friend_id: friendId,
  })
  if (error) throw error
}

/**
 * Poke a friend to say hi!
 */
export async function pokeUser(targetUsername) {
  const { error } = await supabase.rpc('poke_user', {
    p_target_username: targetUsername.trim().toLowerCase(),
  })
  if (error) throw error
}

/**
 * Get random users for the "Discover" section.
 */
export async function getDiscoverProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, is_verified')
    .neq('id', (await supabase.auth.getUser()).data.user.id)
    .limit(10)
  if (error) throw error
  return data ?? []
}

/**
 * Check relationship status with a specific user.
 * Returns { status: 'none' | 'pending_sent' | 'pending_received' | 'friends', points: number }
 */
export async function getRelationshipStatus(targetId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'none', points: 0 }

  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${targetId}),and(user_id.eq.${targetId},friend_id.eq.${user.id})`)
    .maybeSingle()

  if (error) throw error
  if (!data) return { status: 'none', points: 0 }

  if (data.status === 'accepted') return { status: 'friends', points: data.points || 0 }

  if (data.user_id === user.id) return { status: 'pending_sent', points: 0 }
  return { status: 'pending_received', points: 0 }
}

export function getFriendLevel(points = 0) {
  if (points >= 1000) return { lv: 5, label: 'Soulmates', color: '#D946EF' }
  if (points >= 500) return { lv: 4, label: 'Best Friends', color: '#F59E0B' }
  if (points >= 200) return { lv: 3, label: 'Close Friends', color: '#3B82F6' }
  if (points >= 50) return { lv: 2, label: 'Good Friends', color: '#10B981' }
  return { lv: 1, label: 'New Friends', color: '#64748B' }
}
