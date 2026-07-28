import { supabase } from '../supabaseClient'

export const PET_SPECIES = ['dog', 'cat', 'bunny', 'dragon', 'chick']

const ASSET_BASE = 'https://ifhtaieggnvoaeuecuxd.supabase.co/storage/v1/object/public/game-assets'

/**
 * Path to the correct sprite for a species + state. state is
 * 'normal' | 'sick' | 'dead'. Served from the public 'game-assets'
 * bucket in Supabase Storage rather than a local /public folder.
 */
export function getPetImage(species, state = 'normal') {
  const suffix = state === 'normal' ? '' : state
  return `${ASSET_BASE}/pets/${species}${suffix}.png`
}

/**
 * Pick a random species client-side. Used only for the first, free
 * reveal before any coins are involved — purely cosmetic, since the
 * server independently validates whatever species is eventually
 * submitted to adoptPet().
 */
export function rollRandomSpecies() {
  return PET_SPECIES[Math.floor(Math.random() * PET_SPECIES.length)]
}

/**
 * Reroll to a new random species — costs 1 coin, deducted
 * server-side. Returns the new species.
 */
export async function rerollPetSpecies() {
  const { data, error } = await supabase.rpc('reroll_pet_species')
  if (error) throw error
  return data
}

/**
 * The caller's current pet state, or null if they've never adopted
 * one. Decay is applied server-side before this returns, so stats
 * are always current.
 */
export async function getMyPet() {
  const { data, error } = await supabase.rpc('get_my_pet')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Adopt a new pet with the given name and species. Fails if the
 * caller already has a living one.
 */
export async function adoptPet(name, species) {
  const { error } = await supabase.rpc('adopt_pet', {
    p_name: name.trim(),
    p_species: species,
  })
  if (error) throw error
}

/**
 * Feed the pet — costs coins, restores hunger.
 */
export async function feedPet() {
  const { data, error } = await supabase.rpc('feed_pet')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Play with the pet — costs coins, restores happiness, costs a
 * little hunger.
 */
export async function playWithPet() {
  const { data, error } = await supabase.rpc('play_with_pet')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Heal a sick pet — costs coins, cures sickness and restores health.
 */
export async function healPet() {
  const { data, error } = await supabase.rpc('heal_pet')
  if (error) throw error
  return data?.[0] ?? null
}

/**
 * Abandon the caller's current living pet. Permanently deletes it —
 * the next adoptPet() call starts completely fresh.
 */
export async function abandonPet() {
  const { error } = await supabase.rpc('abandon_pet')
  if (error) throw error
}

export const SPECIES_YIELD_INFO = {
  dog: { icon: '🪙', label: '+2 coins per day' },
  cat: { icon: '🌟', label: '+2 fame per day' },
  dragon: { icon: '🔥', label: 'A fire item or +10 coins per day' },
  bunny: { icon: '🪙', label: '+1-3 coins per day' },
  chick: { icon: '🎁', label: 'A random item per day' },
}

/**
 * Collect the pet's once-per-day yield. Reward depends on species —
 * see SPECIES_YIELD_INFO. Fails if already claimed today, the pet
 * has passed away, or the pet is too neglected (hunger or happiness
 * at 0) to produce anything.
 */
export async function claimPetYield() {
  const { data, error } = await supabase.rpc('claim_pet_yield')
  if (error) throw error
  return data?.[0] ?? null
}