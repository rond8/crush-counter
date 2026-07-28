import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getMyCrush } from '../lib/crush'
import { sendMessage, getMyMessages, getMySentMessages, deleteMessage, markMessagesAsRead } from '../lib/messages'
import { reportMessage } from '../lib/reports'
import { timeAgo } from '../lib/time'
import { useAuth } from '../context/AuthContext'
import ReportModal from '../components/ReportModal'
import ConfirmModal from '../components/ConfirmModal'

const BODY_MAX = 500

export default function Messages() {
  const { refreshUnreadCount, refreshUnreadMessageCount } = useAuth() || {}

  const [tab, setTab] = useState('received')

  const [myCrush, setMyCrush] = useState(null)
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)

  const [body, setBody] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reportingId, setReportingId] = useState(null)

  const refresh = useCallback(async () => {
    const [crush, receivedMsgs, sentMsgs] = await Promise.all([
      getMyCrush().catch(() => null),
      getMyMessages().catch(() => []),
      getMySentMessages().catch(() => []),
    ])
    setMyCrush(crush)
    setReceived(receivedMsgs || [])
    setSent(sentMsgs || [])

    if (receivedMsgs?.some((m) => !m.is_read)) {
      await markMessagesAsRead().catch(() => {})
      if (typeof refreshUnreadCount === 'function') {
        refreshUnreadCount()
      }
      if (typeof refreshUnreadMessageCount === 'function') {
        refreshUnreadMessageCount()
      }
    }
  }, [refreshUnreadCount, refreshUnreadMessageCount])

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
      let recipient = null

      if (replyingTo) {
        if (replyingTo.from_username) {
          recipient = replyingTo.from_username
        } else {
          // Resolve anonymous sender's ID to their actual username
          const senderId = replyingTo.sender_id || replyingTo.from_user_id
          if (senderId) {
            const { data: prof, error: profErr } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', senderId)
              .single()

            if (!profErr && prof?.username) {
              recipient = prof.username
            }
          }
        }
      } else {
        // Fallback to active crush if not replying to a specific message
        recipient = myCrush?.target_username || null
      }

      if (!recipient) {
        throw new Error('Could not find a valid recipient for this message.')
      }

      const parentId = replyingTo?.id || null

      await sendMessage(body, recipient, parentId)
      setSuccess('Message sent successfully!')
      setBody('')
      setReplyingTo(null)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not send message.')
    } finally {
      setSending(false)
    }
  }

  const promptDelete = (messageId) => {
    setConfirmDeleteId(messageId)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)

    const isSentTab = tab === 'sent'

    try {
      await deleteMessage(confirmDeleteId, isSentTab)

      if (isSentTab) {
        setSent((prev) => prev.filter((m) => m.id !== confirmDeleteId))
      } else {
        setReceived((prev) => prev.filter((m) => m.id !== confirmDeleteId))
      }

      setConfirmDeleteId(null)
    } catch (err) {
      setError(err.message || 'Failed to delete message.')
    } finally {
      setDeletingId(null)
    }
  }

  const anonymousMap = new Map()
  let anonCounter = 1

  received.forEach((m) => {
    if (!m.from_username) {
      const key = m.from_user_id || m.sender_id || m.id
      if (!anonymousMap.has(key)) {
        anonymousMap.set(key, anonCounter++)
      }
    }
  })

  const getAnonymousLabel = (message) => {
    const key = message.from_user_id || message.sender_id || message.id
    const number = anonymousMap.get(key) || 1
    return `Anonymous Admirer #${number}`
  }

  const allMessagesMap = new Map([...received, ...sent].map((m) => [m.id, m]))

  // Determine active target recipient label
  const activeRecipient = replyingTo
    ? replyingTo.from_username
      ? `@${replyingTo.from_username}`
      : getAnonymousLabel(replyingTo)
    : myCrush
    ? `@${myCrush.target_username}`
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <section className="text-center space-y-1">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink flex items-center justify-center gap-2">
          💬 Chat & Notes
        </h1>
        <p className="text-muted text-xs sm:text-sm max-w-md mx-auto">
          Send anonymous secret messages or reply directly in thread style.
        </p>
      </section>

      {/* Sticky Messenger Composer */}
      {!loading && (
        <section className="card p-4 border border-white/10 bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl space-y-3 sticky top-4 z-20">
          {myCrush || replyingTo ? (
            <form onSubmit={handleSend} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">To:</span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {activeRecipient}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted/60">
                  {body.length}/{BODY_MAX}
                </span>
              </div>

              {replyingTo && (
                <div className="flex items-start justify-between gap-2 p-3 bg-purple-950/50 border-l-4 border-purple-500 rounded-r-xl text-xs">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-purple-300 font-semibold truncate leading-snug">
                      Replying to {replyingTo.from_username ? `@${replyingTo.from_username}` : getAnonymousLabel(replyingTo)}:
                    </div>
                    <div className="text-muted/80 truncate italic text-[11px] leading-snug">
                      "{replyingTo.body}"
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-muted/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0 text-sm font-bold leading-none"
                    aria-label="Cancel reply"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="relative">
                <textarea
                  id="body"
                  rows={2}
                  maxLength={BODY_MAX}
                  placeholder={replyingTo ? "Write your reply..." : "Type a secret message..."}
                  className="w-full p-3 text-xs sm:text-sm bg-white/5 border border-white/10 rounded-xl text-ink focus:outline-none focus:border-purple-500 resize-none transition-all pr-12"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              {error && <p className="text-rose-400 text-xs text-center">{error}</p>}
              {success && <p className="text-emerald-400 text-xs text-center">{success}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !body.trim()}
                  className="btn-primary !px-5 !py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg disabled:opacity-50"
                >
                  <span>{sending ? 'Sending...' : 'Send Message 🚀'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 text-center">
              <p className="text-xs text-muted">
                You haven't chosen a crush yet.{' '}
                <Link to="/dashboard" className="text-purple-400 hover:underline font-semibold">
                  Select a crush to start chatting.
                </Link>
              </p>
            </div>
          )}
        </section>
      )}

      {/* Messenger Segment Switcher */}
      <div className="flex justify-center border-b border-white/10 pb-3">
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-full gap-1">
          <button
            onClick={() => setTab('received')}
            className={`text-xs px-5 py-1.5 rounded-full font-semibold transition-all ${
              tab === 'received'
                ? 'bg-purple-600 text-white shadow'
                : 'text-muted hover:text-ink'
            }`}
          >
            Received ({received.length})
          </button>
          <button
            onClick={() => setTab('sent')}
            className={`text-xs px-5 py-1.5 rounded-full font-semibold transition-all ${
              tab === 'sent'
                ? 'bg-purple-600 text-white shadow'
                : 'text-muted hover:text-ink'
            }`}
          >
            Sent ({sent.length})
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 w-3/4 bg-white/5 rounded-2xl" />
          <div className="h-16 w-2/3 bg-white/5 rounded-2xl ml-auto" />
        </div>
      ) : tab === 'received' ? (
        received.length === 0 ? (
          <p className="text-center text-xs text-muted py-8">No received messages yet.</p>
        ) : (
          <div className="space-y-4">
            {received.map((m) => {
              const parentMsg = m.parent_id ? allMessagesMap.get(m.parent_id) : null
              return (
                <div key={m.id} className="flex flex-col items-start max-w-[85%] group space-y-1">
                  <div className="flex items-center gap-2 pl-2">
                    {m.from_username ? (
                      <span className="text-[11px] font-bold text-purple-300 font-mono">
                        💜 @{m.from_username}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-rose-400">
                        ❤️ {getAnonymousLabel(m)}
                      </span>
                    )}
                    <span className="text-[10px] text-muted/60 font-mono">{timeAgo(m.created_at)}</span>
                  </div>

                  <div className="relative bg-slate-800/90 border border-white/10 p-3.5 rounded-2xl rounded-tl-sm text-ink text-xs sm:text-sm space-y-2 shadow-md">
                    {parentMsg && (
                      <div className="p-2 bg-black/30 border-l-2 border-purple-400 rounded text-[11px] text-muted/80 italic">
                        "{parentMsg.body}"
                      </div>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>

                    <div className="flex items-center gap-3 pt-1 border-t border-white/5 text-[11px]">
                      <button
                        onClick={() => {
                          setReplyingTo(m)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                      >
                        ↩ Reply
                      </button>

                      <button
                        onClick={() => promptDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="text-muted hover:text-rose-400 transition-colors"
                      >
                        🗑 Delete
                      </button>

                      <button
                        onClick={() => setReportingId(m.id)}
                        className="text-muted hover:text-amber-400 transition-colors ml-auto"
                      >
                        🚩 Report
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : sent.length === 0 ? (
        <p className="text-center text-xs text-muted py-8">You haven't sent any messages yet.</p>
      ) : (
        <div className="space-y-4 flex flex-col items-end">
          {sent.map((m) => {
            const parentMsg = m.parent_id ? allMessagesMap.get(m.parent_id) : null
            return (
              <div key={m.id} className="flex flex-col items-end max-w-[85%] group space-y-1">
                <div className="flex items-center gap-2 pr-2">
                  <span className="text-[10px] text-muted/60 font-mono">{timeAgo(m.created_at)}</span>
                  <span className="text-[11px] font-semibold text-muted font-mono">
                    To @{m.target_username}
                  </span>
                </div>

                <div className="relative bg-purple-600/80 border border-purple-400/30 p-3.5 rounded-2xl rounded-tr-sm text-white text-xs sm:text-sm space-y-2 shadow-md">
                  {parentMsg && (
                    <div className="p-2 bg-black/20 border-l-2 border-white/50 rounded text-[11px] text-purple-100 italic">
                      "{parentMsg.body}"
                    </div>
                  )}

                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>

                  <div className="flex justify-end pt-1 border-t border-purple-400/20 text-[11px]">
                    <button
                      onClick={() => promptDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="text-purple-200 hover:text-white transition-colors"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        title="Delete Message?"
        message="Are you sure you want to remove this message from your chat? It will remain visible for the other person."
        confirmText="Delete"
        loading={Boolean(deletingId)}
        onConfirm={confirmDelete}
        onClose={() => setConfirmDeleteId(null)}
      />

      {/* Report Modal */}
      {reportingId && (
        <ReportModal
          title="Report message"
          onSubmit={(reason, details) => reportMessage(reportingId, reason, details)}
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  )
}