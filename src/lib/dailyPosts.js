import { supabase } from '../supabaseClient'

/**
 * Check if the user has already posted in the last 24 hours.
 */
export async function canPostToday() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('daily_posts')
    .select('created_at')
    .eq('user_id', user.id)
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle()

  if (error) return true
  return !data
}

/**
 * Upload a daily photo to Supabase Storage.
 */
export async function createDailyPost(file, caption) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. Check limit
  const can = await canPostToday()
  if (!can) throw new Error('You can only post once every 24 hours!')

  // 2. Upload to Supabase Storage (daily_snaps bucket)
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars') // Using your existing working bucket for now
    .upload(`daily_snaps/${path}`, file, { upsert: true, cacheControl: '3600' })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(`daily_snaps/${path}`)

  // 3. Save metadata
  const { error: dbError } = await supabase.from('daily_posts').insert({
    user_id: user.id,
    image_url: urlData.publicUrl,
    caption: caption.trim()
  })

  if (dbError) throw dbError
  return urlData.publicUrl
}

/**
 * Get the global feed (only posts from the last 24 hours).
 */
export async function getDailyFeed() {
  const { data, error } = await supabase
    .from('daily_posts')
    .select('*, profiles(username, avatar_url)')
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Like a daily post.
 */
export async function likeDailyPost(postId) {
  const { error } = await supabase.rpc('like_daily_post', { p_post_id: postId })
  if (error) throw error
}

/**
 * Add a comment to a daily post.
 */
export async function addDailyComment(postId, body) {
  const { error } = await supabase.from('daily_post_comments').insert({
    post_id: postId,
    user_id: (await supabase.auth.getUser()).data.user.id,
    body: body.trim()
  })
  if (error) throw error
}

/**
 * Get comments for a post.
 */
export async function getDailyComments(postId) {
  const { data, error } = await supabase
    .from('daily_post_comments')
    .select('*, profiles(username)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}
