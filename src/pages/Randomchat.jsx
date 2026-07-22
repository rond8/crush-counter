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
} from '../lib/randomChat'

const WAIT_POLL_MS = 3000
const CHAT_POLL_MS = 3000
const BODY_MAX = 1000

// Drop your own image files at these paths under the project's
// public/ folder (e.g. public/images/random-chat/dice.png) — Vite
// serves anything in public/ directly at the matching URL, no import
// needed. Any image format works (png, svg, webp, etc.) as long as
// the filename/extension matches what's listed here.
const ICONS = {
  dice: '/images/random-chat/dice.png',
  mask: '/images/random-chat/mask.png',
  refresh: '/images/random-chat/refresh.png',
  skip: '/images/random-chat/skip.png',
  wave: '/images/random-chat/wave.png',
}

export default function RandomChat() {
  const [phase, setPhase] = useState('idle') // idle | searching | matched | partner_left
  const [anonymous, setAnonymous] = useState(true)
  const [fallback, setFallback] = useState(null)
  const [error, setError] = useState('')

  const [session, setSession] = useState(null) // { id, partner_username, partner_avatar_url, partner_anonymous }
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const phaseRef = useRef(phase)
  const sessionRef = useRef(session)
  const waitTimerRef = useRef(null)
  const chatTimerRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const clearWaitTimer = () => {
    if (waitTimerRef.current) clearInterval(waitTimerRef.current)
    waitTimerRef.current = null
  }
  const clearChatTimer = () => {
    if (chatTimerRef.current) clearInterval(chatTimerRef.current)
    chatTimerRef.current = null
  }

  const enterMatchedState = useCallback((result) => {
    clearWaitTimer()
    setSession({
      id: result.session_id,
      partner_username: result.partner_username,
      partner_avatar_url: result.partner_avatar_url,
      partner_anonymous: result.partner_anonymous,
    })
    setMessages([])
    setFallback(null)
    setPhase('matched')
  }, [])

  const startSearch = useCallback(async () => {
    setError('')
    setPhase('searching')
    try {
      const result = await findRandomMatch(anonymous)
      if (result?.matched) {
        enterMatchedState(result)
      } else {
        setFallback({
          username: result?.fallback_username ?? null,
          avatar_url: result?.fallback_avatar_url ?? null,
          bio: result?.fallback_bio ?? null,
          gender: result?.fallback_gender ?? null,
          age: result?.fallback_age ?? null,
        })
        clearWaitTimer()
        waitTimerRef.current = setInterval(async () => {
          try {
            const match = await checkRandomMatch()
            if (match?.session_id) {
              enterMatchedState(match)
            }
          } catch {
            // Transient — just try again on the next tick.
          }
        }, WAIT_POLL_MS)
      }
    } catch (err) {
      setError(err.message || 'Could not start a random match.')
      setPhase('idle')
    }
  }, [anonymous, enterMatchedState])

  const cancelSearch = async () => {
    clearWaitTimer()
    try {
      await leaveRandomQueue()
    } catch {
      // best-effort
    }
    setFallback(null)
    setPhase('idle')
  }

  // Poll messages + partner status while matched.
  useEffect(() => {
    if (phase !== 'matched' || !session?.id) return

    let cancelled = false
    const poll = async () => {
      try {
        const [msgs, status] = await Promise.all([
          getRandomChatMessages(session.id),
          getRandomChatStatus(session.id),
        ])
        if (cancelled) return
        setMessages(msgs)
        if (status.ended && !status.ended_by_me) {
          setPhase('partner_left')
        }
      } catch {
        // Transient — try again next tick.
      }
    }
    poll()
    clearChatTimer()
    chatTimerRef.current = setInterval(poll, CHAT_POLL_MS)

    return () => {
      cancelled = true
      clearChatTimer()
    }
  }, [phase, session?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clean up on unmount: leave the queue if still waiting, or end
  // the chat if still matched, so nothing dangles server-side.
  useEffect(() => {
    return () => {
      clearWaitTimer()
      clearChatTimer()
      if (phaseRef.current === 'searching') {
        leaveRandomQueue().catch(() => {})
      } else if (phaseRef.current === 'matched' && sessionRef.current?.id) {
        endRandomChat(sessionRef.current.id).catch(() => {})
      }
    }
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!body.trim() || !session?.id) return
    setSending(true)
    try {
      await sendRandomChatMessage(session.id, body)
      setBody('')
      const msgs = await getRandomChatMessages(session.id)
      setMessages(msgs)
    } catch (err) {
      setError(err.message || 'Could not send that message.')
    } finally {
      setSending(false)
    }
  }

  const handleSkip = async () => {
    setError('')
    if (session?.id) {
      try {
        await endRandomChat(session.id)
      } catch {
        // best-effort — still try to find a new match
      }
    }
    setSession(null)
    setMessages([])
    await startSearch()
  }

  const handleLeave = async () => {
    if (session?.id) {
      try {
        await endRandomChat(session.id)
      } catch {
        // best-effort
      }
    }
    setSession(null)
    setMessages([])
    setPhase('idle')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl flex items-center justify-center gap-2">
          <img src={ICONS.dice} alt="" className="w-8 h-8" />
          Random Chat
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Get matched with someone new. Choose whether to stay anonymous each round.
        </p>
      </section>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}

      {phase === 'idle' && (
        <div className="card p-6 space-y-5 text-center">
          <label className="flex items-center justify-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="accent-heart-purple w-4 h-4"
            />
            Chat anonymously this round
          </label>
          <button onClick={startSearch} className="btn-primary w-full inline-flex items-center justify-center gap-2">
            <img src={ICONS.dice} alt="" className="w-5 h-5" />
            Find a random match
          </button>
        </div>
      )}

      {phase === 'searching' && (
        <div className="space-y-4">
          <div className="card p-6 text-center space-y-2">
            <p className="text-sm text-muted font-mono">Looking for someone online…</p>
            <div className="flex justify-center gap-1.5 pt-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-heart-purple animate-pulseGlow" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-heart-purple animate-pulseGlow"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-heart-purple animate-pulseGlow"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          </div>

          {fallback && (
            <div className="card p-5 space-y-3">
              <p className="text-xs text-muted uppercase tracking-wide text-center">
                While you wait, meet
              </p>
              <div className="flex items-center gap-4">
                {fallback.avatar_url ? (
                  <img src={fallback.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-heart-purple/20 flex items-center justify-center text-xl font-display">
                    {fallback.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-ink">@{fallback.username}</p>
                  <p className="text-xs text-muted">
                    {[fallback.gender, fallback.age].filter(Boolean).join(' · ') || 'No details shared yet'}
                  </p>
                </div>
              </div>
              {fallback.bio && <p className="text-sm text-muted">{fallback.bio}</p>}
              {fallback.username && (
                <Link
                  to={`/u/${fallback.username}`}
                  className="btn-ghost w-full inline-flex justify-center text-sm"
                >
                  View full profile
                </Link>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={startSearch} className="btn-ghost flex-1 text-sm inline-flex items-center justify-center gap-1.5">
              <img src={ICONS.refresh} alt="" className="w-4 h-4" />
              Try again
            </button>
            <button onClick={cancelSearch} className="btn-ghost flex-1 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'matched' && session && (
        <div className="flex flex-col h-[calc(100vh-14rem)]">
          <div className="card p-4 flex items-center gap-3 mb-4">
            {session.partner_anonymous ? (
              <>
                <span className="w-10 h-10 rounded-full bg-midnight-border flex items-center justify-center overflow-hidden">
                  <img src={ICONS.mask} alt="Anonymous" className="w-6 h-6" />
                </span>
                <div>
                  <p className="text-sm text-ink font-semibold">Anonymous stranger</p>
                  <p className="text-xs text-muted">They've chosen to stay anonymous</p>
                </div>
              </>
            ) : (
              <>
                {session.partner_avatar_url ? (
                  <img src={session.partner_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-heart-purple/20 flex items-center justify-center text-sm font-display">
                    {session.partner_username?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
                <Link to={`/u/${session.partner_username}`} className="text-sm font-mono text-ink hover:underline">
                  @{session.partner_username}
                </Link>
              </>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={handleSkip} className="btn-ghost !px-3 !py-1.5 text-xs inline-flex items-center gap-1">
                <img src={ICONS.skip} alt="" className="w-3.5 h-3.5" />
                Skip
              </button>
              <button onClick={handleLeave} className="btn-ghost !px-3 !py-1.5 text-xs !text-heart-red">
                Leave
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm">
                Say hi — you're both here to meet someone new.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.is_mine
                        ? 'bg-heart-purple text-midnight'
                        : 'bg-midnight-surface border border-midnight-border text-ink'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="mt-4 flex gap-2 items-end">
            <textarea
              rows={1}
              maxLength={BODY_MAX}
              placeholder="Type a message…"
              className="input-field resize-none flex-1"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />
            <button type="submit" disabled={sending || !body.trim()} className="btn-primary !px-5 !py-3">
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {phase === 'partner_left' && (
        <div className="card p-8 text-center space-y-4">
          <img src={ICONS.wave} alt="" className="w-12 h-12 mx-auto" />
          <p className="text-sm text-ink font-semibold">Your chat partner left</p>
          <div className="flex gap-3 justify-center">
            <button onClick={startSearch} className="btn-primary !px-5 !py-2.5 inline-flex items-center gap-2">
              <img src={ICONS.dice} alt="" className="w-4 h-4" />
              Find another
            </button>
            <button onClick={() => setPhase('idle')} className="btn-ghost !px-5 !py-2.5">
              Leave
            </button>
          </div>
        </div>
      )}
    </div>
  )
}