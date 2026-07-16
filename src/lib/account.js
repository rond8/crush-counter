import { supabase } from '../supabaseClient'

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function updateEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}

/**
 * Permanently deletes the current user's account and all associated
 * data (profile, crushes, messages, inventory, notifications, avatar).
 * Cannot be undone.
 */
export async function deleteMyAccount(userId) {
  // Supabase blocks direct SQL deletes on storage.objects even for
  // privileged roles, so avatar cleanup has to go through the actual
  // Storage API from here rather than inside the delete_my_account()
  // database function.
  if (userId) {
    const { data: files } = await supabase.storage.from('avatars').list(userId)
    if (files?.length) {
      const paths = files.map((f) => `${userId}/${f.name}`)
      await supabase.storage.from('avatars').remove(paths)
    }
  }

  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
}
