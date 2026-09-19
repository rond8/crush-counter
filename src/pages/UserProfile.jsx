import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfileByUsername, likeProfile, getProfileLikeCount } from '../lib/profile'
import { getMyCrush, setCrush } from '../lib/crush'
import { isMutualMatch } from '../lib/directMessages'
import { reportUser } from '../lib/reports'
import { isOnline } from '../lib/presence'
import { timeAgo } from '../lib/time'
import { sendFriendRequest, getFriendsList, pokeUser, getRelationshipStatus, getFriendLevel } from '../lib/friends'
import { sendGift } from '../lib/gifts'
import { getFameTier } from '../lib/fame'
import { handleImageError } from '../lib/utils'
import { getUserPublicWhispers, deleteWhisper, reportWhisper } from '../lib/whispers'
import ReportModal from '../components/ReportModal'
import VerifiedBadge from '../components/VerifiedBadge'
import ImageModal from '../components/ImageModal'
import WhisperCard from '../components/WhisperCard'
import ConfirmModal from '../components/ConfirmModal'

export default function UserProfile() {
  const { username } = useParams()
  const { profile: myProfile, session, refreshProfile, user } = useAuth()
  const navigate = useNavigate()

  const [target, setTarget] = useState(null)
  const [myCrush, setMyCrush] = useState(null)
  const [matched, setMatched] = useState(false)
  const [whispers, setWhispers] = useState([])
  const [loadingWhispers, setLoadingWhispers] = useState(false)

  // Relationship State
  const [relStatus, setRelStatus] = useState('none') // none | pending_sent | pending_received | friends
  const [friendPoints, setFriendPoints] = useState(0)
  const [friendSending, setFriendSending] = useState(false)
  const [sending, setSending] = useState(false)

  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)
  const [likeError, setLikeError] = useState('')
  const [showLikeChoice, setShowLikeChoice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const [reportingWhisperId, setReportingWhisperId] = useState(null)
  const [deletingWhisperId, setDeletingWhisperId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showGiftChoice, setShowGiftChoice] = useState(false)
  const [gifting, setGifting] = useState(false)

  const [viewingImage, setViewImage] = useState(null)

  const isSelf = myProfile?.username === username?.toLowerCase()

  const refresh = useCallback(async () => {
    setNotFound(false)
    const targetProfile = await getProfileByUsername(username)

    if (!targetProfile) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoadingWhispers(true)
    const [crush, likes, rel, userWhispers] = await Promise.all([
      getMyCrush(),
      getProfileLikeCount(username).catch(() => 0),
      getRelationshipStatus(targetProfile.id),
      getUserPublicWhispers(username).catch(() => [])
    ])

    setTarget(targetProfile)
    setMyCrush(crush)
    setLikeCount(likes)
    setRelStatus(rel.status)
    setFriendPoints(rel.points)
    setWhispers(userWhispers)
    setLoadingWhispers(false)

    const mutual = await isMutualMatch(username).catch(() => false)
    setMatched(mutual)
    setLoading(false)
  }, [username])

  useEffect(() => {
    setLoading(true)
    refresh()
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

  const handleAddFriend = async () => {
    if (!session) return navigate('/login')
    setFriendSending(true)
    try {
      await sendFriendRequest(username)
      setRelStatus('pending_sent')
      alert(`Friend request sent to @${username}!`)
    } catch (err) {
      alert(err.message || 'Could not send friend request.')
    } finally {
      setFriendSending(false)
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

  const handleSendGift = async (type) => {
    if (!session) return navigate('/login')
    setGifting(true)
    setError('')
    try {
      await sendGift(username, type)
      setSuccess(`You sent a ${type} to @${username}!`)
      setShowGiftChoice(false)
      await refreshProfile()
      await refresh() // Refresh points
    } catch (err) {
      setError(err.message || 'Could not send gift.')
    } finally {
      setGifting(false)
    }
  }

  const handlePoke = async () => {
    try {
      await pokeUser(username)
      alert(`You poked @${username}! 👉`)
    } catch (err) { alert(err.message) }
  }

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(username)
    alert(`@${username} copied to clipboard!`)
  }

  const handleShareProfile = async () => {
    const shareData = {
      title: `Check out @${username} on Crush Counter!`,
      text: `Find @${username} and more on Crush Counter. Send anonymous hearts and find your match!`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 space-y-6">
        <div className="card p-8 text-center space-y-4 animate-pulse bg-white/5 rounded-2xl">
          <div className="w-24 h-24 rounded-full bg-white/10 mx-auto" />
          <div className="h-6 bg-white/10 rounded w-1/3 mx-auto" />
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
  const online = isOnline(target?.last_seen)
  const fameTier = getFameTier(target?.fame ?? 0)
  const friendLevel = getFriendLevel(friendPoints)

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      {/* Main Profile Header Card */}
      <section className="card border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-xl space-y-5">

        {/* Tier Badge Background Decoration */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: fameTier.color }}
        />

        {/* Avatar & Online Indicator */}
        <div
          className="relative w-24 h-24 mx-auto cursor-pointer group"
          onClick={() => target?.avatar_url && setViewImage(target.avatar_url)}
        >
          {target?.avatar_url ? (
            <div className="relative w-24 h-24">
              <img
                src={target.avatar_url}
                alt={`@${target.username}`}
                className={`w-24 h-24 rounded-full object-cover ring-2 ring-heart-purple/50 shadow-md group-hover:opacity-90 transition-all ${fameTier.aura}`}
                onError={handleImageError}
              />
              <div className="avatar-fallback hidden w-24 h-24 rounded-full bg-heart-purple/20 border border-heart-purple/40 text-heart-purple items-center justify-center text-3xl font-bold font-display shadow-md">
                {target?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">View</span>
              </div>
            </div>
          ) : (
            <div className={`w-24 h-24 rounded-full bg-heart-purple/20 border border-heart-purple/40 text-heart-purple flex items-center justify-center text-3xl font-bold font-display shadow-md transition-all ${fameTier.aura}`}>
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
          <div className="flex flex-col items-center gap-1 mb-2">
            <span
              className="text-[9px] font-black uppercase tracking-[0.25em] px-2.5 py-0.5 rounded-full border"
              style={{ backgroundColor: `${fameTier.color}15`, color: fameTier.color, borderColor: `${fameTier.color}30` }}
            >
              {fameTier.emoji} {fameTier.label}
            </span>
          </div>

          <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              @{target?.username}
            </h1>
            <button
              onClick={handleCopyUsername}
              className="p-1.5 rounded-lg bg-midnight-surface border border-midnight-border text-muted hover:text-ink transition-colors"
              title="Copy username"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
            <VerifiedBadge verified={Boolean(target?.is_verified)} />
          </div>

          {/* Status & Location Meta */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <span>{online ? 'Online now' : target?.last_seen ? `Active ${timeAgo(target.last_seen)}` : 'Offline'}</span>
            {target?.location && <span>• {target.location}</span>}
          </div>
        </div>

        {/* Friendship Level Badge */}
        {relStatus === 'friends' && (
           <div className="py-2 animate-in zoom-in-95 duration-500">
              <div className="inline-flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                 <span className="text-[10px] font-black uppercase text-muted tracking-tighter mb-1">Friendship Progress</span>
                 <div className="flex items-center gap-2">
                    <span className="text-xl">💝</span>
                    <div className="text-left">
                       <p className="text-xs font-black leading-none" style={{ color: friendLevel.color }}>Lv.{friendLevel.lv} {friendLevel.label}</p>
                       <p className="text-[9px] text-muted font-bold mt-1">{friendPoints} Points</p>
                    </div>
                 </div>
                 <div className="w-32 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${Math.min(100, (friendPoints % 200) / 2)}%`, backgroundColor: friendLevel.color }} />
                 </div>
              </div>
           </div>
        )}

        {/* Bio */}
        {target?.bio && (
          <p className="text-sm text-ink/90 max-w-md mx-auto leading-relaxed italic">
            "{target.bio}"
          </p>
        )}

        {/* Interests & Hobbies Section */}
        {(target?.hobbies || target?.likes || target?.favorite_artist) && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {target?.hobbies && (
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-ink flex items-center gap-2">
                <span className="opacity-60">🎨</span>
                {target.hobbies}
              </div>
            )}
            {target?.likes && (
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-ink flex items-center gap-2">
                <span className="opacity-60">❤️</span>
                {target.likes}
              </div>
            )}
            {target?.favorite_artist && (
              <div className="px-3 py-1.5 rounded-xl bg-heart-purple/10 border border-heart-purple/20 text-xs font-medium text-ink flex items-center gap-2">
                <span className="opacity-60">🎵</span>
                {target.favorite_artist}
              </div>
            )}
          </div>
        )}

        {/* Social Actions */}
        <div className="pt-3 border-t border-white/5 flex flex-col items-center gap-3">
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              onClick={handleShareProfile}
              className="btn-ghost !px-5 !py-2 text-xs font-semibold border border-white/10 hover:bg-white/5 inline-flex items-center gap-2 rounded-full transition-transform hover:scale-[1.02]"
            >
              <span>🔗</span>
              <span>Share Profile</span>
            </button>

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
              <>
                <button
                  onClick={() => (session ? setShowLikeChoice(true) : navigate('/login'))}
                  disabled={liking}
                  className="btn-ghost !px-5 !py-2 text-xs font-semibold border border-white/10 hover:bg-white/5 inline-flex items-center gap-2 rounded-full transition-transform hover:scale-[1.02]"
                >
                  <span className="text-rose-400">🧡</span>
                  <span>{liking ? 'Liking…' : 'Send Like'}</span>
                </button>

                {/* Friend Button Logic */}
                {relStatus === 'none' && (
                  <button
                    onClick={handleAddFriend}
                    disabled={friendSending}
                    className="btn-primary !px-5 !py-2 text-xs font-semibold inline-center gap-2 rounded-full transition-transform hover:scale-[1.02]"
                  >
                    <span>🤝</span>
                    <span>{friendSending ? '...' : 'Add Friend'}</span>
                  </button>
                )}
                {relStatus === 'pending_sent' && (
                  <button
                    disabled
                    className="btn-ghost !px-5 !py-2 text-xs font-semibold border border-white/10 text-muted rounded-full cursor-default opacity-70"
                  >
                    🕒 Requested
                  </button>
                )}
                {relStatus === 'pending_received' && (
                   <Link
                    to="/friends"
                    className="btn-primary !px-5 !py-2 text-xs font-semibold inline-center gap-2 rounded-full animate-pulse"
                   >
                     Accept Request
                   </Link>
                )}
                {relStatus === 'friends' && (
                   <button
                    onClick={handlePoke}
                    className="btn-ghost !px-5 !py-2 text-xs font-semibold border border-white/10 hover:bg-white/5 inline-flex items-center gap-2 rounded-full transition-transform hover:scale-[1.02]"
                  >
                    <span>👉</span>
                    <span>Poke</span>
                  </button>
                )}

                <button
                  onClick={() => (session ? setShowGiftChoice(true) : navigate('/login'))}
                  className="btn-ghost !px-5 !py-2 text-xs font-semibold border border-white/10 hover:bg-white/5 inline-flex items-center gap-2 rounded-full transition-transform hover:scale-[1.02]"
                >
                  <span>🎁</span>
                  <span>Send Gift</span>
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-muted">
            Received <strong className="text-ink">{likeCount}</strong> like{likeCount === 1 ? '' : 's'}
          </p>
          {likeError && <p className="text-heart-red text-xs">{likeError}</p>}
        </div>
      </section>

      {/* Gift Modal */}
      {showGiftChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-white/10 bg-midnight/95 scale-in-center">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-display text-ink">Send a Gift</h3>
               <button onClick={() => setShowGiftChoice(false)} className="text-muted text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <GiftOption type="rose" cost={5} icon="🌹" onSelect={handleSendGift} disabled={gifting} />
              <GiftOption type="chocolate" cost={10} icon="🍫" onSelect={handleSendGift} disabled={gifting} />
              <GiftOption type="crown" cost={50} icon="👑" onSelect={handleSendGift} disabled={gifting} />
            </div>
            <p className="text-[10px] text-muted italic">+ Friendship Points for sending gifts!</p>
          </div>
        </div>
      )}

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

      {/* User's Public Whispers */}
      {whispers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted px-1 flex items-center gap-2">
             <span>🤫</span> Public Whispers
          </h2>
          <div className="card divide-y divide-white/5 overflow-hidden border border-white/5">
             {whispers.map(w => (
               <WhisperCard
                 key={w.id}
                 whisper={w}
                 currentUser={user}
                 currentProfile={myProfile}
                 onDelete={() => setDeletingWhisperId(w.id)}
                 onReport={() => setReportingWhisperId(w.id)}
               />
             ))}
          </div>
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

      {viewingImage && (
        <ImageModal src={viewingImage} onClose={() => setViewImage(null)} />
      )}

      {/* Whisper Actions Modals */}
      <ConfirmModal
        isOpen={Boolean(deletingWhisperId)}
        title="Delete?"
        message="Remove this whisper?"
        onConfirm={async () => {
          try {
            await deleteWhisper(deletingWhisperId)
            setWhispers(prev => prev.filter(w => w.id !== deletingWhisperId))
            setDeletingWhisperId(null)
          } catch (err) { alert(err.message) }
        }}
        onClose={() => setDeletingWhisperId(null)}
      />

      {reportingWhisperId && (
        <ReportModal
          title="Report Whisper"
          onSubmit={(r, d) => {
            reportWhisper(reportingWhisperId, r, d)
            alert('Report submitted.')
            setReportingWhisperId(null)
          }}
          onClose={() => setReportingWhisperId(null)}
        />
      )}
    </div>
  )
}

function GiftOption({ type, cost, icon, onSelect, disabled }) {
  return (
    <button
      onClick={() => onSelect(type)}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-heart-purple/40 hover:bg-heart-purple/5 transition-all group disabled:opacity-50"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[10px] font-bold text-ink capitalize">{type}</span>
      <span className="text-[9px] text-amber-400">🪙 {cost}</span>
    </button>
  )
}
