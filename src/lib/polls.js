import { supabase } from '../supabaseClient' // Adjust path to match your client location

/**
 * Fetch all flat rows from the get_polls RPC procedure.
 */
export async function getPollRows() {
  const { data, error } = await supabase.rpc('get_polls')
  if (error) throw new Error(error.message || 'Failed to fetch polls')
  return data ?? []
}

/**
 * Groups flat RPC rows into nested poll objects and sorts options
 * within each poll by vote_count descending.
 */
export function groupPolls(rows) {
  if (!Array.isArray(rows)) return []

  const map = new Map()

  for (const r of rows) {
    if (!r || !r.poll_id) continue

    if (!map.has(r.poll_id)) {
      map.set(r.poll_id, {
        id: r.poll_id,
        question: r.question,
        description: r.poll_description || null,
        image_url: r.poll_image_url || null,
        type: r.poll_type || 'A', // 'A' (admin-only) or 'B' (community allowed)
        created_at: r.created_at,
        closed_at: r.closed_at,
        my_option_id: r.my_option_id,
        options: [],
      })
    }

    if (r.option_id) {
      map.get(r.poll_id).options.push({
        id: r.option_id,
        label: r.option_label || '',
        image_url: r.option_image_url || null,
        color: r.option_color || null,
        is_approved: r.is_approved ?? true,
        vote_count: Number(r.vote_count) || 0,
      })
    }
  }

  // Sort options inside each poll by vote_count descending
  return Array.from(map.values()).map((poll) => ({
    ...poll,
    options: poll.options.sort((a, b) => b.vote_count - a.vote_count),
  }))
}

/**
 * Admin: Create a poll (Type A or B).
 * Note: Requires 'image_url' column in 'polls' table and 'p_image_url' parameter in 'create_poll' RPC.
 */
export async function createPoll(question, options, pollType = 'A', imageUrl = null, description = null) {
  const payload = options.map((o) => ({
    label: o.label,
    image_url: o.image_url || null,
    color: o.color || null,
  }))

  const { error } = await supabase.rpc('create_poll', {
    p_question: question.trim(),
    p_options: payload,
    p_type: pollType,
    p_image_url: imageUrl,
    p_description: description?.trim() || null,
  })
  if (error) throw new Error(error.message || 'Failed to create poll')
}

/**
 * User: Submit a custom option for a Type B poll.
 */
export async function submitOption(pollId, label, imageUrl = null, color = null) {
  const { error } = await supabase.rpc('submit_poll_option', {
    p_poll_id: pollId,
    p_label: label.trim(),
    p_image_url: imageUrl,
    p_color: color,
  })
  if (error) throw new Error(error.message || 'Failed to submit option')
}

/**
 * User: Join a Weekly Contest poll (Type 'W').
 * Costs 10 coins, adds the user as an option.
 */
export async function joinContestPoll(pollId) {
  const { error } = await supabase.rpc('join_contest_poll', {
    p_poll_id: pollId,
  })
  if (error) throw new Error(error.message || 'Failed to join contest')
}

/**
 * Admin: Approve a suggested user option.
 */
export async function approveOption(optionId) {
  const { error } = await supabase.rpc('approve_poll_option', {
    p_option_id: optionId,
  })
  if (error) throw new Error(error.message || 'Failed to approve option')
}

/**
 * Admin: Reject / Delete a suggested user option.
 */
export async function rejectOption(optionId) {
  const { error } = await supabase.rpc('reject_poll_option', {
    p_option_id: optionId,
  })
  if (error) throw new Error(error.message || 'Failed to reject option')
}

/**
 * Admin: Close a poll.
 */
export async function closePoll(pollId) {
  const { error } = await supabase.rpc('close_poll', { p_poll_id: pollId })
  if (error) throw new Error(error.message || 'Failed to close poll')
}

/**
 * Admin: Delete a poll along with options and votes.
 */
export async function deletePoll(pollId) {
  const { error } = await supabase.rpc('delete_poll', { p_poll_id: pollId })
  if (error) throw new Error(error.message || 'Failed to delete poll')
}

/**
 * Cast a free daily vote or an extra vote using a coin.
 */
export async function votePoll(optionId, useCoin = false) {
  const { error } = await supabase.rpc('vote_poll', {
    p_option_id: optionId,
    p_use_coin: useCoin,
  })
  if (error) throw new Error(error.message || 'Failed to cast vote')
}

/**
 * Upload an image for a poll option to the 'polls' storage bucket.
 */
export async function uploadPollImage(file) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars') // Use existing 'avatars' bucket instead of 'polls' to avoid "Bucket not found"
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}