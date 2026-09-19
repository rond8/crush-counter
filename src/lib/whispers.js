import { supabase } from '../supabaseClient'

/**
 * Fetch whispers with search, tag filtering, and optional parent_id for replies.
 * Uses v4 for case-insensitive tags and random sorting.
 */
export async function getWhispers(search = '', tag = '', parentId = null) {
  const { data, error } = await supabase.rpc('get_whispers_v4', {
    p_search: search?.trim() || '',
    p_tag: tag?.trim() || '',
    p_parent_id: parentId
  })

  if (error) throw error
  return data ?? []
}

/**
 * Post a new secret whisper or a reply.
 */
export async function postWhisper(body, color, tags = [], isAnonymous = true, parentId = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Normalize tags to lowercase for consistent searching
  const cleanTags = (tags || []).map(t => t.trim().toLowerCase())

  const { error } = await supabase.from('whispers').insert({
    user_id: user.id,
    body: body.trim(),
    color: color || '#8B5CF6',
    tags: cleanTags,
    is_anonymous: isAnonymous,
    parent_id: parentId
  })

  if (error) throw error
}

/**
 * Like a whisper.
 */
export async function likeWhisper(whisperId) {
  const { data, error } = await supabase.rpc('like_whisper', { p_whisper_id: whisperId })
  if (error) throw error
  return data // returns boolean (true if newly liked)
}

/**
 * Delete own whisper.
 */
export async function deleteWhisper(whisperId) {
  const { error } = await supabase.rpc('delete_whisper', { p_whisper_id: whisperId })
  if (error) throw error
}

/**
 * Report a whisper.
 */
export async function reportWhisper(whisperId, reason, details) {
  const { error } = await supabase.rpc('report_whisper', {
    p_whisper_id: whisperId,
    p_reason: reason,
    p_details: details
  })
  if (error) throw error
}

/**
 * Fetch non-anonymous whispers for a specific user.
 */
export async function getUserPublicWhispers(username) {
  const { data, error } = await supabase.rpc('get_whispers_v4', {
    p_search: `@${username}`, // Search for their @username in the body or tags if needed, but the RPC might need a better way
    p_tag: '',
    p_parent_id: null
  })

  if (error) throw error
  // Filter client-side to be sure we only get non-anon posts by this user
  return (data ?? []).filter(w => !w.is_anonymous && w.author_username === username)
}
