import { useCallback, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWhispers, postWhisper, deleteWhisper, reportWhisper } from '../lib/whispers'
import { timeAgo } from '../lib/time'
import ReportModal from '../components/ReportModal'
import ConfirmModal from '../components/ConfirmModal'
import WhisperCard from '../components/WhisperCard'

const COLORS = ['#8B5CF6', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#D946EF']
const POPULAR_TOPICS = ['Secret', 'Crush', 'Rant', 'Joke', 'Confession', 'Advice']

export default function Whispers() {
  const { session, profile, user } = useAuth()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [isAnon, setIsAnon] = useState(true)
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [posting, setPosting] = useState(false)

  const [isComposing, setIsComposing] = useState(false)
  const [replyTo, setReplyTo] = useState(null) // { id, author_username }

  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [error, setError] = useState('')

  const [reportingId, setReportingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchFeed = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getWhispers(search, activeTag)
      setFeed(data)
    } catch (err) {
      console.error(err)
      setError('Could not load whispers.')
    } finally {
      setLoading(false)
    }
  }, [search, activeTag])

  useEffect(() => {
    const timer = setTimeout(() => fetchFeed(), 400)
    return () => clearTimeout(timer)
  }, [fetchFeed])

  const addTag = (tag) => {
    const clean = tag.trim().replace(/#/g, '').toLowerCase()
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean])
      setTagInput('')
    }
  }

  const handlePost = async (e) => {
    if (e) e.preventDefault()
    if (!body.trim()) return

    setPosting(true)
    setError('')

    // Capture any tag left in the input box
    let finalTags = [...tags]
    const cleanPending = tagInput.trim().replace(/#/g, '').toLowerCase()
    if (cleanPending && !finalTags.includes(cleanPending)) {
      finalTags.push(cleanPending)
    }

    try {
      await postWhisper(body, selectedColor, finalTags, isAnon, replyTo?.id || null)
      setBody('')
      setTags([])
      setTagInput('')
      setIsComposing(false)
      setReplyTo(null)
      fetchFeed()
    } catch (err) {
      setError(err.message || 'Failed to post.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-32">
      {/* Header & Search */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
           <h1 className="text-3xl font-display font-black text-ink italic">Whispers</h1>
           {session && !isComposing && (
             <button
               onClick={() => { setIsComposing(true); setReplyTo(null); }}
               className="btn-primary !py-2 !px-5 text-xs font-black uppercase tracking-widest shadow-lg"
             >
               Post Whisper
             </button>
           )}
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            type="text"
            placeholder="Search secrets or topics..."
            className="w-full bg-midnight-surface border border-midnight-border rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 ring-heart-purple/40 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Topic Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           <button
             onClick={() => setActiveTag('')}
             className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border
               ${!activeTag ? 'bg-heart-purple text-white border-heart-purple' : 'bg-midnight-surface text-muted border-midnight-border'}
             `}
           >
             All
           </button>
           {POPULAR_TOPICS.map(topic => {
             const lower = topic.toLowerCase()
             const active = activeTag.toLowerCase() === lower
             return (
               <button
                 key={topic}
                 onClick={() => setActiveTag(active ? '' : lower)}
                 className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border
                   ${active ? 'bg-heart-purple text-white border-heart-purple shadow-lg' : 'bg-midnight-surface text-muted border-midnight-border'}
                 `}
               >
                 #{topic}
               </button>
             )
           })}
        </div>
      </section>

      {/* Post Section */}
      {session && isComposing && (
        <section className="card p-5 border-heart-purple/40 bg-midnight-surface shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-black uppercase tracking-widest text-heart-purple">
               {replyTo ? `Replying to @${replyTo.author_username}` : 'New Secret'}
             </span>
             <button onClick={() => { setIsComposing(false); setReplyTo(null); }} className="text-muted text-xl">×</button>
          </div>

          <div className="flex gap-3">
             <div className="w-10 h-10 rounded-full bg-heart-purple/10 flex items-center justify-center shrink-0">
               {isAnon ? '👤' : (profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : profile?.username?.[0]?.toUpperCase())}
             </div>
             <div className="flex-1 space-y-4">
                <textarea
                  placeholder={replyTo ? "Write your reply..." : "What's your secret?"}
                  className="w-full bg-transparent border-none p-0 text-lg resize-none min-h-[100px] focus:ring-0 placeholder:text-muted/30"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={500}
                  autoFocus
                />

                {/* Tag Display */}
                {!replyTo && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span key={t} className="text-[10px] text-heart-purple font-black bg-heart-purple/10 px-2 py-0.5 rounded-lg border border-heart-purple/20">
                        #{t.toUpperCase()}
                        <button onClick={() => setTags(tags.filter(x => x !== t))} className="text-muted ml-1.5 hover:text-heart-red font-bold">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 space-y-4">
                   <div className="flex flex-wrap items-center justify-between gap-4">
                      {!replyTo && (
                        <div className="flex items-center gap-2">
                          {COLORS.map(c => (
                            <button key={c} onClick={() => setSelectedColor(c)} className={`w-5 h-5 rounded-full border-2 transition-all ${selectedColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      )}

                      {!replyTo && (
                        <input
                          type="text"
                          placeholder="#add-topic (Press Enter)"
                          className="bg-transparent text-[11px] font-bold text-heart-purple focus:outline-none w-32 placeholder:opacity-50"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addTag(tagInput)}
                        />
                      )}
                   </div>

                   <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="accent-heart-purple w-4 h-4 rounded" />
                        <span className="text-xs font-bold text-muted group-hover:text-ink">Post Anonymously</span>
                      </label>

                      <button onClick={handlePost} disabled={posting || !body.trim()} className="btn-primary !py-2.5 !px-10 text-xs font-black uppercase tracking-widest shadow-glow-purple">
                        {posting ? '...' : replyTo ? 'Reply' : 'Publish'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </section>
      )}

      {/* Feed */}
      <div className="space-y-0.5 divide-y divide-midnight-border border-y border-midnight-border">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="p-6 h-32 bg-white/5 animate-pulse" />)
        ) : feed.length === 0 ? (
          <div className="py-20 text-center text-muted italic">No whispers found.</div>
        ) : (
          feed.map((w) => (
            <WhisperCard
              key={w.id}
              whisper={w}
              currentUser={user}
              currentProfile={profile}
              onDelete={() => setDeletingId(w.id)}
              onReport={() => setReportingId(w.id)}
              setActiveTag={setActiveTag}
              setReplyTo={(r) => { setReplyTo(r); setIsComposing(true); }}
            />
          ))
        )}
      </div>

      <ConfirmModal isOpen={Boolean(deletingId)} title="Delete?" message="Remove this whisper?" onConfirm={async () => { try { await deleteWhisper(deletingId); setFeed(prev => prev.filter(w => w.id !== deletingId)); setDeletingId(null); } catch (err) { alert(err.message) } }} onClose={() => setDeletingId(null)} />
      {reportingId && <ReportModal title="Report" onSubmit={(r, d) => { reportWhisper(reportingId, r, d); alert('Report submitted.'); setReportingId(null); }} onClose={() => setReportingId(null)} />}
    </div>
  )
}
