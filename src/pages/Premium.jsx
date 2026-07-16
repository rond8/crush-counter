import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { unlockPremium } from '../lib/profile'

const FAME_THRESHOLD = 500
const UNLOCK_COST = 50

export default function Premium() {
  const { profile, refreshProfile } = useAuth()
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState('')

  const fame = profile?.fame ?? 0
  const hasPremium = fame >= FAME_THRESHOLD || Boolean(profile?.premium_unlocked)
  const progressPct = Math.min(100, Math.round((fame / FAME_THRESHOLD) * 100))
  const canAfford = (profile?.coins ?? 0) >= UNLOCK_COST

  const handleUnlock = async () => {
    setError('')
    setUnlocking(true)
    try {
      await unlockPremium()
      await refreshProfile()
    } catch (err) {
      setError(err.message || 'Could not unlock premium.')
    } finally {
      setUnlocking(false)
    }
  }

  if (hasPremium) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 space-y-8 text-center">
        <div className="text-5xl">👑</div>
        <h1 className="font-display text-3xl md:text-4xl">Welcome to Premium</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          You've unlocked full access — your crown badge shows on your profile, and you're
          part of the smallest, most legendary corner of Crush Counter.
        </p>

        <div className="card p-6 max-w-sm mx-auto space-y-2">
          <p className="text-sm text-muted">Unlocked because you</p>
          <p className="text-ink font-semibold">
            {fame >= FAME_THRESHOLD ? `Reached ${FAME_THRESHOLD}+ fame 🌟` : 'Purchased with coins 🪙'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-14 space-y-8 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="font-display text-3xl md:text-4xl">Premium</h1>
      <p className="text-muted text-sm max-w-md mx-auto">
        A crown badge on your profile, and bragging rights. Unlock it by reaching{' '}
        {FAME_THRESHOLD} fame, or skip the wait with coins.
      </p>

      <div className="card p-6 max-w-sm mx-auto space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Fame progress</span>
          <span className="text-ink font-semibold">
            {fame} / {FAME_THRESHOLD}
          </span>
        </div>
        <div className="h-2 rounded-full bg-midnight-border overflow-hidden">
          <div
            className="h-full bg-heart-yellow transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted">
          Earn fame from 🔥 and 🕯️ items in the spin, or profile likes.
        </p>
      </div>

      <div className="flex items-center gap-3 justify-center text-xs text-muted">
        <span className="flex-1 h-px bg-midnight-border max-w-16" />
        or
        <span className="flex-1 h-px bg-midnight-border max-w-16" />
      </div>

      <div className="card p-6 max-w-sm mx-auto space-y-3">
        <p className="text-sm text-muted">Skip straight to it</p>
        <button
          onClick={handleUnlock}
          disabled={unlocking || !canAfford}
          className="btn-primary w-full"
        >
          {unlocking ? 'Unlocking…' : `Unlock for ${UNLOCK_COST} 🪙`}
        </button>
        {!canAfford && (
          <p className="text-xs text-muted">
            You have {profile?.coins ?? 0} coins — spin daily to earn more.
          </p>
        )}
        {error && <p className="text-heart-red text-sm">{error}</p>}
      </div>
    </div>
  )
}
