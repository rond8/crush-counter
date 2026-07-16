import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { timeAgo } from '../lib/time'
import { postAnnouncement, sendPersonalNotification } from '../lib/notifications'
import UsernameSearchInput from '../components/UsernameSearchInput'

export default function Announcements() {
  const { profile } = useAuth()
  const isAdmin = Boolean(profile?.is_admin)

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  const [dmTarget, setDmTarget] = useState('')
  const [dmTitle, setDmTitle] = useState('')
  const [dmBody, setDmBody] = useState('')
  const [dmSending, setDmSending] = useState(false)
  const [dmError, setDmError] = useState('')
  const [dmSuccess, setDmSuccess] = useState('')

  const load = useCallback(async () => {
    setLoadError('')
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
    if (error) setLoadError(error.message)
    else setAnnouncements(data ?? [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const handlePost = async (e) => {
    e.preventDefault()
    setPostError('')
    if (!title.trim() || !body.trim()) return

    setPosting(true)
    try {
      await postAnnouncement(title, body)
      setTitle('')
      setBody('')
      await load()
    } catch (err) {
      setPostError(err.message || 'Could not post announcement.')
    } finally {
      setPosting(false)
    }
  }

  const handleSendDm = async (e) => {
    e.preventDefault()
    setDmError('')
    setDmSuccess('')
    if (!dmTarget.trim() || !dmTitle.trim()) return

    setDmSending(true)
    try {
      await sendPersonalNotification(dmTarget, dmTitle, dmBody)
      setDmSuccess(`Notification sent to @${dmTarget.trim().toLowerCase()}.`)
      setDmTarget('')
      setDmTitle('')
      setDmBody('')
    } catch (err) {
      setDmError(err.message || 'Could not send that notification.')
    } finally {
      setDmSending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">📣 Announcements</h1>
        <p className="text-muted text-sm">Updates from the Crush Counter team.</p>
      </section>

      {isAdmin && (
        <>
          <form onSubmit={handlePost} className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Post a new announcement
            </h2>
            <input
              type="text"
              placeholder="Title"
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="What's new? Use @username to notify someone directly."
              rows={4}
              className="input-field resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {postError && <p className="text-heart-red text-sm">{postError}</p>}
            <button
              type="submit"
              disabled={posting || !title.trim() || !body.trim()}
              className="btn-primary"
            >
              {posting ? 'Posting…' : 'Post announcement'}
            </button>
          </form>

          <form onSubmit={handleSendDm} className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Send a personal notification
            </h2>
            <UsernameSearchInput value={dmTarget} onChange={setDmTarget} />
            <input
              type="text"
              placeholder="Title"
              className="input-field"
              value={dmTitle}
              onChange={(e) => setDmTitle(e.target.value)}
            />
            <textarea
              placeholder="Message (optional)"
              rows={3}
              className="input-field resize-none"
              value={dmBody}
              onChange={(e) => setDmBody(e.target.value)}
            />
            {dmError && <p className="text-heart-red text-sm">{dmError}</p>}
            {dmSuccess && <p className="text-heart-green text-sm">{dmSuccess}</p>}
            <button
              type="submit"
              disabled={dmSending || !dmTarget.trim() || !dmTitle.trim()}
              className="btn-primary"
            >
              {dmSending ? 'Sending…' : 'Send notification'}
            </button>
          </form>
        </>
      )}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : loadError ? (
        <p className="text-heart-red text-sm text-center">{loadError}</p>
      ) : announcements.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">No announcements yet.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <article key={a.id} className="card p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-lg">{a.title}</h3>
                <span className="text-xs text-muted font-mono whitespace-nowrap">
                  {timeAgo(a.created_at)}
                </span>
              </div>
              <p className="text-sm text-muted mt-2 whitespace-pre-wrap">{a.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
