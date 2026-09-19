import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { globalSearchUsers, globalSearchWhispers, APP_SHORTCUTS } from '../lib/search'
import { getFameTier } from '../lib/fame'
import VerifiedBadge from '../components/VerifiedBadge'
import { timeAgo } from '../lib/time'

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ users: [], whispers: [] })
  const [loading, setLoading] = useState(false)

  const handleSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults({ users: [], whispers: [] })
      return
    }
    setLoading(true)
    try {
      const [users, whispers] = await Promise.all([
        globalSearchUsers(q).catch(() => []),
        globalSearchWhispers(q).catch(() => [])
      ])
      setResults({ users, whispers })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300)
    return () => clearTimeout(timer)
  }, [query, handleSearch])

  const filteredShortcuts = APP_SHORTCUTS.filter(s =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-32">
      {/* Search Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted hover:text-ink">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 relative">
           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
           <input
             type="text"
             autoFocus
             placeholder="Search people, whispers, or features..."
             className="w-full bg-midnight-surface border border-midnight-border rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-ink outline-none focus:ring-2 ring-heart-purple/40 transition-all"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
           />
        </div>
      </div>

      {!query && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
           <section className="space-y-3">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Quick Navigation</h2>
             <div className="grid grid-cols-2 gap-2">
                {APP_SHORTCUTS.map(s => (
                  <Link key={s.to} to={s.to} className="card p-4 flex items-center gap-3 hover:bg-heart-purple/5 border-white/5 transition-all">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-xs font-bold text-ink">{s.label}</span>
                  </Link>
                ))}
             </div>
           </section>
        </div>
      )}

      {query && (
        <div className="space-y-8 animate-in fade-in">
           {/* Shortcuts / Pages */}
           {filteredShortcuts.length > 0 && (
             <section className="space-y-3">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-heart-purple px-2">Features Found</h2>
                <div className="space-y-1">
                   {filteredShortcuts.map(s => (
                     <Link key={s.to} to={s.to} className="card p-3 flex items-center justify-between hover:bg-midnight-surface border-white/5">
                        <div className="flex items-center gap-3">
                           <span className="text-lg">{s.icon}</span>
                           <span className="text-xs font-bold text-ink">{s.label}</span>
                        </div>
                        <span className="text-muted">→</span>
                     </Link>
                   ))}
                </div>
             </section>
           )}

           {/* User Results */}
           <section className="space-y-3">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-muted px-2">People</h2>
             {loading ? (
                <div className="p-4 bg-white/5 rounded-2xl animate-pulse h-16" />
             ) : results.users.length === 0 ? (
                <p className="text-xs text-muted italic px-2">No users found.</p>
             ) : (
                <div className="space-y-1">
                   {results.users.map(u => {
                      const tier = getFameTier(u.fame)
                      return (
                        <Link key={u.id} to={`/u/${u.username}`} className="card p-3 flex items-center justify-between hover:bg-midnight-surface border-white/5 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                                 {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                 <div className="flex items-center gap-1">
                                    <span className="text-sm font-black text-ink">@{u.username}</span>
                                    <VerifiedBadge verified={u.is_verified} />
                                 </div>
                                 <p className="text-[10px] text-muted font-bold" style={{ color: tier.color }}>{tier.emoji} {tier.label}</p>
                              </div>
                           </div>
                           <span className="text-xs font-black text-heart-purple mr-2">View</span>
                        </Link>
                      )
                   })}
                </div>
             )}
           </section>

           {/* Whisper Results */}
           <section className="space-y-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Whispers</h2>
              {loading ? (
                <div className="p-4 bg-white/5 rounded-2xl animate-pulse h-24" />
              ) : results.whispers.length === 0 ? (
                <p className="text-xs text-muted italic px-2">No matching secrets found.</p>
              ) : (
                <div className="space-y-3">
                   {results.whispers.map(w => (
                     <Link key={w.id} to="/whispers" className="card p-4 block border-white/5 hover:border-heart-purple/20 transition-all">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[10px] font-black text-ink">@{w.author_username}</span>
                           <span className="text-[9px] text-muted">• {timeAgo(w.created_at)}</span>
                        </div>
                        <p className="text-xs text-ink/80 line-clamp-2 italic font-medium">"{w.body}"</p>
                        <div className="flex items-center gap-3 mt-3">
                           <span className="text-[9px] font-black text-muted">❤️ {w.like_count}</span>
                           <span className="text-[9px] font-black text-muted">💬 {w.reply_count}</span>
                        </div>
                     </Link>
                   ))}
                </div>
              )}
           </section>
        </div>
      )}
    </div>
  )
}
