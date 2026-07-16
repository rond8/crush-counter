import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getTodaysTopic,
  postDailyTopic,
  getThoughtsFeed,
  setThought,
  deleteMyThought,
  likeThought,
} from '../lib/thoughts'
import { timeAgo } from '../lib/time'

const BODY_MAX = 500

export default function Thoughts() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const isAdmin = Boolean(profile?.is_admin)

  const [topic, setTopic] = useState(null)
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [topicInput, setTopicInput] = useState('')
  const [postingTopic, setPostingTopic] = useState(false)
  const [topicError, setTopicError] = useState('')

  const [likingId, setLikingId] = useState(null)
  const [likeError, setLikeError] = useState('')

  const refresh = useCallback(async () => {
    const [t, f] = await Promise.all([getTodaysTopic(), getThoughtsFeed()])
    setTopic(t)
    setFeed(f)
  }, [])

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message || 'Could not load thoughts.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const myThought = feed.find((t) => t.is_mine)

  const startEditing = () => {
    if (!session) return navigate('/login')
    setBody(myThought?.body ?? '')
    setSaveError('')
    setEditing(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaveError('')
    if (!body.trim()) return
    setSaving(true)
    try {
      await setThought(body)
      setEditing(false)
      await refresh()
    } catch (err) {
      setSaveError(err.message || 'Could not save your thought.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteMyThought()
      setEditing(false)
      setBody('')
      await refresh()
    } catch (err) {
      setSaveError(err.message || 'Could not delete your thought.')
    } finally {
      setSaving(false)
    }
  }

  const handlePostTopic = async (e) => {
    e.preventDefault()
    setTopicError('')
    if (!topicInput.trim()) return
    setPostingTopic(true)
    try {
      await postDailyTopic(topicInput)
      setTopicInput('')
      await refresh()
    } catch (err) {
      setTopicError(err.message || 'Could not post the topic.')
    } finally {
      setPostingTopic(false)
    }
  }

  const handleLike = async (thoughtId) => {
    if (!session) return navigate('/login')
    setLikeError('')
    setLikingId(thoughtId)
    try {
      await likeThought(thoughtId)
      await refresh()
    } catch (err) {
      setLikeError(err.message || 'Could not like that thought.')
    } finally {
      setLikingId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">💭 Thoughts</h1>
        <p className="text-muted text-sm">A new topic every day. Share yours, or like someone else's.</p>
      </section>

      {isAdmin && (
        <form onSubmit={handlePostTopic} className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Set today's topic
          </h2>
          <input
            type="text"
            placeholder="e.g. What's a small thing that made you smile today?"
            className="input-field"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
          />
          {topicError && <p className="text-heart-red text-sm">{topicError}</p>}
          <button type="submit" disabled={postingTopic || !topicInput.trim()} className="btn-primary">
            {postingTopic ? 'Posting…' : 'Post topic'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : (
        <>
          {topic ? (
            <section className="card p-6 text-center ring-1 ring-heart-purple/40">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Today's topic</p>
              <p className="font-display text-lg">{topic.topic}</p>
            </section>
          ) : (
            <section className="card p-6 text-center text-muted text-sm">
              No topic posted yet today — check back soon.
            </section>
          )}

          {error && <p className="text-heart-red text-sm text-center">{error}</p>}

          {/* Your thought */}
          <section>
            <h2 className="font-display text-xl mb-3">Your thought</h2>
            {editing ? (
              <form onSubmit={handleSave} className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Share what's on your mind</span>
                  <span className="text-xs text-muted">
                    {body.length}/{BODY_MAX}
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={BODY_MAX}
                  className="input-field resize-none"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  autoFocus
                />
                {saveError && <p className="text-heart-red text-sm">{saveError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={saving || !body.trim()} className="btn-primary">
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
                    Cancel
                  </button>
                  {myThought && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="btn-ghost !text-heart-red ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            ) : myThought ? (
              <div className="card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink whitespace-pre-wrap">{myThought.body}</p>
                  <p className="text-xs text-muted mt-1">{timeAgo(myThought.updated_at)}</p>
                </div>
                <button onClick={startEditing} className="btn-ghost !px-3 !py-1.5 text-xs whitespace-nowrap">
                  Edit
                </button>
              </div>
            ) : (
              <button onClick={startEditing} className="card p-5 w-full text-center text-muted text-sm hover:ring-1 hover:ring-heart-purple/40 transition-shadow">
                {session ? "You haven't shared a thought yet — tap to add one." : 'Sign in to share a thought.'}
              </button>
            )}
          </section>

          {/* Feed */}
          <section>
            <h2 className="font-display text-xl mb-3">Everyone's thoughts</h2>
            {likeError && <p className="text-heart-red text-sm mb-3">{likeError}</p>}
            {feed.length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm">No thoughts shared yet — be the first.</div>
            ) : (
              <div className="space-y-3">
                {feed.map((t) => (
                  <div key={t.id} className="card p-4 flex items-start gap-3">
                    {t.author_avatar_url ? (
                      <img src={t.author_avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-heart-purple/20 flex items-center justify-center text-xs font-display shrink-0">
                        {t.author_username[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link to={`/u/${t.author_username}`} className="font-mono text-sm text-ink hover:underline">
                          @{t.author_username}
                        </Link>
                        <span className="text-xs text-muted font-mono whitespace-nowrap">{timeAgo(t.updated_at)}</span>
                      </div>
                      <p className="text-sm text-ink mt-1 whitespace-pre-wrap">{t.body}</p>
                      <div className="mt-2">
                        {t.is_mine ? (
                          <span className="text-xs text-muted">This is your thought</span>
                        ) : (
                          <button
                            onClick={() => handleLike(t.id)}
                            disabled={t.liked_by_me || likingId === t.id}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                              t.liked_by_me
                                ? 'border-heart-red/40 text-heart-red'
                                : 'border-midnight-border text-muted hover:text-heart-red hover:border-heart-red/40'
                            }`}
                          >
                            {t.liked_by_me
                              ? `❤️ Liked (${t.like_count})`
                              : likingId === t.id
                              ? 'Liking…'
                              : `🤍 Like for 1 🪙 (${t.like_count})`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
