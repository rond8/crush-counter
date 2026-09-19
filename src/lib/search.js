import { supabase } from '../supabaseClient'

/**
 * Searches for users by username or display name.
 */
export async function globalSearchUsers(query) {
  if (!query || query.length < 2) return []
  const clean = query.trim().toLowerCase()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, fame, is_verified')
    .or(`username.ilike.%${clean}%,display_name.ilike.%${clean}%`)
    .limit(10)

  if (error) throw error
  return data ?? []
}

/**
 * Searches for whispers containing the query text.
 */
export async function globalSearchWhispers(query) {
  if (!query || query.length < 2) return []
  const { data, error } = await supabase.rpc('get_whispers_v3', {
    p_search: query.trim()
  })

  if (error) throw error
  return data ?? []
}

/**
 * Common app routes for quick navigation.
 */
export const APP_SHORTCUTS = [
  { label: 'Spin Wheel', to: '/spin', icon: '🎡' },
  { label: 'Art Corner', to: '/art-corner', icon: '🎨' },
  { label: 'Whisper Wall', to: '/whispers', icon: '🤫' },
  { label: 'Admirers Radar', to: '/radar', icon: '📡' },
  { label: 'Shop Items', to: '/shop', icon: '🛍️' },
  { label: 'Missions', to: '/missions', icon: '🎯' },
  { label: 'Premium Status', to: '/premium', icon: '👑' },
  { label: 'Edit Profile', to: '/profile/edit', icon: '✏️' },
]
