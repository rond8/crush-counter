import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getWhispers, likeWhisper } from '../lib/whispers'
import { timeAgo } from '../lib/time'

export default function WhisperCard({ whisper, currentUser, currentProfile, onDelete, onReport, setActiveTag, setReplyTo }) {
  const [w, setW] = useState(whisper)
  const [isExpanded, setIsExpanded] = useState(false)
  const [replies, setReplies] = useState([])
  const [loadingReplies, setLoadingReplies] = useState(false)

  const handleLike = async () => {
    try {
      const newlyLiked = await likeWhisper(w.id)
      if (newlyLiked) {
        setW(prev => ({ ...prev, like_count: (prev.like_count || 0) + 1, liked_by_me: true }))
      }
    } catch {}
  }

  const toggleExpand = async () => {
    const next = !isExpanded
    setIsExpanded(next)
    if (next && replies.length === 0) {
      loadReplies()
    }
  }

  const loadReplies = async () => {
    setLoadingReplies(true)
    try {
      const data = await getWhispers('', '', w.id)
      setReplies(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReplies(false)
    }
  }

  const handleShare = async () => {
    const text = `"${w.body}" - Read more on Crush Counter!`
    if (navigator.share) {
      try { await navigator.share({ title: 'Whisper', text, url: window.location.href }) } catch {}
    } else {
      navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
  }

  return (
    <div className="bg-midnight border-b border-midnight-border last:border-none group w-full">
      <div className="p-4 sm:p-6 flex gap-3 text-left relative">
        <div className="shrink-0">
          {w.is_anonymous ? (
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 text-lg">👤</div>
          ) : (
            <Link to={`/u/${w.author_username}`} className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 overflow-hidden hover:ring-2 ring-heart-purple/50 transition-all block">
               {w.author_avatar_url ? <img src={w.author_avatar_url} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full font-bold text-heart-purple">{w.author_username?.[0]?.toUpperCase()}</span>}
            </Link>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {w.is_anonymous ? <span className="text-sm font-black text-ink">Stranger</span> : <Link to={`/u/${w.author_username}`} className="text-sm font-black text-ink hover:text-heart-purple hover:underline">@{w.author_username}</Link>}
              {w.is_friend && <span className="text-[8px] bg-heart-purple/20 text-heart-purple px-1.5 py-0.5 rounded-full font-black uppercase">Friend</span>}
              <span className="text-[10px] text-muted">• {timeAgo(w.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color, boxShadow: `0 0 8px ${w.color}` }} />
              <div className="relative group/options">
                <button className="p-1 text-muted hover:text-ink"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg></button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover/options:block bg-midnight-surface border border-midnight-border rounded-lg shadow-xl z-30 min-w-[100px]">
                  {(w.author_id === currentUser?.id && currentUser?.id) || currentProfile?.is_admin ? (
                    <button onClick={onDelete} className="w-full text-left px-3 py-2 text-xs text-heart-red hover:bg-white/5 font-bold uppercase">Delete</button>
                  ) : (
                    <button onClick={onReport} className="w-full text-left px-3 py-2 text-xs text-heart-yellow hover:bg-white/5 font-bold uppercase">Report</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[15px] leading-relaxed text-ink/90 whitespace-pre-wrap font-medium">{w.body}</p>

          {w.tags && w.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {w.tags.map(t => (
                <button key={t} onClick={() => setActiveTag && setActiveTag(t)} className="text-[11px] font-black text-heart-purple hover:underline uppercase">#{t}</button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-8 pt-2">
            <button onClick={handleLike} className={`flex items-center gap-1.5 transition-all hover:scale-110 ${w.liked_by_me ? 'text-heart-red' : 'text-muted hover:text-heart-red'}`}>
              <span className="text-lg">{w.liked_by_me ? '❤️' : '🤍'}</span>
              <span className="text-[11px] font-black">{w.like_count || 0}</span>
            </button>
            <button onClick={toggleExpand} className={`flex items-center gap-1.5 transition-colors ${isExpanded ? 'text-heart-purple' : 'text-muted hover:text-heart-purple'}`}>
              <span className="text-lg">💬</span>
              <span className="text-[11px] font-black">{w.reply_count || 0}</span>
            </button>
            <button onClick={handleShare} className="text-muted hover:text-ink transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Reply List */}
      {isExpanded && (
        <div className="px-4 pb-6 sm:px-10 animate-in fade-in slide-in-from-top-2 duration-200">
           <div className="bg-midnight-surface/50 border border-midnight-border/50 rounded-2xl p-4 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                 <span className="text-[9px] font-black text-muted uppercase tracking-widest">Comments</span>
                 <button
                  onClick={() => setReplyTo && setReplyTo({ id: w.id, author_username: w.is_anonymous ? 'Stranger' : w.author_username })}
                  className="text-[9px] font-black text-heart-purple uppercase hover:underline"
                 >
                   Write Reply
                 </button>
              </div>

              {loadingReplies ? (
                <div className="text-center py-4"><span className="text-[10px] font-bold text-muted animate-pulse uppercase">loading...</span></div>
              ) : replies.length === 0 ? (
                <div className="text-center py-4 text-[10px] font-black text-muted uppercase opacity-50 italic">No replies yet.</div>
              ) : (
                <div className="space-y-4 border-l-2 border-midnight-border ml-2 pl-4">
                  {replies.map(r => (
                    <div key={r.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                         {r.is_anonymous ? (
                           <span className="text-[10px] font-black text-ink uppercase">Stranger</span>
                         ) : (
                           <Link to={`/u/${r.author_username}`} className="text-[10px] font-black text-heart-purple hover:underline uppercase">
                             @{r.author_username}
                           </Link>
                         )}
                         <span className="text-[9px] text-muted">• {timeAgo(r.created_at)}</span>
                      </div>
                      <p className="text-xs text-ink/80 leading-relaxed font-medium">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  )
}
