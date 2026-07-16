import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfileByUsername, likeProfile, getProfileLikeCount } from '../lib/profile'
import { getMyCrush, setCrush } from '../lib/crush'
import { isMutualMatch } from '../lib/directMessages'
import { reportUser } from '../lib/reports'
import { isOnline } from '../lib/presence'
import { timeAgo } from '../lib/time'
import ReportModal from '../components/ReportModal'

export default function UserProfile() {
  const { username } = useParams()
  const { profile: myProfile, session, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [target, setTarget] = useState(null)
  const [myCrush, setMyCrush] = useState(null)
  const [matched, setMatched] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)
  const [likeError, setLikeError] = useState('')
  const [showLikeChoice, setShowLikeChoice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isSelf = myProfile?.username === username?.toLowerCase()

  const refresh = useCallback(async () => {
    setNotFound(false)
    const [targetProfile, crush, likes] = await Promise.all([
      getProfileByUsername(username),
      getMyCrush(),
      getProfileLikeCount(username).catch(() => 0),
    ])
    if (!targetProfile) {
      setNotFound(true)
      setMatched(false)
    } else {
      setTarget(targetProfile)
      const mutual = await isMutualMatch(username).catch(() => false)
      setMatched(mutual)
    }
    setMyCrush(crush)
    setLikeCount(likes)
  }, [username])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const handleSetCrush = async () => {
    setError('')
    setSuccess('')
    setSending(true)
    try {
      await setCrush(username)
      setSuccess(`@${username} is now your crush.`)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not set that crush.')
    } finally {
      setSending(false)
    }
  }

  const handleLike = async (anonymous) => {
    if (!session) return navigate('/login')
    setLikeError('')
    setLiking(true)
    setShowLikeChoice(false)
    try {
      await likeProfile(username, anonymous)
      setLikeCount((c) => c + 1)
      await refreshProfile()
    } catch (err) {
      setLikeError(err.message || 'Could not like this profile.')
    } finally {
      setLiking(false)
    }
  }

  if (loading) {
    return <p className="text-muted text-sm font-mono text-center py-10">loading…</p>
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-3">
        <p className="text-4xl">🕵️</p>
        <h1 className="font-display text-2xl">No one here</h1>
        <p className="text-muted text-sm">@{username} isn't a registered username.</p>
        <button onClick={() => navigate(-1)} className="btn-ghost !px-4 !py-2 text-sm">
          Go back
        </button>
      </div>
    )
  }

  if (isSelf) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-3">
        <p className="text-4xl">👋</p>
        <h1 className="font-display text-2xl">This is you!</h1>
        <Link to="/profile" className="btn-primary inline-flex">
          Go to your profile
        </Link>
      </div>
    )
  }

  const isMyCrush = myCrush?.target_username === username?.toLowerCase()
  const tags = [target?.gender, target?.relationship_status].filter(Boolean)
  const metaLine = [target?.age, target?.location].filter(Boolean).join(' · ')
  const online = isOnline(target?.last_seen)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-3">
        {target?.avatar_url ? (
          <img
            src={target.avatar_url}
            alt={`@${target.username}`}
            className="w-20 h-20 rounded-full object-cover mx-auto ring-1 ring-midnight-border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-heart-purple/20 ring-1 ring-heart-purple/40 mx-auto flex items-center justify-center text-2xl font-display">
            {target?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        <div>
          <h1 className="font-display text-3xl">
            @{target?.username}
            {(target?.premium_unlocked || (target?.fame ?? 0) >= 500) && (
              <span className="ml-1.5 align-middle" title="Premium">
                👑
              </span>
            )}
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-heart-green' : 'bg-midnight-border'}`} />
            {online ? 'Online now' : target?.last_seen ? `Active ${timeAgo(target.last_seen)}` : 'Offline'}
          </div>
          {metaLine && <p className="text-muted text-sm mt-1">{metaLine}</p>}
          <p className="text-sm text-heart-yellow mt-1">🌟 {target?.fame ?? 0} fame</p>
        </div>

        {target?.bio && <p className="text-sm text-ink max-w-md mx-auto">{target.bio}</p>}

        {tags.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full border border-midnight-border text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2 pt-1">
          {showLikeChoice ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted">Like anonymously, or show your username?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLike(true)}
                  disabled={liking}
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                >
                  🕵️ Anonymous
                </button>
                <button
                  onClick={() => handleLike(false)}
                  disabled={liking}
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                >
                  😎 Show my name
                </button>
                <button
                  onClick={() => setShowLikeChoice(false)}
                  disabled={liking}
                  className="text-xs text-muted hover:text-ink px-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => (session ? setShowLikeChoice(true) : navigate('/login'))}
              disabled={liking}
              className="btn-ghost !px-4 !py-2 text-sm inline-flex items-center gap-1.5"
            >
              🧡 {liking ? 'Liking…' : 'Like'} <span className="text-muted">· 1 🪙</span>
            </button>
          )}
          <p className="text-xs text-muted">
            {likeCount} like{likeCount === 1 ? '' : 's'}
          </p>
          {likeError && <p className="text-heart-red text-xs">{likeError}</p>}
        </div>
      </section>

      {matched && (
        <section className="card p-5 text-center ring-1 ring-heart-purple/50 shadow-glow space-y-2">
          <p className="text-sm text-heart-purple font-semibold">💜 You're a mutual match!</p>
          <Link to={`/chat/${target?.username}`} className="btn-primary !px-5 !py-2.5 inline-flex">
            💬 Chat with @{target?.username}
          </Link>
        </section>
      )}

      <section className="card p-5 text-center space-y-3">
        {isMyCrush ? (
          <>
            <p className="text-sm text-muted">
              💌 <span className="font-mono text-ink">@{target?.username}</span> is your current crush.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/messages" className="btn-primary !px-4 !py-2 text-sm">
                Send a message
              </Link>
              <Link to="/dashboard" className="btn-ghost !px-4 !py-2 text-sm">
                Change crush
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Send them an anonymous heart?</p>
            <button onClick={handleSetCrush} disabled={sending} className="btn-primary !px-5 !py-2.5">
              {sending ? 'Sending…' : '💌 Set as my crush'}
            </button>
          </>
        )}
        {error && <p className="text-heart-red text-sm">{error}</p>}
        {success && <p className="text-heart-green text-sm">{success}</p>}
      </section>

      <div className="text-center">
        <button
          onClick={() => setShowReport(true)}
          className="text-xs text-muted hover:text-heart-red transition-colors"
        >
          🚩 Report this profile
        </button>
      </div>

      {showReport && (
        <ReportModal
          title={`Report @${target?.username}`}
          onSubmit={(reason, details) => reportUser(target.username, reason, details)}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
