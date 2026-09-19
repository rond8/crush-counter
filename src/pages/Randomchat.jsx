import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  findRandomMatch,
  checkRandomMatch,
  leaveRandomQueue,
  sendRandomChatMessage,
  getRandomChatMessages,
  endRandomChat,
  getRandomChatStatus,
  getGroupMessages,
  sendGroupMessage,
} from '../lib/Randomchat'
import VerifiedBadge from '../components/VerifiedBadge'
import { timeAgo } from '../lib/time'

const WAIT_POLL_MS = 3000
const CHAT_POLL_MS = 3000
const BODY_MAX = 1000

export default function RandomChat() {
  const [phase, setPhase] = useState('idle') // idle | searching | matched | partner_left | group_chat
  const [anonymous, setAnonymous] = useState(true)
  const [targetGender, setTargetGender] = useState('all') // all | male | female
  const [fallback, setFallback] = useState(null)
  const [error, setError] = useState('')

  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const phaseRef = useRef(phase)
  const sessionRef = useRef(session)
  const waitTimerRef = useRef(null)
  const chatTimerRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { sessionRef.current = session }, [session])

  const clearWaitTimer = () => { if (waitTimerRef.current) clearInterval(waitTimerRef.current); waitTimerRef.current = null; }
  const clearChatTimer = () => { if (chatTimerRef.current) clearInterval(chatTimerRef.current); chatTimerRef.current = null; }

  const enterMatchedState = useCallback((result) => {
    clearWaitTimer()
    setSession({
      id: result.session_id,
      partner_username: result.partner_username,
      partner_avatar_url: result.partner_avatar_url,
      partner_anonymous: result.partner_anonymous,
      partner_is_verified: result.partner_is_verified,
    })
    setMessages([])
    setFallback(null)
    setPhase('matched')
  }, [])

  const startSearch = useCallback(async () => {
    setError('')
    setPhase('searching')
    try {
      const result = await findRandomMatch(anonymous, targetGender)
      if (result?.matched) {
        enterMatchedState(result)
      } else {
        setFallback({
          username: result?.fallback_username ?? null,
          avatar_url: result?.fallback_avatar_url ?? null,
          bio: result?.fallback_bio ?? null,
          gender: result?.fallback_gender ?? null,
          age: result?.fallback_age ?? null,
          is_verified: result?.fallback_is_verified ?? false,
        })
        clearWaitTimer()
        waitTimerRef.current = setInterval(async () => {
          try {
            const match = await checkRandomMatch()
            if (match?.session_id) enterMatchedState(match)
          } catch {}
        }, WAIT_POLL_MS)
      }
    } catch (err) {
      setError(err.message || 'Could not start a random match.')
      setPhase('idle')
    }
  }, [anonymous, targetGender, enterMatchedState])

  const cancelSearch = async () => {
    clearWaitTimer()
    try { await leaveRandomQueue() } catch {}
    setFallback(null)
    setPhase('idle')
  }

  useEffect(() => {
    if (phase !== 'matched' || !session?.id) return
    let cancelled = false
    const poll = async () => {
      try {
        const [msgs, status] = await Promise.all([getRandomChatMessages(session.id), getRandomChatStatus(session.id)])
        if (cancelled) return
        setMessages(msgs)
        if (status.ended && !status.ended_by_me) setPhase('partner_left')
      } catch {}
    }
    poll()
    clearChatTimer()
    chatTimerRef.current = setInterval(poll, CHAT_POLL_MS)
    return () => { cancelled = true; clearChatTimer(); }
  }, [phase, session?.id])

  // Poll for Group Chat
  useEffect(() => {
    if (phase !== 'group_chat') return
    let cancelled = false
    const pollGroup = async () => {
      try {
        const msgs = await getGroupMessages()
        if (cancelled) return
        setMessages([...msgs].reverse())
      } catch {}
    }
    pollGroup()
    const timer = setInterval(pollGroup, CHAT_POLL_MS)
    return () => { cancelled = true; clearInterval(timer); }
  }, [phase])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    return () => {
      clearWaitTimer(); clearChatTimer();
      if (phaseRef.current === 'searching') leaveRandomQueue().catch(() => {})
      else if (phaseRef.current === 'matched' && sessionRef.current?.id) endRandomChat(sessionRef.current.id).catch(() => {})
    }
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!body.trim()) return

    if (phase === 'group_chat') {
      setSending(true)
      try {
        await sendGroupMessage(body)
        setBody('')
        const msgs = await getGroupMessages()
        setMessages([...msgs].reverse())
      } catch (err) { setError(err.message) }
      finally { setSending(false) }
      return
    }

    if (!session?.id) return
    setSending(true)
    try {
      await sendRandomChatMessage(session.id, body)
      setBody('')
      const msgs = await getRandomChatMessages(session.id)
      setMessages(msgs)
    } catch (err) { setError(err.message) }
    finally { setSending(false) }
  }

  const handleSkip = async () => {
    if (session?.id) try { await endRandomChat(session.id) } catch {}
    setSession(null); setMessages([]); await startSearch()
  }

  const handleLeave = async () => {
    if (session?.id) try { await endRandomChat(session.id) } catch {}
    setSession(null); setMessages([]); setPhase('idle')
  }

  if (phase === 'group_chat') {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-midnight lg:static lg:h-[calc(100vh-2rem)]">
        <header className="shrink-0 z-20 bg-midnight-surface/80 backdrop-blur-xl border-b border-midnight-border px-4 py-3 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-3">
            <button onClick={() => setPhase('idle')} className="p-2 -ml-2 text-muted hover:text-ink transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-sm font-bold text-ink leading-none">Random Group Chat</h1>
              <p className="text-[10px] text-muted mt-1 font-medium">Public Chat Room</p>
            </div>
          </div>
          <button onClick={() => setPhase('idle')} className="btn-ghost !py-1.5 !px-4 text-[10px] uppercase tracking-widest font-black">Leave Room</button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-[url('/images/chat-bg.png')] bg-repeat bg-fixed opacity-95">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 py-10">
              <div className="w-20 h-20 rounded-full bg-heart-purple/5 flex items-center justify-center text-4xl">💬</div>
              <p className="text-ink font-bold">Welcome to Random Group Chat!</p>
              <p className="text-[11px] text-muted max-w-[200px] mx-auto">Be the first to send a message to everyone.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2.5 ${m.is_mine ? 'flex-row-reverse items-end' : 'items-start'}`}>
                  {!m.is_mine && (
                    <Link to={`/u/${m.sender_username}`} className="w-8 h-8 rounded-full bg-heart-purple/20 text-heart-purple flex items-center justify-center font-bold text-xs shrink-0 shadow">
                      {m.sender_username?.[0]?.toUpperCase()}
                    </Link>
                  )}
                  <div className={`flex flex-col max-w-[75%] ${m.is_mine ? 'items-end' : 'items-start'}`}>
                    {!m.is_mine && (
                      <span className="text-[10px] text-muted font-semibold mb-0.5 ml-1">@{m.sender_username}</span>
                    )}
                    <div className={`px-4 py-2.5 shadow-sm transition-all rounded-2xl
                      ${m.is_mine ? 'bg-heart-purple text-white rounded-tr-none' : 'bg-midnight-surface text-ink border border-midnight-border rounded-2xl rounded-tl-none'}`}
                    >
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    </div>
                    <span className="text-[8px] text-muted/60 mt-0.5 px-1">{timeAgo(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 p-4 bg-midnight-surface/90 backdrop-blur-xl border-t border-midnight-border pb-with-banner safe-area-bottom">
          <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-1 bg-midnight border border-midnight-border rounded-3xl px-4 py-1.5 flex items-end">
              <textarea
                rows={1}
                placeholder="Message group..."
                className="flex-1 bg-transparent text-ink text-sm py-2 focus:outline-none resize-none max-h-32"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
            </div>
            <button type="submit" disabled={sending || !body.trim()} className="p-3 bg-heart-purple text-white rounded-full shadow-lg">
              <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (phase === 'matched' && session) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-midnight lg:static lg:h-[calc(100vh-2rem)]">
        <header className="shrink-0 z-20 bg-midnight-surface/80 backdrop-blur-xl border-b border-midnight-border px-4 py-3 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-3">
            <button onClick={handleLeave} className="p-2 -ml-2 text-muted hover:text-ink transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                {session.partner_anonymous ? (
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-muted border border-white/10 shadow-lg">🕵️</div>
                ) : (
                  <Link
                    to={`/u/${session.partner_username}`}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-heart-purple to-heart-red flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-midnight hover:opacity-80 transition-all"
                  >
                    {session.partner_username[0].toUpperCase()}
                  </Link>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-midnight rounded-full" />
              </div>
              <div>
                {session.partner_anonymous ? (
                  <h1 className="text-sm font-bold text-ink leading-none">Stranger</h1>
                ) : (
                  <Link to={`/u/${session.partner_username}`} className="text-sm font-bold text-ink leading-none hover:text-heart-purple transition-colors">
                    @{session.partner_username}
                  </Link>
                )}
                <p className="text-[10px] text-muted mt-1 font-medium">Random Match</p>
              </div>
            </div>
          </div>
          <button onClick={handleSkip} className="btn-primary !py-1.5 !px-4 text-[10px] shadow-glow-purple uppercase tracking-widest font-black">Skip Round</button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-[url('/images/chat-bg.png')] bg-repeat bg-fixed opacity-95">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-full text-center space-y-4 py-10">
              <div className="w-20 h-20 rounded-full bg-heart-purple/5 flex items-center justify-center text-4xl">🎲</div>
              <p className="text-ink font-bold">Matched with {session.partner_anonymous ? 'a stranger' : 'someone new'}!</p>
              <p className="text-[11px] text-muted max-w-[200px] mx-auto">Say hi and start a random conversation.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.is_mine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 shadow-sm transition-all
                    ${m.is_mine ? 'bg-heart-purple text-white rounded-2xl rounded-tr-none' : 'bg-midnight-surface text-ink border border-midnight-border rounded-2xl rounded-tl-none'}`}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 p-4 bg-midnight-surface/90 backdrop-blur-xl border-t border-midnight-border pb-with-banner safe-area-bottom">
          <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-1 bg-midnight border border-midnight-border rounded-3xl px-4 py-1.5 flex items-end">
              <textarea
                rows={1}
                placeholder="Aa"
                className="flex-1 bg-transparent text-ink text-sm py-2 focus:outline-none resize-none max-h-32"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
              />
            </div>
            <button type="submit" disabled={sending || !body.trim()} className="p-3 bg-heart-purple text-white rounded-full shadow-lg">
              <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-3">
        <h1 className="font-display text-4xl font-black flex items-center justify-center gap-3">
          <span className="text-heart-purple animate-bounce">🎲</span>
          Random Chat
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto">Meet someone new instantly. Completely random, completely anonymous (if you want).</p>
      </section>

      {phase === 'idle' && (
        <div className="card p-8 space-y-6 text-center bg-gradient-to-br from-indigo-900/10 to-midnight border-indigo-500/20">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Who do you want to meet?</p>
            <div className="flex gap-2 justify-center">
              {['all', 'male', 'female'].map((g) => (
                <button
                  key={g}
                  onClick={() => setTargetGender(g)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                    targetGender === g
                      ? 'bg-heart-purple border-heart-purple text-white shadow-glow-purple'
                      : 'bg-white/5 border-white/10 text-muted'
                  }`}
                >
                  {g === 'all' ? 'Everyone ' : g === 'male' ? 'Men ' : 'Women '}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border border-white/5">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="accent-heart-purple w-5 h-5" />
            <div className="text-left">
               <p className="text-sm font-bold text-ink">Stay Anonymous</p>
               <p className="text-[10px] text-muted leading-tight">Hide your details during the chat.</p>
            </div>
          </label>

          <button onClick={startSearch} className="btn-primary w-full py-4 text-sm font-black shadow-glow-purple uppercase tracking-widest">Start Matching</button>

          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative px-3 text-[10px] text-muted uppercase font-bold bg-midnight">Or</span>
          </div>

          <button onClick={() => { setMessages([]); setPhase('group_chat'); }} className="btn-secondary w-full py-4 text-sm font-black border border-white/10 hover:bg-white/5 uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl text-ink">
            <span>💬</span> Join Group Chat Room
          </button>

          {error && <p className="text-heart-red text-[10px] font-bold">{error}</p>}
        </div>
      )}

      {phase === 'searching' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          <div className="card p-10 text-center space-y-4 border-heart-purple/30 bg-heart-purple/5">
            <div className="relative w-20 h-20 mx-auto">
               <div className="absolute inset-0 border-4 border-heart-purple/20 rounded-full" />
               <div className="absolute inset-0 border-4 border-heart-purple border-t-transparent rounded-full animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
            </div>
            <p className="text-lg font-display font-bold text-ink">Searching for a partner...</p>
            <button onClick={cancelSearch} className="btn-ghost !px-6 !py-2 text-xs">Cancel</button>
          </div>

          {fallback && (
            <div className="card p-5 space-y-4 border-white/10 animate-in slide-in-from-bottom-4">
              <p className="text-[10px] text-muted uppercase tracking-[0.2em] text-center font-black">While you wait, discover:</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-heart-purple/20 flex items-center justify-center text-xl font-display text-heart-purple border border-heart-purple/40">
                  {fallback.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/u/${fallback.username}`} className="text-sm font-bold text-ink hover:text-heart-purple block truncate">@{fallback.username}</Link>
                  <p className="text-[10px] text-muted mt-1 truncate">{fallback.bio || 'No bio shared'}</p>
                </div>
                <Link to={`/u/${fallback.username}`} className="btn-primary !py-1.5 !px-4 text-[10px]">View</Link>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'partner_left' && (
        <div className="card p-10 text-center space-y-6 animate-in zoom-in-95 border-heart-red/20">
          <div className="text-5xl"></div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-ink">They left the chat.</h2>
            <p className="text-xs text-muted">Don't worry, there are plenty more people to meet!</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={startSearch} className="btn-primary w-full py-3">Find Another Match</button>
            <button onClick={() => setPhase('idle')} className="btn-ghost w-full py-3">Return to Lobby</button>
          </div>
        </div>
      )}
    </div>
  )
}
