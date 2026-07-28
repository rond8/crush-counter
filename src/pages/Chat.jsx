import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isMutualMatch, sendDirectMessage, getConversation } from '../lib/directMessages'
import { timeAgo } from '../lib/time'

const BODY_MAX = 1000

export default function Chat() {
  const { username } = useParams()
  const [allowed, setAllowed] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const scrollContainerRef = useRef(null)
  const bottomRef = useRef(null)

  const refresh = useCallback(async () => {
    const mutual = await isMutualMatch(username)
    setAllowed(mutual)
    if (mutual) {
      const convo = await getConversation(username)
      setMessages(convo || [])
    }
  }, [username])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  // Scroll to bottom when messages update
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
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        <p className="text-muted text-xs font-mono">Loading conversation...</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
          🔒
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-ink">Chat Locked</h1>
          <p className="text-muted text-xs sm:text-sm max-w-sm mx-auto">
            Direct messages are reserved for mutual matches. Head to the dashboard to discover your crushes!
          </p>
        </div>
        <Link to="/dashboard" className="btn-primary inline-flex text-xs font-semibold px-6 py-2.5 rounded-xl shadow-lg">
          Go to Dashboard 🚀
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 bg-slate-900/40 backdrop-blur-md rounded-t-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="text-muted hover:text-white transition-colors text-sm font-semibold pr-1"
            title="Back"
          >
            ←
          </Link>

          {/* User Avatar Placeholder */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-bold font-mono uppercase shadow-md">
            {username.slice(0, 2)}
          </div>

          <div>
            <Link
              to={`/u/${username}`}
              className="font-display text-sm font-bold text-ink hover:text-purple-300 transition-colors block leading-tight"
            >
              @{username}
            </Link>
            <span className="text-[10px] text-purple-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Mutual Match
            </span>
          </div>
        </div>

        <Link
          to={`/u/${username}`}
          className="text-xs text-muted hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors font-mono"
        >
          View Profile
        </Link>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-950/40 border-x border-white/5 shadow-inner"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-muted">
            <span className="text-3xl">✨</span>
            <p className="text-xs max-w-xs">
              You both matched! Start the conversation by sending a message below.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.is_mine ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md transition-all ${
                  m.is_mine
                    ? 'bg-purple-600 text-white rounded-tr-xs border border-purple-500/40'
                    : 'bg-slate-800 text-ink border border-white/10 rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <p
                  className={`text-[9px] font-mono mt-1 text-right ${
                    m.is_mine ? 'text-purple-200/70' : 'text-muted/60'
                  }`}
                >
                  {timeAgo(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input Box */}
      <div className="pt-3 bg-slate-900/60 backdrop-blur-md border-t border-white/10 rounded-b-2xl p-3">
        <form onSubmit={handleSend} className="space-y-2">
          <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-2 focus-within:border-purple-500 transition-colors">
            <textarea
              rows={1}
              maxLength={BODY_MAX}
              placeholder={`Message @${username}...`}
              className="w-full text-xs sm:text-sm bg-transparent text-ink focus:outline-none resize-none px-2 py-1.5 max-h-32"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />

            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="btn-primary !px-4 !py-2 text-xs font-semibold rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
            >
              {sending ? '...' : 'Send 🚀'}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted/60 px-1 font-mono">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>
              {body.length}/{BODY_MAX}
            </span>
          </div>
        </form>

        {error && <p className="text-rose-400 text-xs text-center mt-2 font-medium">{error}</p>}
      </div>
    </div>
  )
}