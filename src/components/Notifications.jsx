import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AUTO_DISMISS_MS = 7000

export default function Notifications() {
  const { dailyReward, clearDailyReward, newAdmirer, clearNewAdmirer } = useAuth()

  useEffect(() => {
    if (!dailyReward) return
    const timer = setTimeout(clearDailyReward, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [dailyReward, clearDailyReward])

  useEffect(() => {
    if (!newAdmirer) return
    const timer = setTimeout(clearNewAdmirer, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [newAdmirer, clearNewAdmirer])

  if (!dailyReward && !newAdmirer) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {newAdmirer && (
        <Link
          to="/dashboard"
          onClick={clearNewAdmirer}
          className="card ring-1 ring-heart-red/50 shadow-glow px-4 py-3 flex items-center gap-3 animate-pulseGlow"
        >
          <span className="text-2xl">❤️</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-heart-red">
              {newAdmirer.new_count === 1
                ? 'Someone new has a crush on you!'
                : `${newAdmirer.new_count} new people have a crush on you!`}
            </p>
            <p className="text-xs text-muted">Tap to view</p>
          </div>
        </Link>
      )}

      {dailyReward && (
        <div className="card ring-1 ring-heart-yellow/50 px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🪙</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-heart-yellow">
              +{dailyReward.amount} daily coins!
            </p>
            <p className="text-xs text-muted">Balance: {dailyReward.new_balance}</p>
          </div>
          <button
            onClick={clearDailyReward}
            aria-label="Dismiss"
            className="text-muted hover:text-ink text-lg leading-none px-1"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
