import { supabase } from '../supabaseClient'

/**
 * Purchase permanent premium access with coins (one-time). Reaching
 * 500 fame unlocks it for free too — this is only needed otherwise.
 */
export async function unlockPremium() {
  const { data, error } = await supabase.rpc('unlock_premium')
  if (error) throw error
  return data
}

/**
 * Look up a single public profile by username, for the profile-viewing
 * page. Only ever returns the fields the person chose to fill in —
 * never crush/admirer/match data, which stays private to each account.
 */
export async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, gender, relationship_status, age, location, bio, last_seen, fame, premium_unlocked, is_verified')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Like a profile — costs 1 coin, gives the owner +1 fame. Repeatable,
 * no limit on how many times you can like the same profile. Choose
 * whether this like is anonymous or shows your username in the
 * resulting notification.
 */
export async function likeProfile(username, anonymous = true) {
  const { error } = await supabase.rpc('like_profile', {
    p_username: username.trim().toLowerCase(),
    p_anonymous: anonymous,
  })
  if (error) throw error
}

/**
 * Total like count for a profile.
 */
export async function getProfileLikeCount(username) {
  const { data, error } = await supabase.rpc('get_profile_like_count', {
    p_username: username.trim().toLowerCase(),
  })
  if (error) throw error
  return data ?? 0
}

/**
 * Update the current user's profile fields.
 */
export async function updateProfile(userId, fields) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId)
  if (error) throw error
}

/**
 * Upload a profile picture to the 'avatars' storage bucket, scoped to
 * the user's own folder, and return its public URL.
 */
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Look up registered usernames starting with the given text, so the
 * sender can confirm they've got the right account before sending a
 * heart. Excludes the caller's own username from results.
 */
export async function searchUsernames(query, excludeUsername) {
  const clean = query.trim().toLowerCase()
  if (!clean) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url')
    .ilike('username', `${clean}%`)
    .limit(6)
  if (error) throw error

  return (data ?? []).filter((p) => p.username !== excludeUsername)
}
