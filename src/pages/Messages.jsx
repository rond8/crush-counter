import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyCrush } from '../lib/crush'
import { sendMessage, getMyMessages, getMySentMessages } from '../lib/messages'
import { reportMessage } from '../lib/reports'
import { timeAgo } from '../lib/time'
import ReportModal from '../components/ReportModal'

const BODY_MAX = 500

export default function Messages() {
  const [tab, setTab] = useState('received')

  const [myCrush, setMyCrush] = useState(null)
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)

  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reportingId, setReportingId] = useState(null)

  const refresh = useCallback(async () => {
    const [crush, receivedMsgs, sentMsgs] = await Promise.all([
      getMyCrush(),
      getMyMessages(),
      getMySentMessages(),
    ])
    setMyCrush(crush)
    setReceived(receivedMsgs)
    setSent(sentMsgs)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const handleSend = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!body.trim()) return

    setSending(true)
    try {
      await sendMessage(body)
      setSuccess(`Message sent to @${myCrush.target_username}.`)
      setBody('')
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not send that message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">💌 Messages</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Message your crush anonymously — they'll only know it's you if it's mutual.
        </p>
      </section>

      {/* Composer */}
      {!loading && (
        <section className="card p-5">
          {myCrush ? (
            <form onSubmit={handleSend} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted" htmlFor="body">
                  Message <span className="font-mono text-ink">@{myCrush.target_username}</span>
                </label>
                <span className="text-xs text-muted">
                  {body.length}/{BODY_MAX}
                </span>
              </div>
              <textarea
                id="body"
                rows={3}
                maxLength={BODY_MAX}
                placeholder="Say something nice…"
                className="input-field resize-none"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              {error && <p className="text-heart-red text-sm">{error}</p>}
              {success && <p className="text-heart-green text-sm">{success}</p>}
              <button type="submit" disabled={sending || !body.trim()} className="btn-primary">
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted text-center">
              You haven't set a crush yet.{' '}
              <Link to="/dashboard" className="text-heart-purple hover:underline">
                Send a heart first
              </Link>{' '}
              to unlock messaging.
            </p>
          )}
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setTab('received')}
          className={`text-sm px-4 py-2 rounded-xl transition-colors ${
            tab === 'received' ? 'bg-heart-purple text-midnight font-semibold' : 'text-muted hover:text-ink'
          }`}
        >
          Received
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`text-sm px-4 py-2 rounded-xl transition-colors ${
            tab === 'sent' ? 'bg-heart-purple text-midnight font-semibold' : 'text-muted hover:text-ink'
          }`}
        >
          Sent
        </button>
      </div>

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : tab === 'received' ? (
        received.length === 0 ? (
          <div className="card p-8 text-center text-muted text-sm">
            No messages yet. When an admirer messages you, it'll show up here.
          </div>
        ) : (
          <div className="space-y-3">
            {received.map((m) => (
              <article
                key={m.id}
                className={`card p-4 ${m.is_priority ? 'ring-1 ring-heart-yellow/50' : ''}`}
              >
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <span
                    className={`text-sm font-semibold ${
                      m.from_username ? 'text-heart-purple font-mono' : 'text-heart-red'
                    }`}
                  >
                    {m.from_username ? (
                      <>
                        💜{' '}
                        <Link to={`/u/${m.from_username}`} className="hover:underline">
                          @{m.from_username}
                        </Link>
                      </>
                    ) : (
                      '❤️ Anonymous admirer'
                    )}
                  </span>
                  {m.is_priority && (
                    <span className="text-xs font-semibold text-heart-yellow uppercase tracking-wide">
                      ⚔️ Priority
                    </span>
                  )}
                  <span className="text-xs text-muted font-mono whitespace-nowrap ml-auto">
                    {timeAgo(m.created_at)}
                  </span>
                </div>
                <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{m.body}</p>
                <button
                  onClick={() => setReportingId(m.id)}
                  className="text-xs text-muted hover:text-heart-red transition-colors mt-2"
                >
                  🚩 Report
                </button>
              </article>
            ))}
          </div>
        )
      ) : sent.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">
          You haven't sent any messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sent.map((m) => (
            <article key={m.id} className="card p-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-mono text-muted">to @{m.target_username}</span>
                <span className="text-xs text-muted font-mono whitespace-nowrap">
                  {timeAgo(m.created_at)}
                </span>
              </div>
              <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{m.body}</p>
            </article>
          ))}
        </div>
      )}

      {reportingId && (
        <ReportModal
          title="Report this message"
          onSubmit={(reason, details) => reportMessage(reportingId, reason, details)}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  )
}
