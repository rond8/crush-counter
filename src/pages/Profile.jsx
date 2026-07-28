import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getReceivedCount, getMatches } from '../lib/crush'
import VerifiedBadge from '../components/VerifiedBadge'

export default function Profile() {
  const { profile } = useAuth()
  const hasPremium = Boolean(profile?.premium_unlocked) || (profile?.fame ?? 0) >= 500
  const isVerified = Boolean(profile?.is_verified)

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
  const metaLine = [profile?.age, profile?.location].filter(Boolean).join(' - ')

  // Parse social links (from JSON column or individual fields)
  const social = profile?.social_links || {}
  const instagram = social.instagram ?? profile?.instagram
  const twitter = social.twitter ?? profile?.twitter
  const facebook = social.facebook ?? profile?.facebook
  const tiktok = social.tiktok ?? profile?.tiktok

  const hasSocials = Boolean(instagram || twitter || facebook || tiktok)
  const hasAdmirers = (receivedCount ?? 0) > 0

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Profile Header */}
      <section className="text-center space-y-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Your avatar"
            className="w-24 h-24 rounded-full object-cover mx-auto ring-2 ring-midnight-border shadow-md"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-heart-purple/20 ring-2 ring-heart-purple/40 mx-auto flex items-center justify-center text-3xl font-display text-heart-purple shadow-md">
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              @{profile?.username}
            </h1>
            {hasPremium && (
              <span className="text-heart-yellow flex items-center" title="Premium Active">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </span>
            )}
            <VerifiedBadge verified={isVerified} />
          </div>
          {metaLine && <p className="text-muted text-sm">{metaLine}</p>}
        </div>

        {profile?.bio && <p className="text-sm text-ink max-w-md mx-auto leading-relaxed">{profile.bio}</p>}

        {tags.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full border border-midnight-border/80 bg-midnight-surface/50 text-muted font-medium"
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
                href={'https://instagram.com/' + instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
              >
                <span>Instagram</span>
                <span>@{instagram}</span>
              </a>
            )}
            {twitter && (
              <a
                href={'https://x.com/' + twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
              >
                <span>X</span>
                <span>@{twitter}</span>
              </a>
            )}
            {facebook && (
              <a
                href={'https://facebook.com/' + facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                <span>Facebook</span>
                <span>{facebook}</span>
              </a>
            )}
            {tiktok && (
              <a
                href={'https://tiktok.com/@' + tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <span>TikTok</span>
                <span>@{tiktok}</span>
              </a>
            )}
          </div>
        )}

        {/* Action Buttons & Verification Indicator */}
        <div className="flex flex-wrap justify-center items-center gap-2.5 pt-2">
          <Link to="/profile/edit" className="btn-ghost inline-flex items-center gap-2 !px-4 !py-2 text-xs font-semibold">
            <svg className="w-4 h-4 text-muted fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit profile
          </Link>

          {/* Verification Status Button */}
          {isVerified ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Verified
            </div>
          ) : (
            <Link to="/verify" className="btn-ghost inline-flex items-center gap-2 !px-4 !py-2 text-xs font-semibold border-sky-500/40 text-sky-400 hover:bg-sky-500/10">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              Get Verified
            </Link>
          )}

          <Link to="/premium" className="btn-ghost inline-flex items-center gap-2 !px-4 !py-2 text-xs font-semibold">
            <svg className="w-4 h-4 text-heart-yellow fill-current" viewBox="0 0 24 24">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
            Premium
          </Link>

          <Link to="/settings" className="btn-ghost inline-flex items-center gap-2 !px-4 !py-2 text-xs font-semibold">
            <svg className="w-4 h-4 text-muted stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </Link>
        </div>

        {/* Perks Grid */}
        {(isVerified || hasPremium) && (
          <div className="grid gap-3 mt-6 sm:grid-cols-2 text-left">
            {isVerified && (
              <div className="card p-4 border-sky-500/20 bg-sky-500/5">
                <h2 className="text-sm font-semibold text-sky-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Verified Perks
                </h2>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Your account is verified, so your profile looks premium in search and your spin experience
                  gets a special verified glow.
                </p>
              </div>
            )}
            {hasPremium && (
              <div className="card p-4 border-heart-yellow/20 bg-heart-yellow/5">
                <h2 className="text-sm font-semibold text-heart-yellow flex items-center gap-1.5">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                  Premium Perks
                </h2>
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  Premium unlocks ad-free app flow, exclusive spin styling, and a crown badge shown across the app.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}

      {/* Stats Cards */}
      <section className="grid grid-cols-3 gap-3">
        <Link
          to="/radar"
          className="card relative p-4 sm:p-6 text-center ring-1 ring-heart-red/40 bg-heart-red/5 block hover:ring-heart-red/70 hover:bg-heart-red/10 active:scale-[0.98] transition-all"
        >
          {hasAdmirers && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-heart-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-heart-red" />
            </span>
          )}
          <p className="text-3xl sm:text-4xl font-display font-bold text-heart-red">{loading ? '-' : receivedCount}</p>
          <p className="text-xs sm:text-sm text-muted mt-2 font-medium">
            {receivedCount === 1 ? 'person has a crush on you' : 'people have a crush on you'}
          </p>
          <p className="text-[10px] text-heart-red/80 mt-1.5 font-semibold uppercase tracking-wide inline-flex items-center gap-0.5">
            Tap to view
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </p>
        </Link>
        <div className="card p-4 sm:p-6 text-center ring-1 ring-heart-purple/40 bg-heart-purple/5">
          <p className="text-3xl sm:text-4xl font-display font-bold text-heart-purple">{loading ? '-' : matchCount}</p>
          <p className="text-xs sm:text-sm text-muted mt-2 font-medium">
            {matchCount === 1 ? 'mutual match' : 'mutual matches'}
          </p>
        </div>
        <div className="card p-4 sm:p-6 text-center ring-1 ring-heart-yellow/40 bg-heart-yellow/5">
          <p className="text-3xl sm:text-4xl font-display font-bold text-heart-yellow">{profile?.fame ?? 0}</p>
          <p className="text-xs sm:text-sm text-muted mt-2 font-medium">fame</p>
        </div>
      </section>

      <p className="text-center text-xs text-muted leading-relaxed">
        This count includes everyone who currently has you as their crush. It updates as
        people change theirs. We never show you who, unless it's mutual.
      </p>
    </div>
  )
}