import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getReceivedCount, getMatches } from '../lib/crush'

export default function Profile() {
  const { profile } = useAuth()
  const [receivedCount, setReceivedCount] = useState(null)
  const [matchCount, setMatchCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getReceivedCount(), getMatches()])
      .then(([count, matches]) => {
        if (cancelled) return
        setReceivedCount(count)
        setMatchCount(matches.length)
      })
      .catch((err) => !cancelled && setError(err.message || 'Could not load your stats.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const tags = [profile?.gender, profile?.relationship_status].filter(Boolean)
  const metaLine = [profile?.age, profile?.location].filter(Boolean).join(' · ')

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Your avatar"
            className="w-20 h-20 rounded-full object-cover mx-auto ring-1 ring-midnight-border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-heart-purple/20 ring-1 ring-heart-purple/40 mx-auto flex items-center justify-center text-2xl font-display">
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        <div>
          <h1 className="font-display text-3xl">
            @{profile?.username}
            {(profile?.premium_unlocked || (profile?.fame ?? 0) >= 500) && (
              <span className="ml-1.5 align-middle" title="Premium">
                👑
              </span>
            )}
          </h1>
          {metaLine && <p className="text-muted text-sm mt-1">{metaLine}</p>}
        </div>

        {profile?.bio && <p className="text-sm text-ink max-w-md mx-auto">{profile.bio}</p>}

        {tags.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full border border-midnight-border text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/profile/edit" className="btn-ghost inline-flex !px-4 !py-2 text-sm">
            Edit profile
          </Link>
          <Link to="/premium" className="btn-ghost inline-flex !px-4 !py-2 text-sm">
            👑 Premium
          </Link>
          <Link to="/settings" className="btn-ghost inline-flex !px-4 !py-2 text-sm">
            ⚙️ Settings
          </Link>
        </div>
      </section>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}

      <section className="grid grid-cols-3 gap-3">
        <div className="card p-4 sm:p-6 text-center ring-1 ring-heart-red/40">
          <p className="text-3xl sm:text-4xl font-display text-heart-red">{loading ? '—' : receivedCount}</p>
          <p className="text-xs sm:text-sm text-muted mt-2">
            {receivedCount === 1 ? 'person has a crush on you' : 'people have a crush on you'}
          </p>
        </div>
        <div className="card p-4 sm:p-6 text-center ring-1 ring-heart-purple/40">
          <p className="text-3xl sm:text-4xl font-display text-heart-purple">{loading ? '—' : matchCount}</p>
          <p className="text-xs sm:text-sm text-muted mt-2">
            {matchCount === 1 ? 'mutual match' : 'mutual matches'}
          </p>
        </div>
        <div className="card p-4 sm:p-6 text-center ring-1 ring-heart-yellow/40">
          <p className="text-3xl sm:text-4xl font-display text-heart-yellow">{profile?.fame ?? 0}</p>
          <p className="text-xs sm:text-sm text-muted mt-2">fame</p>
        </div>
      </section>

      <p className="text-center text-xs text-muted">
        This count includes everyone who currently has you as their crush — it updates as
        people change theirs. We never show you who, unless it's mutual.
      </p>
    </div>
  )
}
