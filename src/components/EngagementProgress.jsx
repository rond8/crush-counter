import { useEffect, useState } from 'react'
import { getGamificationSnapshot } from '../lib/gamification'

export default function EngagementProgress({ userId, refreshToken = 0 }) {
  const [snapshot, setSnapshot] = useState(() => getGamificationSnapshot(userId))

  useEffect(() => {
    setSnapshot(getGamificationSnapshot(userId))
  }, [userId, refreshToken])

  if (!userId) return null

  return (
    <section className="card p-5 border border-heart-purple/20 bg-gradient-to-br from-heart-purple/10 to-transparent rounded-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-heart-purple">Your momentum</p>
          <h2 className="font-display text-lg font-bold text-ink mt-1">Keep the loop going</h2>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-ink">{snapshot.streak} 🔥</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">day streak</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {snapshot.achievements.map((achievement) => {
          const percentage = Math.round((achievement.progress / achievement.target) * 100)
          return (
            <div key={achievement.key} className={`rounded-xl border p-3 space-y-2 ${achievement.unlocked ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03]'}`}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-lg" aria-hidden="true">{achievement.icon}</span>
                {achievement.unlocked && <span className="text-[10px] text-emerald-400">✓</span>}
              </div>
              <p className="text-xs font-bold text-ink truncate">{achievement.title}</p>
              <p className="text-[10px] text-muted leading-tight min-h-6">{achievement.description}</p>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-heart-purple transition-all" style={{ width: `${percentage}%` }} />
              </div>
              <p className="text-[10px] text-muted">{achievement.progress}/{achievement.target}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}