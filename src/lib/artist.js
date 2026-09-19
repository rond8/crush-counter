import { supabase } from '../supabaseClient'

/**
 * Upload an artwork image to the 'avatars' storage bucket.
 * Matches existing bucket policies: (foldername)[1] must be user.id
 */
export async function uploadArtwork(file, caption) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ext = file.name.split('.').pop() || 'jpg'
  // Path must start with user.id to satisfy storage RLS policies
  const fileName = `${Date.now()}.${ext}`
  const path = `${user.id}/artworks/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (uploadError) {
    console.error('Storage error:', uploadError)
    throw new Error('Image upload failed. Please try again.')
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)

  const { error: dbError } = await supabase.from('artworks').insert({
    user_id: user.id,
    image_url: data.publicUrl,
    caption: caption.trim()
  })

  if (dbError) {
    console.error('Database error:', dbError)
    if (dbError.code === '42501') {
      throw new Error('Permission denied. Please run the SQL in T.SQL to fix gallery access.')
    }
    throw new Error('Could not save artwork details.')
  }

  return data.publicUrl
}

/**
 * Get all artworks for the global feed.
 */
export async function getArtFeed() {
  const { data, error } = await supabase
    .from('artworks')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Like an artwork.
 */
export async function likeArtwork(artworkId) {
  const { error } = await supabase.rpc('like_artwork', { p_artwork_id: artworkId })
  if (error) throw error
}
