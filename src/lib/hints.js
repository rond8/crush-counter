import { supabase } from '../supabaseClient'

/**
 * Fetch the current hint status for the user.
 * Returns { unlocked: boolean, hint: string | null, next_available_at: string | null }
 */
export async function getHintStatus() {
  const { data, error } = await supabase.rpc('get_mystery_hint_status')
  if (error) throw error
  return data?.[0] ?? { unlocked: false, hint: null, next_available_at: null }
}

/**
 * Unlock a new mystery hint using coins.
 * Costs 20 coins, limited to 1 per week.
 */
export async function unlockHint() {
  const { data, error } = await supabase.rpc('unlock_mystery_hint')
  if (error) throw error
  return data?.[0] ?? null
}
