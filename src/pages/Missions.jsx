import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyMissions, claimMission, getMyReferralStats } from '../lib/missions'
import { getInviteLink } from '../lib/invite'

export default function Missions() {
  const { profile, refreshProfile } = useAuth()

  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [claimingKey, setClaimingKey] = useState(null)
  const [claimSuccess, setClaimSuccess] = useState('')

  const [referralStats, setReferralStats] = useState({ invited_count: 0 })
  const [copied, setCopied] = useState(false)

  const inviteLink = getInviteLink(profile?.username)

  const refresh = useCallback(async () => {
    const [m, r] = await Promise.all([
      getMyMissions().catch(() => []),
      getMyReferralStats().catch(() => ({ invited_count: 0 })),
    ])
    setMissions(m || [])
    setReferralStats(r || { invited_count: 0 })
  }, [])

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message || 'Could not load missions.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const handleClaim = async (missionKey) => {
    setError('')
    setClaimSuccess('')
    setClaimingKey(missionKey)
    try {
      const mission = missions.find((m) => m.mission_key === missionKey)
      await claimMission(missionKey)
      const rewardText = [
        mission?.reward_coins ? `+${mission.reward_coins} 🪙` : null,
        mission?.reward_fame ? `+${mission.reward_fame} 🌟` : null,
      ]
        .filter(Boolean)
        .join(' ')
      setClaimSuccess(`Claimed reward! ${rewardText}`)
      await Promise.all([refreshProfile(), refresh()])
    } catch (err) {
      setError(err.message || 'Could not claim that mission.')
    } finally {
      setClaimingKey(null)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the link — tap and hold to copy manually.')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Crush Counter',
          text: 'Send me an anonymous heart on Crush Counter 💜',
          url: inviteLink,
        })
      } catch {
        // Share sheet dismissed by user
      }
    } else {
      handleCopyLink()
    }
  }

  const dailyMissions = missions.filter((m) => m.period === 'daily')
  const weeklyMissions = missions.filter((m) => m.period === 'weekly')

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink flex items-center justify-center gap-2">
          <span>🎯</span> Missions
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Complete daily and weekly tasks to earn extra coins and fame points.
        </p>
      </section>

      {/* Error & Success Feedback Alerts */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center font-medium">
          {error}
        </div>
      )}
      {claimSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center font-medium">
          {claimSuccess}
        </div>
      )}

      {/* Invite Friends Section */}
      <section className="card p-6 border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💌</span>
            <h2 className="font-display text-lg font-bold text-ink">Invite Friends</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted font-medium">
            {referralStats.invited_count} invited
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Share your custom referral link. You both receive <strong className="text-amber-400 font-semibold">+10 🪙</strong> as soon as they sign up!
        </p>

        <div className="flex gap-2">
          <input
            readOnly
            value={inviteLink || ''}
            onFocus={(e) => e.target.select()}
            className="input-field font-mono text-xs flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-ink focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className={`btn-ghost !px-4 text-xs font-semibold rounded-xl border border-white/10 transition-colors whitespace-nowrap ${
              copied ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'hover:bg-white/5'
            }`}
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>

        <button
          onClick={handleShare}
          className="btn-primary w-full !py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-transform"
        >
          <span>📤</span> Share Invite Link
        </button>
      </section>

      {/* Missions List / Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded w-28" />
          <div className="space-y-3">
            <div className="card p-4 h-24 bg-white/5 rounded-2xl" />
            <div className="card p-4 h-24 bg-white/5 rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <MissionSection
            title="☀️ Daily Tasks"
            missions={dailyMissions}
            claimingKey={claimingKey}
            onClaim={handleClaim}
          />
          <MissionSection
            title="📅 Weekly Challenges"
            missions={weeklyMissions}
            claimingKey={claimingKey}
            onClaim={handleClaim}
          />
        </div>
      )}
    </div>
  )
}

function MissionSection({ title, missions, claimingKey, onClaim }) {
  if (!missions || missions.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-bold text-ink px-1">{title}</h2>
      <div className="space-y-3">
        {missions.map((m) => {
          const pct = Math.min(100, Math.round(((m.progress_count || 0) / (m.target_count || 1)) * 100))
          const isClaiming = claimingKey === m.mission_key

          return (
            <div
              key={m.mission_key}
              className="card p-4 sm:p-5 border border-white/10 bg-white/[0.02] rounded-2xl space-y-3 hover:border-white/20 transition-colors"
            >
              {/* Mission Header */}
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-ink leading-snug">{m.title}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.reward_coins > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      +{m.reward_coins} 🪙
                    </span>
                  )}
                  {m.reward_fame > 0 && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      +{m.reward_fame} 🌟
                    </span>
                  )}
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      m.completed ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-heart-purple to-purple-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Bottom Progress Counter & Action Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted font-mono">
                  {m.progress_count || 0} / {m.target_count || 0} ({pct}%)
                </span>

                {m.claimed ? (
                  <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1">
                    <span>✓</span> Claimed
                  </span>
                ) : m.completed ? (
                  <button
                    onClick={() => onClaim(m.mission_key)}
                    disabled={isClaiming}
                    className="btn-primary !px-4 !py-1.5 text-xs font-semibold rounded-lg shadow-md hover:scale-[1.02] transition-transform"
                  >
                    {isClaiming ? 'Claiming…' : 'Claim Reward'}
                  </button>
                ) : (
                  <span className="text-xs text-muted/70 font-medium italic">In progress</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}