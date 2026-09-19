import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function StreakReward() {
  const { profile } = useAuth()
  const [show, setShow] = useState(false)

  // Logic: Streaks are often tracked by 'consecutive_logins' or similar.
  // We'll show a summary of their current progress.
  const streakCount = profile?.streak_days ?? 0
  const days = [1, 2, 3, 4, 5, 6, 7]

  useEffect(() => {
    // Only show if user just logged in or periodically on dashboard
    const timer = setTimeout(() => setShow(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="card p-5 space-y-4 bg-gradient-to-br from-indigo-900/40 to-midnight border-indigo-500/30">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-sm font-black text-white flex items-center gap-2">
             🔥 {streakCount} Day Streak!
           </h3>
           <p className="text-[10px] text-indigo-200/70">Login tomorrow to keep it going.</p>
        </div>
        <div className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-lg">
           NEXT: +5 Coins
        </div>
      </div>

      <div className="flex justify-between items-center gap-1.5">
        {days.map((d) => {
          const isPast = d < streakCount
          const isCurrent = d === streakCount
          const isFuture = d > streakCount
          const isRewardDay = d === 7

          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-1.5">
               <div className={`w-full h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all
                 ${isPast ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                   isCurrent ? 'bg-heart-purple text-white animate-pulse ring-2 ring-white/20' :
                   'bg-white/5 text-muted'}
               `}>
                 {isPast ? '✓' : isRewardDay ? '🎁' : `Day ${d}`}
               </div>
               {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-heart-purple" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
