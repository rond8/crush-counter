import { supabase } from '../supabaseClient'

/**
 * Today's featured topic, or null if the admin hasn't posted one yet.
 */
export async function getTodaysTopic() {
  const { data, error } = await supabase.rpc('get_todays_topic')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Admin-only: set (or update) today's topic.
 */
export async function postDailyTopic(topic) {
  const { error } = await supabase.rpc('post_daily_topic', { p_topic: topic.trim() })
  if (error) throw error
}

/**
 * Public feed of everyone's thoughts, newest-updated first.
 */
export async function getThoughtsFeed() {
  const { data, error } = await supabase.rpc('get_thoughts_feed')
  if (error) throw error
  return data ?? []
}

/**
 * Set (or change) the caller's single thought.
 */
export async function setThought(body) {
  const { error } = await supabase.rpc('set_thought', { p_body: body.trim() })
  if (error) throw error
}

export async function deleteMyThought() {
  const { error } = await supabase.rpc('delete_my_thought')
  if (error) throw error
}

/**
 * Like a thought: costs 1 coin, gives the author +1 fame.
 */
export async function likeThought(thoughtId) {
  const { error } = await supabase.rpc('like_thought', { p_thought_id: thoughtId })
  if (error) throw error
}
