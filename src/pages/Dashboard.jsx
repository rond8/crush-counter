import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { setCrush, getMyCrush, getAdmirerStatus, getMatches } from '../lib/crush'
import { setLeaderboardOptIn } from '../lib/leaderboard'
import HeartCard from '../components/HeartCard'
import UsernameSearchInput from '../components/UsernameSearchInput'
import MutualMatchOverlay from '../components/MutualMatchOverlay'
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
      // allow the mutual overlay to show again for this new crush action
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

  const showForm = !loading && (editing || !myCrush)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">
          Send a heart, <span className="text-heart-purple">stay anonymous</span>
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          They won’t know it’s you — unless they’ve sent one to you too. You can only have
          one crush at a time, but you can change it whenever you like.
        </p>
      </section>

      {/* Current crush / change form */}
      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : showForm ? (
        <form onSubmit={handleSend} className="card p-5 flex flex-col sm:flex-row gap-3">
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
                className="btn-ghost"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={sending || !targetUsername.trim()}
              className="btn-primary whitespace-nowrap"
            >
              {sending ? 'Sending…' : myCrush ? '💌 Update' : '💌 Send heart'}
            </button>
          </div>
        </form>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">Your crush</h2>
            <button onClick={startEditing} className="btn-ghost !px-4 !py-2 text-sm">
              Change
            </button>
          </div>
          <HeartCard
            username={myCrush.target_username}
            status={myCrush.status}
            lastSeen={myCrush.target_last_seen}
          />
        </section>
      )}
      {formError && <p className="text-heart-red text-sm text-center">{formError}</p>}
      {formSuccess && <p className="text-heart-green text-sm text-center">{formSuccess}</p>}

      {/* Leaderboard opt-in prompt — asked once, on first visit */}
      {profile?.leaderboard_opt_in === null && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="text-3xl" aria-hidden="true">
            🏆
          </span>
          <div className="flex-1">
            <p className="font-semibold text-ink">Want a shot at the leaderboard?</p>
            <p className="text-sm text-muted">
              If you're ever in the top 10 by fame, do you want your profile shown on the{' '}
              <span className="text-ink">Featured</span> page?
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              disabled={optInSaving}
              onClick={async () => {
                setOptInSaving(true)
                await setLeaderboardOptIn(true).catch(() => {})
                await refreshProfile()
                setOptInSaving(false)
              }}
              className="btn-primary !px-4 !py-2 text-sm"
            >
              Yes
            </button>
            <button
              disabled={optInSaving}
              onClick={async () => {
                setOptInSaving(true)
                await setLeaderboardOptIn(false).catch(() => {})
                await refreshProfile()
                setOptInSaving(false)
              }}
              className="btn-ghost !px-4 !py-2 text-sm"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {/* Secret admirer banner */}
      {admirer.has_admirer && (
        <div className="card p-5 flex items-center gap-4 ring-1 ring-heart-red/40">
          <span className="text-3xl animate-pulseGlow" aria-hidden="true">
            ❤️
          </span>
          <div>
            <p className="font-semibold text-heart-red">
              {admirer.admirer_count === 1
                ? 'You have a secret admirer'
                : `You have ${admirer.admirer_count} secret admirers`}
            </p>
            <p className="text-sm text-muted">
              Someone has you as their crush. Send one back to find out if it’s them.
            </p>
          </div>
        </div>
      )}

      {/* Mutual matches - identity only ever revealed here */}
      {matches.length > 0 && (
        <section>
          <h2 className="font-display text-xl mb-3 text-heart-purple">💜 Your matches</h2>
          <div className="space-y-3">
            {matches.map((m) => (
              <div key={m.username} className="card ring-1 ring-heart-purple/50 shadow-glow p-4 flex items-center gap-3">
                <span className="text-2xl animate-pulseGlow">💜</span>
                <Link to={`/u/${m.username}`} className="font-mono text-ink hover:underline">
                  @{m.username}
                </Link>
                <span className="flex items-center gap-1 text-xs text-muted ml-auto">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline(m.last_seen) ? 'bg-heart-green' : 'bg-midnight-border'
                    }`}
                    aria-hidden="true"
                  />
                  {isOnline(m.last_seen) ? 'Online now' : m.last_seen ? `Active ${timeAgo(m.last_seen)}` : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {showMatchOverlay && (
        <MutualMatchOverlay matches={matches} onClose={() => setShowMatchOverlay(false)} />
      )}

      {/* Legend */}
      <section className="card p-5">
        <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wide">What the colors mean</h3>
        <ul className="space-y-2 text-sm">
          <li>💜 <span className="text-muted">Mutual match — you like them, and they like you back.</span></li>
          <li>💚 <span className="text-muted">Competition — someone else has also sent a heart to your crush.</span></li>
          <li>❤️ <span className="text-muted">Secret admirer — someone has sent a heart to you.</span></li>
          <li>💛 <span className="text-muted">Invite needed — that username isn’t on Crush Counter yet.</span></li>
        </ul>
      </section>
    </div>
  )
}
