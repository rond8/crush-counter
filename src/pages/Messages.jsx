import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyCrush } from '../lib/crush'
import {
  sendMessage,
  getMyMessages,
  getMySentMessages,
  markThreadRead,
  uploadMessagePhoto,
  replyToAdmirer,
  deleteMessage,
} from '../lib/messages'
import { getProfileByUsername } from '../lib/profile'
import { reportMessage } from '../lib/reports'
import { timeAgo } from '../lib/time'
import { useAuth } from '../context/AuthContext'
import { handleImageError } from '../lib/utils'
import ReportModal from '../components/ReportModal'
import ConfirmModal from '../components/ConfirmModal'
import UsernameSearchInput from '../components/UsernameSearchInput'
import ImageModal from '../components/ImageModal'

const BODY_MAX = 500

function buildConversations(received, sent, myCrush, pinnedUsernames) {
  const map = new Map()

  const touch = (key, meta) => {
    if (!map.has(key)) map.set(key, { key, messages: [], unread: 0, ...meta })
    return map.get(key)
  }

  received.forEach((m) => {
    const isAnon = !m.from_username
    const key = isAnon ? `a:${m.admirer_label}` : `u:${m.from_username}`
    const convo = touch(key, {
      isAnon,
      username: isAnon ? null : m.from_username,
      label: isAnon ? m.admirer_label : `@${m.from_username}`,
    })
    convo.messages.push({ ...m, direction: 'in' })
    if (!m.is_read) convo.unread += 1
  })

  sent.forEach((m) => {
    const isAnon = !m.to_username
    const key = isAnon ? `a:${m.admirer_label}` : `u:${m.to_username}`
    const convo = touch(key, {
      isAnon,
      username: isAnon ? null : m.to_username,
      label: isAnon ? m.admirer_label : `@${m.to_username}`,
    })
    convo.messages.push({ ...m, direction: 'out' })
  })

  if (myCrush?.target_username) {
    touch(`u:${myCrush.target_username}`, {
      isAnon: false,
      username: myCrush.target_username,
      label: `@${myCrush.target_username}`,
    })
  }

  pinnedUsernames.forEach((username) => {
    touch(`u:${username}`, { isAnon: false, username, label: `@${username}` })
  })

  const list = Array.from(map.values()).map((c) => {
    c.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    c.lastMessage = c.messages[c.messages.length - 1] || null
    return c
  })

  list.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0
    const bt = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0
    return bt - at
  })

  return list
}

export default function Messages() {
  const { user, profile, refreshUnreadCount } = useAuth() || {}

  const [myCrush, setMyCrush] = useState(null)
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeKey, setActiveKey] = useState(null)
  const [pinnedUsernames, setPinnedUsernames] = useState([])

  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTarget, setComposeTarget] = useState('')
  const [composeError, setComposeError] = useState('')
  const [composeChecking, setComposeChecking] = useState(false)

  const [body, setBody] = useState('')
  const [quoted, setQuoted] = useState(null)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const [pendingImageUrl, setPendingImageUrl] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [error, setError] = useState('')
  const [reportingId, setReportingId] = useState(null)

  const [viewingImage, setViewImage] = useState(null)

  const refresh = useCallback(async () => {
    const [crush, receivedMsgs, sentMsgs] = await Promise.all([
      getMyCrush().catch(() => null),
      getMyMessages().catch(() => []),
      getMySentMessages().catch(() => []),
    ])
    setMyCrush(crush)
    setReceived(receivedMsgs || [])
    setSent(sentMsgs || [])
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const conversations = useMemo(
    () => buildConversations(received, sent, myCrush, pinnedUsernames),
    [received, sent, myCrush, pinnedUsernames]
  )

  const activeConvo = conversations.find((c) => c.key === activeKey) || null
  const allMessagesMap = new Map([...received, ...sent].map((m) => [m.id, m]))

  const openConversation = async (key) => {
    setActiveKey(key)
    setBody('')
    setQuoted(null)
    setPendingImageUrl(null)
    setError('')

    const convo = conversations.find((c) => c.key === key)
    if (!convo || convo.unread === 0) return

    try {
      if (convo.isAnon) {
        await markThreadRead({ admirerLabel: convo.label })
      } else {
        await markThreadRead({ username: convo.username })
      }
      setReceived((prev) =>
        prev.map((m) => {
          const isAnon = !m.from_username
          const matches = isAnon ? m.admirer_label === convo.label : m.from_username === convo.username
          return matches ? { ...m, is_read: true } : m
        })
      )
      refreshUnreadCount?.()
    } catch {}
  }

  const handleStartChat = async (e) => {
    e.preventDefault()
    setComposeError('')
    const clean = composeTarget.trim().toLowerCase()
    if (!clean) return
    if (clean === profile?.username) {
      setComposeError("You can't message yourself.")
      return
    }

    setComposeChecking(true)
    try {
      const target = await getProfileByUsername(clean)
      if (!target) {
        setComposeError('That username does not exist.')
        return
      }
      setPinnedUsernames((prev) => (prev.includes(clean) ? prev : [...prev, clean]))
      setComposeOpen(false)
      setComposeTarget('')
      openConversation(`u:${clean}`)
    } catch (err) {
      setComposeError(err.message || 'Could not start that chat.')
    } finally {
      setComposeChecking(false)
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    setUploadingPhoto(true)
    try {
      const url = await uploadMessagePhoto(user.id, file)
      setPendingImageUrl(url)
    } catch (err) {
      setError('Could not upload photo.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if ((!body.trim() && !pendingImageUrl) || !activeConvo) return
    setSending(true)
    try {
      if (activeConvo.isAnon) {
        await replyToAdmirer(activeConvo.label, body, pendingImageUrl)
      } else {
        await sendMessage(body, activeConvo.username, quoted?.id || null, pendingImageUrl)
      }
      setBody('')
      setQuoted(null)
      setPendingImageUrl(null)
      await refresh()
    } catch (err) {
      setError('Could not send message.')
    } finally {
      setSending(false)
    }
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)
    try {
      const wasSent = sent.some((m) => m.id === confirmDeleteId)
      await deleteMessage(confirmDeleteId, wasSent)
      if (wasSent) setSent((prev) => prev.filter((m) => m.id !== confirmDeleteId))
      else setReceived((prev) => prev.filter((m) => m.id !== confirmDeleteId))
      setConfirmDeleteId(null)
    } catch (err) {
      setError('Failed to delete message.')
    } finally {
      setDeletingId(null)
    }
  }

  // --- Inbox View ---
  if (!activeKey) {
    return (
      <div className="flex-1 flex flex-col bg-midnight h-full overflow-hidden">
        <header className="p-4 flex items-center justify-between border-b border-midnight-border bg-midnight-surface/80 backdrop-blur-xl">
           <h1 className="text-2xl font-display font-bold text-ink">Chats</h1>
           <button
             onClick={() => setComposeOpen(true)}
             className="w-10 h-10 rounded-full bg-midnight-border flex items-center justify-center text-ink hover:bg-heart-purple hover:text-white transition-all"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
             </svg>
           </button>
        </header>

        {composeOpen && (
          <div className="p-4 bg-midnight-surface border-b border-midnight-border space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">New Conversation</span>
              <button onClick={() => setComposeOpen(false)} className="text-muted hover:text-ink text-xl">×</button>
            </div>
            <form onSubmit={handleStartChat} className="space-y-3">
              <UsernameSearchInput value={composeTarget} onChange={setComposeTarget} excludeUsername={profile?.username} autoFocus />
              {composeError && <p className="text-heart-red text-[10px] font-bold">{composeError}</p>}
              <button type="submit" disabled={composeChecking || !composeTarget.trim()} className="btn-primary w-full !py-2 text-xs">
                {composeChecking ? 'Searching...' : 'Start Chatting'}
              </button>
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-20 bg-midnight-surface rounded-2xl animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
               <div className="text-5xl opacity-20">💬</div>
               <p className="text-muted text-sm max-w-[200px]">No chats yet. Start a new one or send a heart to someone!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <button
                  key={c.key}
                  onClick={() => openConversation(c.key)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                    c.unread > 0 ? 'bg-heart-purple/5' : 'hover:bg-midnight-surface'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`avatar-container w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                      c.isAnon ? 'bg-heart-red/10 border-heart-red/20 text-heart-red' : 'bg-heart-purple/10 border-heart-purple/20 text-heart-purple'
                    }`}>
                      {c.isAnon ? (
                        '❤️'
                      ) : c.messages.some(m => !m.is_mine && m.author_avatar_url) ? (
                        /* If we have an avatar URL from a message, try to show it */
                        <>
                           <img
                            src={c.messages.find(m => !m.is_mine && m.author_avatar_url).author_avatar_url}
                            className="w-full h-full rounded-full object-cover"
                            onError={handleImageError}
                           />
                           <div className="avatar-fallback hidden w-full h-full rounded-full items-center justify-center">
                              {c.username[0].toUpperCase()}
                           </div>
                        </>
                      ) : (
                        c.username[0].toUpperCase()
                      )}
                    </div>
                    {c.unread > 0 && (
                      <div className="absolute top-0 right-0 w-4 h-4 bg-heart-purple border-2 border-midnight rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-sm truncate ${c.unread > 0 ? 'font-black text-ink' : 'font-bold text-ink/80'}`}>{c.label}</span>
                      <span className="text-[10px] text-muted font-medium shrink-0 ml-2">{c.lastMessage ? timeAgo(c.lastMessage.created_at) : ''}</span>
                    </div>
                    <p className={`text-xs truncate ${c.unread > 0 ? 'font-bold text-ink' : 'text-muted'}`}>
                      {c.lastMessage
                        ? (c.lastMessage.direction === 'out' ? 'You: ' : '') + (c.lastMessage.image_url && !c.lastMessage.body ? 'Sent a photo' : c.lastMessage.body)
                        : 'Say hi! 👋'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Thread View (Messenger Style) ---
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-midnight lg:static lg:h-[calc(100vh-2rem)]">
      <header className="shrink-0 z-20 bg-midnight-surface/80 backdrop-blur-xl border-b border-midnight-border px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setActiveKey(null)} className="p-2 -ml-2 text-muted hover:text-ink">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              activeConvo.isAnon ? 'bg-heart-red/20 text-heart-red' : 'bg-heart-purple/20 text-heart-purple'
            }`}>
              {activeConvo.isAnon ? '❤️' : activeConvo.username[0].toUpperCase()}
            </div>
            <div className="min-w-0">
               <h1 className="text-sm font-bold text-ink truncate leading-none mb-1">{activeConvo.label}</h1>
               <p className="text-[10px] text-muted font-medium">{activeConvo.isAnon ? 'Anonymous Sender' : 'Online'}</p>
            </div>
          </div>
        </div>
        {!activeConvo.isAnon && (
          <Link to={`/u/${activeConvo.username}`} className="text-[10px] font-bold text-heart-purple hover:underline bg-heart-purple/10 px-2 py-1 rounded-lg">Profile</Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {activeConvo.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 py-10 italic text-sm">No messages here yet.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {activeConvo.messages.map((m, idx) => {
              const isMine = m.direction === 'out';
              const parentMsg = m.parent_id ? allMessagesMap.get(m.parent_id) : null;

              return (
                <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`group relative max-w-[85%] px-4 py-2.5 shadow-sm transition-all
                    ${isMine ? 'bg-heart-purple text-white rounded-2xl rounded-tr-none' : 'bg-midnight-surface text-ink border border-midnight-border rounded-2xl rounded-tl-none'}
                  `}>
                    {parentMsg && (
                      <div className="mb-2 p-2 bg-black/10 rounded-lg text-[10px] border-l-2 border-white/20 italic line-clamp-2">
                        {parentMsg.body}
                      </div>
                    )}
                    {m.image_url && (
                      <img
                        src={m.image_url}
                        className="rounded-xl mb-2 max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setViewImage(m.image_url)}
                      />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>

                    {/* Action bar on hover/click */}
                    <div className={`absolute bottom-0 flex gap-2 p-1 translate-y-full opacity-0 group-hover:opacity-100 transition-all z-10 ${isMine ? 'right-0' : 'left-0'}`}>
                       <button onClick={() => setQuoted(m)} className="text-[9px] bg-midnight-surface border border-midnight-border rounded px-1.5 py-0.5 text-muted hover:text-heart-purple">Reply</button>
                       <button onClick={() => setConfirmDeleteId(m.id)} className="text-[9px] bg-midnight-surface border border-midnight-border rounded px-1.5 py-0.5 text-muted hover:text-heart-red">Delete</button>
                    </div>
                  </div>
                  <span className="text-[9px] text-muted/60 mt-1 px-1">{timeAgo(m.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 bg-midnight-surface/90 backdrop-blur-xl border-t border-midnight-border pb-with-banner safe-area-bottom">
        {quoted && (
          <div className="mb-2 p-2 bg-heart-purple/10 border-l-2 border-heart-purple rounded flex justify-between items-center text-[10px]">
            <span className="text-muted italic truncate">Replying: {quoted.body}</span>
            <button onClick={() => setQuoted(null)} className="text-heart-purple font-bold px-2">×</button>
          </div>
        )}
        {pendingImageUrl && (
          <div className="mb-2 relative inline-block">
             <img src={pendingImageUrl} className="h-16 w-16 rounded-xl object-cover" />
             <button onClick={() => setPendingImageUrl(null)} className="absolute -top-1 -right-1 bg-black rounded-full text-white w-4 h-4 text-[10px]">×</button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <label className="p-2.5 text-muted hover:text-heart-purple cursor-pointer transition-colors shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={uploadingPhoto || sending} />
          </label>
          <div className="flex-1 bg-midnight border border-midnight-border rounded-2xl px-4 py-1.5 flex items-end">
             <textarea
               rows={1}
               placeholder="Message..."
               className="flex-1 bg-transparent text-sm py-2 focus:outline-none resize-none max-h-32"
               value={body}
               onChange={(e) => { setBody(e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
             />
          </div>
          <button type="submit" disabled={sending || (!body.trim() && !pendingImageUrl)} className="w-12 h-12 bg-heart-purple text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ transform: 'rotate(90deg) translateY(1px)' }}><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
      </div>

      <ConfirmModal isOpen={Boolean(confirmDeleteId)} title="Delete?" message="Remove this message?" loading={Boolean(deletingId)} onConfirm={confirmDelete} onClose={() => setConfirmDeleteId(null)} />
      {reportingId && <ReportModal title="Report" onSubmit={(r, d) => reportMessage(reportingId, r, d)} onClose={() => setReportingId(null)} />}

      {viewingImage && (
        <ImageModal src={viewingImage} onClose={() => setViewImage(null)} />
      )}
    </div>
  )
}
