import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getMyPet,
  adoptPet,
  feedPet,
  playWithPet,
  healPet,
  abandonPet,
  claimPetYield,
  getPetImage,
  rollRandomSpecies,
  rerollPetSpecies,
  SPECIES_YIELD_INFO,
} from '../lib/pet'
import { ITEM_INFO } from '../lib/items'
import { timeAgo } from '../lib/time'

const TICK_INTERVAL_MS = 60 * 1000
const REROLL_COST = 10

function petState(pet) {
  if (!pet.is_alive) return 'dead'
  if (pet.is_sick) return 'sick'
  return 'normal'
}

function moodEmoji(pet) {
  if (!pet.is_alive) return '⚰️'
  if (pet.is_sick) return '🤒'
  if (pet.health < 30 || pet.hunger < 20 || pet.happiness < 20) return '😢'
  if (pet.health > 80 && pet.hunger > 70 && pet.happiness > 70) return '😄'
  return '🙂'
}

// Local date string (YYYY-MM-DD) to compare against last_yield_date,
// which Postgres returns as a plain date string.
function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function describeYield(result) {
  if (!result) return ''
  if (result.reward_kind === 'coins') return `🪙 +${result.amount} coins!`
  if (result.reward_kind === 'fame') return `🌟 +${result.amount} fame!`
  if (result.reward_kind === 'item') {
    const name = ITEM_INFO[result.item_type]?.name ?? result.item_type
    return `🎁 You got a ${name}!`
  }
  return 'Collected!'
}

// Falls back to a plain emoji tile if the PNG for this species/state
// hasn't been added yet, so missing art never breaks the UI.
function PetSprite({ species, state, size = 'w-24 h-24', fallbackEmoji = '🐾' }) {
  const [failed, setFailed] = useState(false)
  const src = getPetImage(species, state)

  if (failed) {
    return (
      <div className={`${size} flex items-center justify-center text-5xl`}>
        {state === 'dead' ? '💀' : fallbackEmoji}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={`${size} object-contain`}
      onError={() => setFailed(true)}
    />
  )
}

function StatBar({ label, value, colorClass }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="text-ink font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-midnight-border overflow-hidden">
        <div
          className={`h-full transition-all ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function PetWidget() {
  const { profile, refreshProfile } = useAuth()

  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [acting, setActing] = useState(false)

  // Adoption is two steps: revealedSpecies is null before the user
  // taps to adopt. Once set, the reveal is shown and the user names
  // their pet before the adoption is actually saved. The first
  // reveal is free (client-side random); rerolling after that costs
  // coins and is resolved server-side.
  const [revealedSpecies, setRevealedSpecies] = useState(null)
  const [adoptName, setAdoptName] = useState('')
  const [adopting, setAdopting] = useState(false)
  const [adoptError, setAdoptError] = useState('')
  const [rerolling, setRerolling] = useState(false)

  const [confirmingAbandon, setConfirmingAbandon] = useState(false)
  const [abandoning, setAbandoning] = useState(false)

  const [claimingYield, setClaimingYield] = useState(false)
  const [yieldError, setYieldError] = useState('')
  const [yieldMessage, setYieldMessage] = useState('')

  const refresh = useCallback(async () => {
    const data = await getMyPet()
    setPet(data)
  }, [])

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message || 'Could not load your pet.'))
      .finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh().catch(() => {})
      }
    }, TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  const handleReveal = () => {
    setAdoptError('')
    setRevealedSpecies(rollRandomSpecies())
  }

  const handleReroll = async () => {
    setAdoptError('')
    setRerolling(true)
    try {
      const species = await rerollPetSpecies()
      setRevealedSpecies(species)
      await refreshProfile()
    } catch (err) {
      setAdoptError(err.message || 'Could not reroll right now.')
    } finally {
      setRerolling(false)
    }
  }

  const handleAdopt = async (e) => {
    e.preventDefault()
    setAdoptError('')
    if (!adoptName.trim() || !revealedSpecies) return
    setAdopting(true)
    try {
      await adoptPet(adoptName, revealedSpecies)
      setAdoptName('')
      setRevealedSpecies(null)
      await refresh()
    } catch (err) {
      setAdoptError(err.message || 'Could not adopt a pet.')
    } finally {
      setAdopting(false)
    }
  }

  const runAction = async (fn, successMsg) => {
    setError('')
    setSuccess('')
    setActing(true)
    try {
      await fn()
      setSuccess(successMsg)
      await Promise.all([refresh(), refreshProfile()])
    } catch (err) {
      setError(err.message || 'Could not do that right now.')
    } finally {
      setActing(false)
    }
  }

  const handleAbandon = async () => {
    setError('')
    setSuccess('')
    setAbandoning(true)
    try {
      await abandonPet()
      setConfirmingAbandon(false)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not abandon your pet.')
    } finally {
      setAbandoning(false)
    }
  }

  const handleClaimYield = async () => {
    setYieldError('')
    setYieldMessage('')
    setClaimingYield(true)
    try {
      const result = await claimPetYield()
      setYieldMessage(describeYield(result))
      await Promise.all([refresh(), refreshProfile()])
    } catch (err) {
      setYieldError(err.message || 'Could not collect right now.')
    } finally {
      setClaimingYield(false)
    }
  }

  if (loading) {
    return (
      <section className="card p-5">
        <p className="text-muted text-sm font-mono text-center">loading your pet…</p>
      </section>
    )
  }

  // No pet yet, or previous pet passed away — show adopt flow.
  if (!pet || !pet.is_alive) {
    // Step 2: species already revealed — now naming it.
    if (revealedSpecies) {
      return (
        <section className="card p-5 space-y-4">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <PetSprite species={revealedSpecies} state="normal" size="w-24 h-24" />
            </div>
            <h2 className="font-display text-lg">It's a {revealedSpecies}!</h2>
            <p className="text-xs text-muted">
              {SPECIES_YIELD_INFO[revealedSpecies]?.icon} {SPECIES_YIELD_INFO[revealedSpecies]?.label}
            </p>
            <p className="text-xs text-muted">What would you like to name them?</p>
          </div>

          <form onSubmit={handleAdopt} className="space-y-3">
            <input
              type="text"
              maxLength={20}
              placeholder="Give them a name"
              className="input-field text-center"
              value={adoptName}
              onChange={(e) => setAdoptName(e.target.value)}
              autoFocus
            />
            {adoptError && <p className="text-heart-red text-sm text-center">{adoptError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReroll}
                disabled={adopting || rerolling || (profile?.coins ?? 0) < REROLL_COST}
                className="btn-ghost !px-4 flex flex-col items-center leading-tight"
              >
                <span>{rerolling ? 'Rerolling…' : '🎲 Reroll'}</span>
                <span className="text-[10px] text-muted">{REROLL_COST} 🪙</span>
              </button>
              <button
                type="submit"
                disabled={adopting || rerolling || !adoptName.trim()}
                className="btn-primary flex-1"
              >
                {adopting ? 'Adopting…' : 'Confirm adoption'}
              </button>
            </div>
          </form>
        </section>
      )
    }

    // Step 1: not revealed yet.
    return (
      <section className="card p-5 space-y-4">
        <div className="text-center space-y-1">
          {pet && !pet.is_alive ? (
            <div className="flex justify-center">
              <PetSprite species={pet.species} state="dead" size="w-16 h-16" />
            </div>
          ) : (
            <p className="text-3xl">🎁</p>
          )}
          <h2 className="font-display text-lg">
            {pet && !pet.is_alive ? `${pet.name} has passed away` : 'Adopt a pet'}
          </h2>
          <p className="text-xs text-muted">
            {pet && !pet.is_alive
              ? 'Left uncared for too long. You can adopt a new one whenever you\'re ready.'
              : 'A little companion that needs feeding and attention — and rewards you daily if you take care of it.'}
          </p>
        </div>

        <button onClick={handleReveal} className="btn-primary w-full">
          Reveal your mystery pet 🎁
        </button>
      </section>
    )
  }

  const canPlay = pet.hunger >= 10
  const feedCost = 5
  const playCost = 5
  const healCost = 15
  const hasClaimedToday = pet.last_yield_date === todayStr()
  const yieldInfo = SPECIES_YIELD_INFO[pet.species]

  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-center gap-4">
        <PetSprite species={pet.species} state={petState(pet)} size="w-20 h-20" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-lg">{pet.name}</h2>
            <span className="text-lg" title="mood">
              {moodEmoji(pet)}
            </span>
            {pet.is_sick && (
              <span className="text-xs font-semibold text-heart-red px-2 py-0.5 rounded-full border border-heart-red/40">
                Sick
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            {pet.last_fed_at ? `Last fed ${timeAgo(pet.last_fed_at)}` : 'Never fed yet'}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <StatBar label="🍖 Hunger" value={pet.hunger} colorClass="bg-heart-yellow" />
        <StatBar label="💜 Happiness" value={pet.happiness} colorClass="bg-heart-purple" />
        <StatBar label="❤️ Health" value={pet.health} colorClass="bg-heart-green" />
      </div>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}
      {success && <p className="text-heart-green text-sm text-center">{success}</p>}

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => runAction(feedPet, '🍖 Fed!')}
          disabled={acting || (profile?.coins ?? 0) < feedCost}
          className="btn-ghost !px-2 !py-2 text-xs flex flex-col items-center gap-0.5"
        >
          <span>🍖 Feed</span>
          <span className="text-[10px] text-muted">{feedCost} 🪙</span>
        </button>
        <button
          onClick={() => runAction(playWithPet, '🎾 Played together!')}
          disabled={acting || !canPlay || (profile?.coins ?? 0) < playCost}
          className="btn-ghost !px-2 !py-2 text-xs flex flex-col items-center gap-0.5"
          title={!canPlay ? 'Too hungry to play — feed first' : undefined}
        >
          <span>🎾 Play</span>
          <span className="text-[10px] text-muted">{playCost} 🪙</span>
        </button>
        <button
          onClick={() => runAction(healPet, '💊 Healed!')}
          disabled={acting || !pet.is_sick || (profile?.coins ?? 0) < healCost}
          className="btn-ghost !px-2 !py-2 text-xs flex flex-col items-center gap-0.5"
          title={!pet.is_sick ? 'Not sick right now' : undefined}
        >
          <span>💊 Heal</span>
          <span className="text-[10px] text-muted">{healCost} 🪙</span>
        </button>
      </div>

      {/* Daily yield */}
      <div className="rounded-xl border border-heart-yellow/30 bg-heart-yellow/5 p-3 space-y-2 text-center">
        <p className="text-xs text-muted">
          {yieldInfo?.icon} {yieldInfo?.label ?? 'Produces a daily reward'}
        </p>
        {yieldError && <p className="text-heart-red text-xs">{yieldError}</p>}
        {yieldMessage && <p className="text-heart-green text-xs font-semibold">{yieldMessage}</p>}
        <button
          onClick={handleClaimYield}
          disabled={claimingYield || hasClaimedToday}
          className="btn-primary !px-4 !py-1.5 text-xs w-full"
        >
          {claimingYield ? 'Collecting…' : hasClaimedToday ? 'Collected today ✓' : 'Collect daily yield'}
        </button>
        {(pet.hunger === 0 || pet.happiness === 0) && !hasClaimedToday && (
          <p className="text-[10px] text-heart-red">
            Too neglected to produce today — feed and play with them first.
          </p>
        )}
      </div>

      {/* Abandon */}
      {confirmingAbandon ? (
        <div className="rounded-xl border border-heart-red/40 bg-heart-red/5 p-3 space-y-2 text-center">
          <p className="text-xs text-ink">
            Give up {pet.name} for good? This can't be undone — they won't come back.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleAbandon}
              disabled={abandoning}
              className="btn-primary !bg-heart-red !px-4 !py-1.5 text-xs"
            >
              {abandoning ? 'Abandoning…' : 'Yes, abandon'}
            </button>
            <button
              onClick={() => setConfirmingAbandon(false)}
              disabled={abandoning}
              className="btn-ghost !px-4 !py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={() => setConfirmingAbandon(true)}
            className="text-xs text-muted hover:text-heart-red transition-colors"
          >
            Abandon pet
          </button>
        </div>
      )}
    </section>
  )
}