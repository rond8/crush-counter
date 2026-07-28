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
import VerifiedBadge from '../components/VerifiedBadge'

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
    return (
      <div className="max-w-xl mx-auto px-6 py-12 space-y-6">
        <div className="card p-8 text-center space-y-4 animate-pulse bg-white/5 rounded-2xl">
          <div className="w-24 h-24 rounded-full bg-white/10 mx-auto" />
          <div className="h-6 bg-white/10 rounded w-1/3 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto">
          🕵️
        </div>
        <h1 className="font-display text-2xl text-ink font-bold">User Not Found</h1>
        <p className="text-muted text-sm">
          There is no active user with the username <span className="font-mono text-ink">@{username}</span>.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost !px-5 !py-2 text-xs font-semibold border border-white/10 hover:bg-white/5"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (isSelf) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-heart-purple/20 border border-heart-purple/30 text-heart-purple flex items-center justify-center text-3xl mx-auto">
          👋
        </div>
        <h1 className="font-display text-2xl text-ink font-bold">This is your profile</h1>
        <p className="text-muted text-sm">You are currently looking at your public preview.</p>
        <Link to="/profile" className="btn-primary !px-5 !py-2.5 text-xs font-semibold inline-flex">
          Manage Your Profile
        </Link>
      </div>
    )
  }

  const isMyCrush = myCrush?.target_username === username?.toLowerCase()
  const tags = [target?.gender, target?.relationship_status].filter(Boolean)
  const metaLine = [target?.age ? `${target.age} yrs` : null, target?.location].filter(Boolean).join(' · ')
  const online = isOnline(target?.last_seen)

  // Parse social links (from JSON column or individual fields)
  const social = target?.social_links || {}
  const instagram = social.instagram ?? target?.instagram
  const twitter = social.twitter ?? target?.twitter
  const facebook = social.facebook ?? target?.facebook
  const tiktok = social.tiktok ?? target?.tiktok

  const hasSocials = Boolean(instagram || twitter || facebook || tiktok)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      {/* Main Profile Header Card */}
      <section className="card border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-xl space-y-5">
        
        {/* Avatar & Online Indicator */}
        <div className="relative w-24 h-24 mx-auto">
          {target?.avatar_url ? (
            <img
              src={target.avatar_url}
              alt={`@${target.username}`}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-heart-purple/50 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-heart-purple/20 border border-heart-purple/40 text-heart-purple flex items-center justify-center text-3xl font-bold font-display shadow-md">
              {target?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-midnight-bg ${
              online ? 'bg-emerald-400' : 'bg-white/20'
            }`}
            title={online ? 'Online now' : 'Offline'}
          />
        </div>

        {/* Username, Badges, Fame */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              @{target?.username}
            </h1>
            {(target?.premium_unlocked || (target?.fame ?? 0) >= 500) && (
              <span className="text-base" title="Premium User">
                👑
              </span>
            )}
            <VerifiedBadge verified={Boolean(target?.is_verified)} />
          </div>

          {/* Status & Location Meta */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <span>{online ? 'Online now' : target?.last_seen ? `Active ${timeAgo(target.last_seen)}` : 'Offline'}</span>
            {metaLine && <span>• {metaLine}</span>}
          </div>

          {/* Fame Tag */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              🌟 {target?.fame ?? 0} Fame Points
            </span>
          </div>
        </div>

        {/* Bio */}
        {target?.bio && (
          <p className="text-sm text-ink/90 max-w-md mx-auto leading-relaxed italic">
            "{target.bio}"
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-muted font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Links Bar */}
        {hasSocials && (
          <div className="flex justify-center gap-2 flex-wrap pt-1">
            {instagram && (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
              >
                <span>📷</span>
                <span>@{instagram}</span>
              </a>
            )}
            {twitter && (
              <a
                href={`https://x.com/${twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
              >
                <span>𝕏</span>
                <span>@{twitter}</span>
              </a>
            )}
            {facebook && (
              <a
                href={`https://facebook.com/${facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                <span>📘</span>
                <span>{facebook}</span>
              </a>
            )}
            {tiktok && (
              <a
                href={`https://tiktok.com/@${tiktok}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <span>🎵</span>
                <span>@{tiktok}</span>
              </a>
            )}
          </div>
        )}

        {/* Like Actions */}
        <div className="pt-3 border-t border-white/5 flex flex-col items-center gap-2">
          {showLikeChoice ? (
            <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10 animate-fade-in w-full max-w-xs">
              <p className="text-xs font-medium text-ink">How would you like to send love?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLike(true)}
                  disabled={liking}
                  className="btn-ghost flex-1 !py-1.5 text-xs font-semibold border border-white/10 hover:bg-white/10"
                >
                  🕵️ Secret
                </button>
                <button
                  onClick={() => handleLike(false)}
                  disabled={liking}
                  className="btn-primary flex-1 !py-1.5 text-xs font-semibold"
                >
                  😎 Named
                </button>
              </div>
              <button
                onClick={() => setShowLikeChoice(false)}
                disabled={liking}
                className="text-[11px] text-muted hover:text-ink block mx-auto pt-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => (session ? setShowLikeChoice(true) : navigate('/login'))}
              disabled={liking}
              className="btn-ghost !px-5 !py-2 text-xs font-semibold border border-white/10 hover:bg-white/5 inline-flex items-center gap-2 rounded-full transition-transform hover:scale-[1.02]"
            >
              <span className="text-rose-400">🧡</span>
              <span>{liking ? 'Liking…' : 'Send Like'}</span>
              <span className="text-muted font-normal">• 1 🪙</span>
            </button>
          )}

          <p className="text-xs text-muted">
            Received <strong className="text-ink">{likeCount}</strong> like{likeCount === 1 ? '' : 's'}
          </p>
          {likeError && <p className="text-heart-red text-xs">{likeError}</p>}
        </div>
      </section>

      {/* Mutual Match Banner */}
      {matched && (
        <section className="card p-5 text-center border border-heart-purple/50 bg-heart-purple/10 shadow-lg rounded-2xl space-y-3 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink flex items-center justify-center gap-1.5">
              <span>💜</span> Mutual Match!
            </h3>
            <p className="text-xs text-muted">You both have set each other as your active crush.</p>
          </div>
          <Link
            to={`/chat/${target?.username}`}
            className="btn-primary !px-5 !py-2 text-xs font-semibold inline-flex items-center gap-2"
          >
            <span>💬</span> Open Chat
          </Link>
        </section>
      )}

      {/* Crush Action Box */}
      <section className="card p-6 text-center border border-white/5 bg-white/[0.02] rounded-2xl space-y-3">
        {isMyCrush ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted">
              💌 <span className="font-mono text-ink">@{target?.username}</span> is currently set as your crush.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2.5">
              <Link to="/messages" className="btn-primary !px-4 !py-2 text-xs font-semibold">
                Send Direct Message
              </Link>
              <Link
                to="/dashboard"
                className="btn-ghost !px-4 !py-2 text-xs font-semibold border border-white/10 hover:bg-white/5"
              >
                Change Active Crush
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted">Want to express your interest confidentially?</p>
            <button
              onClick={handleSetCrush}
              disabled={sending}
              className="btn-primary !px-6 !py-2.5 text-xs font-semibold inline-flex items-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <span>💌</span>
              <span>{sending ? 'Updating…' : 'Set as My Crush'}</span>
            </button>
          </div>
        )}
        {error && <p className="text-heart-red text-xs font-medium">{error}</p>}
        {success && <p className="text-emerald-400 text-xs font-medium">{success}</p>}
      </section>

      {/* Footer / Report Link */}
      <div className="text-center pt-2">
        <button
          onClick={() => setShowReport(true)}
          className="text-xs text-muted/80 hover:text-heart-red transition-colors inline-flex items-center gap-1.5"
        >
          <span>🚩</span>
          <span>Report user or profile</span>
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