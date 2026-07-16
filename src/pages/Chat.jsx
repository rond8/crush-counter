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

  const bottomRef = useRef(null)

  const refresh = useCallback(async () => {
    const mutual = await isMutualMatch(username)
    setAllowed(mutual)
    if (mutual) {
      const convo = await getConversation(username)
      setMessages(convo)
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
    return <p className="text-muted text-sm font-mono text-center py-10">loading…</p>
  }

  if (!allowed) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-3">
        <p className="text-4xl">🔒</p>
        <h1 className="font-display text-2xl">Chat locked</h1>
        <p className="text-muted text-sm">
          You can only chat with mutual matches. Head to the dashboard to check your matches.
        </p>
        <Link to="/dashboard" className="btn-primary inline-flex">
          Go to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/u/${username}`} className="font-display text-xl hover:underline">
          @{username}
        </Link>
        <span className="text-xs text-heart-purple">💜 Mutual match</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="card p-8 text-center text-muted text-sm">
            Say hi — you're both here because it's mutual.
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
                <p className={`text-[10px] mt-1 ${m.is_mine ? 'text-midnight/60' : 'text-muted'}`}>
                  {timeAgo(m.created_at)}
                </p>
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
      {error && <p className="text-heart-red text-sm mt-2">{error}</p>}
    </div>
  )
}
