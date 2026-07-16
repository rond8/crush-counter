import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard, getTotalUserCount } from '../lib/leaderboard'

const RANK_MEDALS = ['🥇', '🥈', '🥉']
const MIN_USERS = 25

export default function Featured() {
  const [profiles, setProfiles] = useState([])
  const [totalUsers, setTotalUsers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getLeaderboard(), getTotalUserCount()])
      .then(([leaderboard, count]) => {
        setProfiles(leaderboard)
        setTotalUsers(count)
      })
      .catch((err) => setError(err.message || 'Could not load the leaderboard.'))
      .finally(() => setLoading(false))
  }, [])

  const notEnoughUsers = totalUsers !== null && totalUsers < MIN_USERS

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🏆 Featured</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          The top 10 most famous profiles on Crush Counter — only accounts that chose to be
          featured. Earn fame from 🔥 and 🕯️ items in the{' '}
          <Link to="/spin" className="text-heart-purple hover:underline">
            spin
          </Link>
          .
        </p>
      </section>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : notEnoughUsers ? (
        <div className="card p-8 text-center space-y-2">
          <p className="text-3xl">🌱</p>
          <p className="text-sm text-ink font-semibold">The leaderboard isn't open yet</p>
          <p className="text-sm text-muted">
            It unlocks once Crush Counter has {MIN_USERS} accounts — currently {totalUsers}/{MIN_USERS}.
          </p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">
          No one has opted in to the leaderboard yet — be the first from your Dashboard.
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p, i) => (
            <Link
              key={p.username}
              to={`/u/${p.username}`}
              className={`card p-4 flex items-center gap-4 hover:ring-1 hover:ring-heart-purple/40 transition-shadow ${
                i < 3 ? 'ring-1 ring-heart-yellow/40' : ''
              }`}
            >
              <span className="text-lg font-display w-8 text-center text-muted">
                {RANK_MEDALS[i] ?? `#${i + 1}`}
              </span>

              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <span className="w-11 h-11 rounded-full bg-heart-purple/20 flex items-center justify-center text-sm font-display">
                  {p.username[0]?.toUpperCase()}
                </span>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-ink truncate">@{p.username}</p>
                {(p.gender || p.relationship_status) && (
                  <p className="text-xs text-muted truncate">
                    {[p.gender, p.relationship_status].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>

              <span className="text-sm font-semibold text-heart-yellow whitespace-nowrap">
                🌟 {p.fame}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
