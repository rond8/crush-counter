import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isMutualMatch, sendDirectMessage, getConversation } from '../lib/directMessages'
import { getRelationshipStatus, getFriendLevel } from '../lib/friends'
import { timeAgo } from '../lib/time'
import ImageModal from '../components/ImageModal'

const BODY_MAX = 1000

export default function Chat() {
  const { username } = useParams()
  const [allowed, setAllowed] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [relationship, setRelationship] = useState({ status: 'none', points: 0 })

  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const [viewingImage, setViewImage] = useState(null)

  const scrollContainerRef = useRef(null)
  const bottomRef = useRef(null)

  const refresh = useCallback(async () => {
    try {
      const { data: targetProfile } = await supabase.from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle()
      let currentRelStatus = 'none'

      if (targetProfile) {
        const rel = await getRelationshipStatus(targetProfile.id)
        setRelationship(rel)
        currentRelStatus = rel.status
      }

      const mutual = await isMutualMatch(username)
      const canChat = mutual || (currentRelStatus === 'friends')
      setAllowed(canChat)

      if (canChat) {
        const convo = await getConversation(username)
        setMessages(convo || [])
      }
    } catch (err) {
      console.error('Refresh error:', err)
    }
  }, [username])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    if (!body.trim()) return

    setSending(true)
    try {
      await sendDirectMessage(username, body)
      setBody('')
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not send that message.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4">
        <div className="w-10 h-10 border-4 border-heart-purple/20 border-t-heart-purple rounded-full animate-spin" />
        <p className="text-muted text-xs font-medium tracking-wide">Securing connection...</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xs w-full text-center space-y-6">
          <div className="w-20 h-20 bg-heart-purple/10 rounded-full flex items-center justify-center mx-auto text-3xl">🔒</div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold">Encrypted Chat</h2>
            <p className="text-sm text-muted">You can only chat with mutual matches. Keep exploring to find yours!</p>
          </div>
          <Link to="/dashboard" className="btn-primary w-full">Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-midnight lg:static lg:h-[calc(100vh-2rem)]">
      {/* Messenger Header */}
      <header className="shrink-0 z-20 bg-midnight-surface/80 backdrop-blur-xl border-b border-midnight-border px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <Link to="/messages" className="p-2 -ml-2 text-muted hover:text-ink transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <Link to={`/u/${username}`} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-heart-purple to-heart-red flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-midnight">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1">
                {relationship.status === 'friends' && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg border-2 border-midnight"
                    style={{ backgroundColor: getFriendLevel(relationship.points).color }}
                    title={`${getFriendLevel(relationship.points).label} (Lv.${getFriendLevel(relationship.points).lv})`}
                  >
                    {getFriendLevel(relationship.points).lv}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-ink group-hover:text-heart-purple transition-colors leading-none flex items-center gap-1.5">
                @{username}
                {relationship.status === 'friends' && (
                  <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded-full text-muted uppercase tracking-tighter group-hover:text-heart-purple transition-colors">
                    {getFriendLevel(relationship.points).label}
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-muted mt-1 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-heart-purple animate-pulse" />
                Active now
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 text-muted hover:text-heart-purple transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
          <button className="p-2 text-muted hover:text-heart-purple transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
          </button>
        </div>
      </header>

      {/* Chat Canvas */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth bg-[url('/images/chat-bg.png')] bg-repeat bg-fixed opacity-95"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 py-10">
            <div className="w-20 h-20 rounded-full bg-heart-purple/5 flex items-center justify-center text-4xl">👋</div>
            <div className="space-y-1">
              <p className="text-ink font-bold">Say hi to @{username}!</p>
              <p className="text-[11px] text-muted max-w-[200px] mx-auto">You matched! Start the conversation to get to know each other better.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages.map((m, idx) => {
              const isMine = m.is_mine;
              const prevMsg = messages[idx - 1];
              const showTime = !prevMsg || (new Date(m.created_at) - new Date(prevMsg.created_at) > 300000);

              return (
                <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {showTime && (
                    <span className="w-full text-center text-[10px] text-muted/60 my-4 font-bold tracking-widest uppercase">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}

                  <div className={`group relative max-w-[85%] sm:max-w-[75%] px-4 py-2.5 shadow-sm transition-all duration-200
                    ${isMine
                      ? 'bg-heart-purple text-white rounded-2xl rounded-tr-none'
                      : 'bg-midnight-surface text-ink rounded-2xl rounded-tl-none border border-midnight-border'
                    }`}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.body}</p>

                    {/* Tiny Status indicator for my messages */}
                    {isMine && idx === messages.length - 1 && (
                      <span className="absolute -bottom-4 right-0 text-[9px] text-heart-purple font-bold">Sent</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Messenger Input Bar */}
      <div
        className="shrink-0 p-4 bg-midnight-surface/90 backdrop-blur-xl border-t border-midnight-border safe-area-bottom pb-banner"
        style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + var(--banner-height, 0px) + 1rem)' }}
      >
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
          <button type="button" className="p-2.5 text-heart-purple hover:bg-heart-purple/10 rounded-full transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>

          <div className="flex-1 bg-midnight border border-midnight-border rounded-3xl px-4 py-1.5 focus-within:ring-2 ring-heart-purple/20 transition-all flex items-end">
            <textarea
              rows={1}
              maxLength={BODY_MAX}
              placeholder="Aa"
              className="flex-1 bg-transparent text-ink text-sm py-2 focus:outline-none resize-none max-h-32"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button type="button" className="p-2 text-heart-purple hover:text-heart-red transition-colors shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            </button>
          </div>

          <button
            type="submit"
            disabled={sending || !body.trim()}
            className={`w-12 h-12 rounded-full transition-all shrink-0 shadow-lg flex items-center justify-center
              ${body.trim()
                ? 'bg-heart-purple text-white hover:scale-105 active:scale-95'
                : 'bg-midnight-border text-muted opacity-50'
              }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ transform: 'rotate(90deg) translateY(1px)' }}><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
        {error && <p className="text-[10px] text-heart-red text-center mt-2 font-bold">{error}</p>}
      </div>

      {viewingImage && (
        <ImageModal src={viewingImage} onClose={() => setViewImage(null)} />
      )}
    </div>
  )
}
