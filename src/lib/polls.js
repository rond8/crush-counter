import { supabase } from '../supabaseClient'

/**
 * All polls with their options, live vote counts, and which option
 * (if any) the caller already voted for. Returns flat rows — group
 * by poll_id to render.
 */
export async function getPollRows() {
  const { data, error } = await supabase.rpc('get_polls')
  if (error) throw error
  return data ?? []
}

/**
 * Groups the flat rows from getPollRows() into one object per poll.
 */
export function groupPolls(rows) {
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.poll_id)) {
      map.set(r.poll_id, {
        id: r.poll_id,
        question: r.question,
        created_at: r.created_at,
        closed_at: r.closed_at,
        my_option_id: r.my_option_id,
        options: [],
      })
    }
    map.get(r.poll_id).options.push({
      id: r.option_id,
      label: r.option_label,
      image_url: r.option_image_url,
      color: r.option_color,
      vote_count: r.vote_count,
    })
  }
  return Array.from(map.values())
}

/**
 * Admin-only: create a poll. `options` is an array of
 * { label, imageUrl, color } — imageUrl and color are both optional
 * (pass '' or omit them). Needs 2+ options with a non-empty label.
 */
export async function createPoll(question, options) {
  const payload = options.map((o) => ({
    label: o.label,
    image_url: o.imageUrl || null,
    color: o.color || null,
  }))
  const { error } = await supabase.rpc('create_poll', {
    p_question: question.trim(),
    p_options: payload,
  })
  if (error) throw error
}

/**
 * Admin-only: close a poll so it stops accepting votes.
 */
export async function closePoll(pollId) {
  const { error } = await supabase.rpc('close_poll', { p_poll_id: pollId })
  if (error) throw error
}

/**
 * Cast a vote. One vote per poll per account, not changeable.
 */
export async function votePoll(optionId) {
  const { error } = await supabase.rpc('vote_poll', { p_option_id: optionId })
  if (error) throw error
}