import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { claimDailyCoins } from '../lib/game'

const STORAGE_KEY = 'crush-counter-daily-loop'

function readState() {
  if (typeof window === 'undefined') {
    return { claimedToday: false, streak: 0 }
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return { claimedToday: false, streak: 0 }
  }
}

export default function DailyLoopCard() {
  const { profile, refreshProfile } = useAuth()
  const [state, setState] = useState(readState)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  const handleClaim = async () => {
    setClaiming(true)
    setMessage('')
    try {
      const result = await claimDailyCoins()
      if (result?.awarded) {
        const nextStreak = (state.streak || 0) + 1
        setState({ claimedToday: true, streak: nextStreak })
        setMessage(`+${result.amount} 🪙 collected — streak ${nextStreak}`)
        await refreshProfile()
      } else {
        setState((prev) => ({ ...prev, claimedToday: true }))
        setMessage('You already collected today’s reward.')
      }
    } catch (err) {
      setMessage(err.message || 'Could not claim today’s reward.')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <section className="card p-5 space-y-3 ring-1 ring-heart-purple/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">🌈 Daily loop</p>
          <p className="text-sm text-muted">Claim your daily reward, then jump into a quick action to stay engaged.</p>
        </div>
        <span className="rounded-full border border-heart-purple/30 px-3 py-1 text-xs text-heart-purple">
          Streak {state.streak || 0}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleClaim} disabled={claiming || state.claimedToday} className="btn-primary !px-4 !py-2 text-sm">
          {claiming ? 'Claiming…' : state.claimedToday ? 'Collected today ✓' : 'Claim daily reward'}
        </button>
        <Link to="/spin" className="btn-ghost !px-4 !py-2 text-sm">
          🎡 Spin for more
        </Link>
        <Link to="/thoughts" className="btn-ghost !px-4 !py-2 text-sm">
          💭 Share a post
        </Link>
      </div>

      {message && <p className="text-sm text-heart-green">{message}</p>}
      <p className="text-xs text-muted">
        Current balance: {profile?.coins ?? 0} 🪙 · {profile?.fame ?? 0} 🌟
      </p>
    </section>
  )
}
