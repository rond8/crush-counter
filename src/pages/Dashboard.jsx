import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { setCrush, getMyCrush, getAdmirerStatus, getMatches } from '../lib/crush'
import { setLeaderboardOptIn } from '../lib/leaderboard'
import HeartCard from '../components/HeartCard'
import UsernameSearchInput from '../components/UsernameSearchInput'
import MutualMatchOverlay from '../components/MutualMatchOverlay'
import PetWidget from '../components/PetWidget'
import { isOnline } from '../lib/presence'
import { timeAgo } from '../lib/time'

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth()

  const [optInSaving, setOptInSaving] = useState(false)

  const [targetUsername, setTargetUsername] = useState('')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [editing, setEditing] = useState(false)

  const [myCrush, setMyCrush] = useState(null)
  const [admirer, setAdmirer] = useState({ has_admirer: false, admirer_count: 0 })
  const [matches, setMatches] = useState([])
  const [showMatchOverlay, setShowMatchOverlay] = useState(false)
  const prevMatchesRef = useRef(0)
  const [loading, setLoading] = useState(true)

  // Toggle state for the Status Indicator Guide
  const [showGuide, setShowGuide] = useState(false)

  const refresh = useCallback(async () => {
    const [crush, admirerStatus, matchList] = await Promise.all([
      getMyCrush(),
      getAdmirerStatus(),
      getMatches(),
    ])
    setMyCrush(crush)
    setAdmirer(admirerStatus)
    setMatches(matchList)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem('mutualMatchShownCount') || '0', 10)
      if (matches.length > (isNaN(saved) ? 0 : saved)) {
        setShowMatchOverlay(true)
        localStorage.setItem('mutualMatchShownCount', String(matches.length))
      }
    } catch (e) {
      if (matches.length > 0 && prevMatchesRef.current === 0) {
        setShowMatchOverlay(true)
      }
    }
    prevMatchesRef.current = matches.length
  }, [matches])

  const handleSend = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    const clean = targetUsername.trim().toLowerCase()
    if (!clean) return
    if (clean === profile?.username) {
      setFormError("You can't send a heart to yourself.")
      return
    }

    setSending(true)
    try {
      try {
        localStorage.setItem('mutualMatchShownCount', '0')
      } catch (e) {}

      await setCrush(clean)
      setFormSuccess(myCrush ? `Crush changed to @${clean}.` : `Heart sent to @${clean}.`)
      setTargetUsername('')
      setEditing(false)
      await refresh()
    } catch (err) {
      setFormError(err.message || 'Could not send that heart.')
    } finally {
      setSending(false)
    }
  }

  const startEditing = () => {
    setTargetUsername(myCrush?.target_username ?? '')
    setFormError('')
    setFormSuccess('')
    setEditing(true)
  }

  // Helper function to dynamically set the heart color based on crush status
  const getCrushHeartEmoji = (status) => {
    switch (status) {
      case 'mutual': return '💜'
      case 'competition': return '💚'
      case 'pending': return '💛'
      default: return '❤️'
    }
  }

  const showForm = !loading && (editing || !myCrush)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Hero Header */}
      <section className="text-center space-y-3">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Send a heart, <span className="text-heart-purple">stay anonymous</span>
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          They won’t know it’s you unless they’ve sent one back. You can only have one active crush at a time, but you can update it whenever you like.
        </p>
      </section>

      {/* Primary Action Card: Form or Selected Crush Display */}
      {loading ? (
        <div className="card p-8 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-heart-purple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted text-xs font-mono uppercase tracking-wider">Loading your profile data...</p>
        </div>
      ) : showForm ? (
        <form onSubmit={handleSend} className="card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="target" className="sr-only">
                Their username
              </label>
              <UsernameSearchInput
                value={targetUsername}
                onChange={setTargetUsername}
                excludeUsername={profile?.username}
                autoFocus={editing}
              />
            </div>
            <div className="flex gap-2">
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setFormError('')
                  }}
                  className="btn-ghost !px-4"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={sending || !targetUsername.trim()}
                className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-heart-purple/20"
              >
                <span>💌 {sending ? 'Sending…' : myCrush ? 'Update Crush' : 'Send Heart'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              {/* Dynamically render the heart based on the status */}
              <span>{getCrushHeartEmoji(myCrush.status)} Your Active Crush</span>
            </h2>
            <button onClick={startEditing} className="btn-ghost !px-3 !py-1.5 text-xs font-semibold">
              Change Selection
            </button>
          </div>
          <HeartCard
            username={myCrush.target_username}
            status={myCrush.status}
            lastSeen={myCrush.target_last_seen}
            avatarUrl={myCrush.target_avatar_url}
          />
        </section>
      )}

      {/* Notifications / Alerts */}
      {formError && (
        <div className="p-3 rounded-xl bg-heart-red/10 border border-heart-red/30 text-heart-red text-sm text-center font-medium">
          {formError}
        </div>
      )}
      {formSuccess && (
        <div className="p-3 rounded-xl bg-heart-green/10 border border-heart-green/30 text-heart-green text-sm text-center font-medium">
          {formSuccess}
        </div>
      )}

      {/* Virtual pet */}
      <PetWidget />

      {/* Leaderboard Opt-In Prompt */}
      {profile?.leaderboard_opt_in === null && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 border-l-heart-purple">
          <div className="text-3xl shrink-0 self-start sm:self-auto" aria-hidden="true">
            🏆
          </div>
          <div className="flex-1 space-y-0.5">
            <p className="font-semibold text-ink text-sm">Join the Featured Leaderboard?</p>
            <p className="text-xs text-muted leading-relaxed">
              If your profile ranks in the top 10 by fame, opt in to display your username on the <span className="text-ink font-medium">Featured</span> page.
            </p>
          </div>
          <div className="flex gap-2 shrink-0 pt-2 sm:pt-0">
            <button
              disabled={optInSaving}
              onClick={async () => {
                setOptInSaving(true)
                await setLeaderboardOptIn(true).catch(() => {})
                await refreshProfile()
                setOptInSaving(false)
              }}
              className="btn-primary !px-4 !py-2 text-xs"
            >
              Opt In
            </button>
            <button
              disabled={optInSaving}
              onClick={async () => {
                setOptInSaving(true)
                await setLeaderboardOptIn(false).catch(() => {})
                await refreshProfile()
                setOptInSaving(false)
              }}
              className="btn-ghost !px-4 !py-2 text-xs"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {/* Secret Admirer Banner */}
      {admirer.has_admirer && (
        <div className="card p-5 flex items-center gap-4 bg-heart-red/5 border border-heart-red/30 shadow-sm">
          <span className="text-3xl animate-pulse" aria-hidden="true">
            ❤️
          </span>
          <div className="space-y-0.5">
            <p className="font-semibold text-heart-red text-sm">
              {admirer.admirer_count === 1
                ? 'You have 1 secret admirer'
                : `You have ${admirer.admirer_count} secret admirers`}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Someone has picked you as their crush. Send a heart back to find out if it’s a mutual match.
            </p>
          </div>
        </div>
      )}

      {/* Mutual Matches Section */}
      {matches.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-heart-purple flex items-center gap-2">
            <span>💜 Mutual Matches</span>
          </h2>
          <div className="space-y-2">
            {matches.map((m) => (
              <div
                key={m.username}
                className="card p-4 flex items-center justify-between border-midnight-border/80 hover:border-heart-purple/50 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {m.avatar_url ? (
                    <img
                      src={m.avatar_url}
                      alt={m.username}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-heart-purple/50"
                    />
                  ) : (
                    <span className="text-2xl animate-pulse">💜</span>
                  )}
                  <Link to={`/u/${m.username}`} className="font-mono text-sm font-semibold text-ink hover:text-heart-purple transition-colors">
                    @{m.username}
                  </Link>
                </div>

                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline(m.last_seen) ? 'bg-heart-green shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-midnight-border'
                    }`}
                    aria-hidden="true"
                  />
                  {isOnline(m.last_seen) ? 'Online' : m.last_seen ? `Active ${timeAgo(m.last_seen)}` : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mutual Match Pop-up Overlay */}
      {showMatchOverlay && (
        <MutualMatchOverlay
          matches={matches}
          myCrush={myCrush}
          onClose={() => setShowMatchOverlay(false)}
        />
      )}

      {/* Collapsible Status Indicator Guide */}
      <section className="card p-4 space-y-3 bg-midnight/30 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted uppercase tracking-widest">
            Status Indicator Guide
          </span>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-7 h-7 rounded-full bg-midnight-border/50 hover:bg-heart-purple/20 text-muted hover:text-heart-purple font-mono font-bold text-xs flex items-center justify-center transition-colors"
            title="Toggle Status Guide"
            aria-label="Toggle status guide details"
          >
            ?
          </button>
        </div>

        {showGuide && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-midnight-border/50">
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">💜</span>
              <p className="text-muted"><strong className="text-ink">Mutual Match:</strong> You and this user have both chosen each other.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">💚</span>
              <p className="text-muted"><strong className="text-ink">Competition:</strong> Multiple users have chosen this same crush.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">❤️</span>
              <p className="text-muted"><strong className="text-ink">Secret Admirer:</strong> Someone has set you as their active crush.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">💛</span>
              <p className="text-muted"><strong className="text-ink">Pending Invite:</strong> Target username is not registered on the app yet.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}