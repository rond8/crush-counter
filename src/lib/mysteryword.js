import { supabase } from '../supabaseClient'

/**
 * Queue a word for a future day. One per person per calendar day.
 */
export async function submitMysteryWord(word) {
  const { error } = await supabase.rpc('submit_mystery_word', { p_word: word })
  if (error) throw error
}

/**
 * Today's word info — length only, never the plaintext, unless the
 * caller has already solved it themselves.
 */
export async function getTodaysMysteryWord() {
  const { data, error } = await supabase.rpc('get_todays_mystery_word')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Submit a guess for today's word. Returns { correct, word (only if
 * correct), guesses_remaining, new_coins, new_fame }.
 */
export async function guessMysteryWord(guess) {
  const { data, error } = await supabase.rpc('guess_mystery_word', { p_guess: guess })
  if (error) throw error
  return data?.[0] ?? null
}