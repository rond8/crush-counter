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
    const [m, r] = await Promise.all([getMyMissions(), getMyReferralStats()])
    setMissions(m)
    setReferralStats(r)
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
      setClaimSuccess(`Claimed! ${rewardText}`)
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
      setError('Could not copy the link — long-press it to copy manually.')
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
        // Cancelled — nothing to do.
      }
    } else {
      handleCopyLink()
    }
  }

  const dailyMissions = missions.filter((m) => m.period === 'daily')
  const weeklyMissions = missions.filter((m) => m.period === 'weekly')

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🎯 Missions</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Complete tasks for coins and fame. Daily ones reset every day, weekly ones every week.
        </p>
      </section>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}
      {claimSuccess && <p className="text-heart-green text-sm text-center">{claimSuccess}</p>}

      {/* Invite a friend */}
      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">💌 Invite a friend</h2>
          <span className="text-xs text-muted">{referralStats.invited_count} invited</span>
        </div>
        <p className="text-sm text-muted">
          Share your link — you both get <span className="text-ink">+10 🪙</span> when they join.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={inviteLink}
            onFocus={(e) => e.target.select()}
            className="input-field font-mono text-xs flex-1"
          />
          <button onClick={handleCopyLink} className="btn-ghost !px-4 text-sm whitespace-nowrap">
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
        <button onClick={handleShare} className="btn-primary w-full">
          📤 Share invite link
        </button>
      </section>

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : (
        <>
          <MissionSection
            title="☀️ Daily"
            missions={dailyMissions}
            claimingKey={claimingKey}
            onClaim={handleClaim}
          />
          <MissionSection
            title="📅 Weekly"
            missions={weeklyMissions}
            claimingKey={claimingKey}
            onClaim={handleClaim}
          />
        </>
      )}
    </div>
  )
}

function MissionSection({ title, missions, claimingKey, onClaim }) {
  if (missions.length === 0) return null
  return (
    <section>
      <h2 className="font-display text-xl mb-3">{title}</h2>
      <div className="space-y-3">
        {missions.map((m) => {
          const pct = Math.min(100, Math.round((m.progress_count / m.target_count) * 100))
          const isClaiming = claimingKey === m.mission_key
          return (
            <div key={m.mission_key} className="card p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{m.title}</p>
                <span className="text-xs text-muted whitespace-nowrap">
                  {[
                    m.reward_coins ? `+${m.reward_coins} 🪙` : null,
                    m.reward_fame ? `+${m.reward_fame} 🌟` : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </span>
              </div>
              <div className="h-2 rounded-full bg-midnight-border overflow-hidden">
                <div
                  className={`h-full transition-all ${m.completed ? 'bg-heart-green' : 'bg-heart-purple'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">
                  {m.progress_count} / {m.target_count}
                </p>
                {m.claimed ? (
                  <span className="text-xs text-heart-green font-semibold">Claimed ✓</span>
                ) : m.completed ? (
                  <button
                    onClick={() => onClaim(m.mission_key)}
                    disabled={isClaiming}
                    className="btn-primary !px-4 !py-1.5 text-xs"
                  >
                    {isClaiming ? 'Claiming…' : 'Claim'}
                  </button>
                ) : (
                  <span className="text-xs text-muted">In progress</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}