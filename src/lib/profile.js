import { supabase } from '../supabaseClient'
import { normalizeImageUrl } from './utils'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

/**
 * Purchase permanent premium access with coins (one-time). Reaching
 * 5000 fame unlocks it for free too — this is only needed otherwise.
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
    .select('id, username, display_name, avatar_url, gender, relationship_status, age, birthday, location, bio, last_seen, fame, premium_unlocked, hobbies, likes, favorite_artist')
    .eq('username', username.trim().toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Change the caller's username. Validates format client-side (same
 * rule as registration), then relies on the DB's unique constraint
 * for the final say on availability. Crush/admirer/message references
 * to the old username are kept intact automatically by a DB trigger
 * (sync_username_change) — nothing else needs to change on rename.
 */
export async function updateUsername(userId, newUsername) {
  const clean = newUsername.trim().toLowerCase()
  if (!USERNAME_RE.test(clean)) {
    throw new Error('Username must be 3-20 characters: lowercase letters, numbers, underscores.')
  }

  const { error } = await supabase.from('profiles').update({ username: clean }).eq('id', userId)
  if (error) {
    if (error.code === '23505') {
      throw new Error('That username is already taken.')
    }
    throw error
  }
  return clean
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
  return normalizeImageUrl(data.publicUrl)
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