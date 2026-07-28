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
  getThoughtComments,
  addThoughtComment,
  deleteThoughtComment,
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

  const [showAdminTopicPanel, setShowAdminTopicPanel] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [postingTopic, setPostingTopic] = useState(false)
  const [topicError, setTopicError] = useState('')

  const [likingId, setLikingId] = useState(null)
  const [likeError, setLikeError] = useState('')

  // Comments State
  const [expandedThoughtId, setExpandedThoughtId] = useState(null)
  const [commentsMap, setCommentsMap] = useState({}) // { [thoughtId]: [...] }
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [commentError, setCommentError] = useState('')

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
      setShowAdminTopicPanel(false)
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

  // Toggle comments and fetch if not loaded
  const toggleComments = async (thoughtId) => {
    if (expandedThoughtId === thoughtId) {
      setExpandedThoughtId(null)
      return
    }

    setExpandedThoughtId(thoughtId)
    setCommentError('')
    setCommentInput('')

    if (!commentsMap[thoughtId]) {
      setLoadingComments(true)
      try {
        const comments = await getThoughtComments(thoughtId)
        setCommentsMap((prev) => ({ ...prev, [thoughtId]: comments }))
      } catch (err) {
        setCommentError(err.message || 'Could not load comments.')
      } finally {
        setLoadingComments(false)
      }
    }
  }

  const handleAddComment = async (e, thoughtId) => {
    e.preventDefault()
    if (!session) return navigate('/login')
    if (!commentInput.trim()) return

    setPostingComment(true)
    setCommentError('')

    try {
      await addThoughtComment(thoughtId, commentInput)
      setCommentInput('')
      const updatedComments = await getThoughtComments(thoughtId)
      setCommentsMap((prev) => ({ ...prev, [thoughtId]: updatedComments }))
    } catch (err) {
      setCommentError(err.message || 'Could not post comment.')
    } finally {
      setPostingComment(false)
    }
  }

  const handleDeleteComment = async (thoughtId, commentId) => {
    try {
      await deleteThoughtComment(commentId)
      const updatedComments = await getThoughtComments(thoughtId)
      setCommentsMap((prev) => ({ ...prev, [thoughtId]: updatedComments }))
    } catch (err) {
      setCommentError(err.message || 'Could not delete comment.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <section className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-heart-purple/10 text-heart-purple border border-heart-purple/20">
          💭 Daily Community Feed
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Daily Thoughts
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          A new question every day. Share your take or discover what others are thinking.
        </p>
      </section>

      {/* Admin Quick Action */}
      {isAdmin && (
        <div className="card border border-amber-500/30 bg-amber-500/[0.02] p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Admin Controls
            </span>
            <button
              type="button"
              onClick={() => setShowAdminTopicPanel(!showAdminTopicPanel)}
              className="text-xs text-muted hover:text-ink font-semibold underline underline-offset-2"
            >
              {showAdminTopicPanel ? 'Close Panel' : "Set Today's Topic"}
            </button>
          </div>

          {showAdminTopicPanel && (
            <form onSubmit={handlePostTopic} className="space-y-3 pt-2 border-t border-white/5">
              <input
                type="text"
                placeholder="e.g. What's a small thing that made you smile today?"
                className="input-field text-sm"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
              />
              {topicError && <p className="text-heart-red text-xs">{topicError}</p>}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={postingTopic || !topicInput.trim()}
                  className="btn-primary !px-4 !py-1.5 text-xs font-semibold"
                >
                  {postingTopic ? 'Posting…' : 'Publish New Topic'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading ? (
        /* Loading Skeletons */
        <div className="space-y-6">
          <div className="card p-6 h-28 animate-pulse bg-white/5 rounded-2xl" />
          <div className="card p-5 h-20 animate-pulse bg-white/5 rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 h-24 animate-pulse bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Today's Topic Banner */}
          {topic ? (
            <section className="card p-6 sm:p-8 text-center border border-heart-purple/30 bg-gradient-to-b from-heart-purple/10 to-transparent shadow-lg rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-heart-purple bg-heart-purple/10 border border-heart-purple/20 px-2.5 py-0.5 rounded-full">
                Today's Prompt
              </span>
              <h2 className="font-display text-xl sm:text-2xl text-ink font-semibold pt-1">
                "{topic.topic}"
              </h2>
            </section>
          ) : (
            <section className="card p-6 text-center text-muted text-sm border border-white/5 rounded-2xl">
              No daily topic has been set yet. Check back soon!
            </section>
          )}

          {error && <p className="text-heart-red text-sm text-center font-medium">{error}</p>}

          {/* User's Own Thought Section */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted px-1">
              Your Contribution
            </h2>

            {editing ? (
              <form onSubmit={handleSave} className="card p-5 border border-heart-purple/40 bg-white/[0.03] rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Share your perspective</span>
                  <span className={body.length > BODY_MAX * 0.9 ? 'text-amber-400 font-bold' : ''}>
                    {body.length} / {BODY_MAX}
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={BODY_MAX}
                  placeholder="Write your thought here..."
                  className="input-field resize-none text-sm p-3 bg-black/20 focus:bg-black/40"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  autoFocus
                />
                {saveError && <p className="text-heart-red text-xs">{saveError}</p>}
                
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving || !body.trim()}
                    className="btn-primary !px-4 !py-1.5 text-xs font-semibold"
                  >
                    {saving ? 'Saving…' : 'Publish Thought'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                  >
                    Cancel
                  </button>

                  {myThought && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={saving}
                      className="btn-ghost !px-3 !py-1.5 text-xs !text-heart-red hover:bg-heart-red/10 ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            ) : myThought ? (
              <div className="card p-4 border border-white/10 bg-white/[0.02] rounded-2xl flex items-start gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{myThought.body}</p>
                  <p className="text-[11px] text-muted">{timeAgo(myThought.updated_at)}</p>
                </div>
                <button
                  onClick={startEditing}
                  className="btn-ghost px-3 py-1.5 text-xs font-medium border border-white/10 hover:bg-white/5 shrink-0"
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                onClick={startEditing}
                className="card p-5 w-full text-center text-muted text-sm border border-dashed border-white/15 hover:border-heart-purple/50 hover:bg-white/[0.02] transition-all rounded-2xl group"
              >
                <span className="group-hover:text-ink transition-colors">
                  {session
                    ? "✨ You haven't answered today's topic yet — tap to share your thought."
                    : 'Sign in to share a thought.'}
                </span>
              </button>
            )}
          </section>

          {/* Community Feed */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted px-1">
              Community Responses ({feed.length})
            </h2>

            {likeError && <p className="text-heart-red text-xs px-1">{likeError}</p>}

            {feed.length === 0 ? (
              <div className="card p-8 text-center text-muted text-sm border border-white/5 rounded-2xl">
                No thoughts shared yet — be the first to start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((t) => {
                  const isExpanded = expandedThoughtId === t.id
                  const comments = commentsMap[t.id] || []

                  return (
                    <div
                      key={t.id}
                      className="card p-4.5 border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl hover:border-white/10 transition-colors space-y-3"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* User Avatar */}
                        {t.author_avatar_url ? (
                          <img
                            src={t.author_avatar_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10 shrink-0"
                          />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-heart-purple/20 text-heart-purple border border-heart-purple/30 flex items-center justify-center text-xs font-bold shrink-0">
                            {t.author_username[0]?.toUpperCase()}
                          </span>
                        )}

                        {/* Content Details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              to={`/u/${t.author_username}`}
                              className="font-mono text-xs font-semibold text-ink hover:text-heart-purple transition-colors truncate"
                            >
                              @{t.author_username}
                            </Link>
                            <span className="text-[11px] text-muted font-mono shrink-0">
                              {timeAgo(t.updated_at)}
                            </span>
                          </div>

                          <p className="text-sm text-ink/90 whitespace-pre-wrap leading-relaxed">
                            {t.body}
                          </p>

                          {/* Action Bar */}
                          <div className="flex items-center gap-2 pt-1">
                            {!t.is_mine && (
                              <button
                                onClick={() => handleLike(t.id)}
                                disabled={t.liked_by_me || likingId === t.id}
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                                  t.liked_by_me
                                    ? 'bg-heart-red/10 border-heart-red/30 text-heart-red'
                                    : 'bg-white/5 border-white/10 text-muted hover:text-heart-red hover:border-heart-red/30 hover:bg-heart-red/5'
                                }`}
                              >
                                <span>{t.liked_by_me ? '❤️' : '🤍'}</span>
                                <span>
                                  {t.liked_by_me
                                    ? `Liked (${t.like_count})`
                                    : likingId === t.id
                                    ? 'Liking…'
                                    : `Like for 1 🪙 (${t.like_count})`}
                                </span>
                              </button>
                            )}

                            <button
                              onClick={() => toggleComments(t.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border bg-white/5 border-white/10 text-muted hover:text-ink hover:bg-white/10 transition-all"
                            >
                              💬 <span>{isExpanded ? 'Hide Comments' : 'Comments'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Comments Collapsible Section */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-white/5 space-y-3">
                          {/* Existing Comments List */}
                          {loadingComments ? (
                            <p className="text-xs text-muted font-mono pl-2">Loading comments...</p>
                          ) : comments.length === 0 ? (
                            <p className="text-xs text-muted italic pl-2">No comments yet.</p>
                          ) : (
                            <div className="space-y-2 pl-2 border-l border-white/10 ml-4">
                              {comments.map((c) => (
                                <div key={c.id} className="text-xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-ink">@{c.author_username}</span>
                                    <span className="text-[10px] text-muted">{timeAgo(c.created_at)}</span>
                                  </div>
                                  <p className="text-muted/90 leading-normal">{c.body}</p>
                                  {c.is_mine && (
                                    <button
                                      onClick={() => handleDeleteComment(t.id, c.id)}
                                      className="text-[10px] text-heart-red hover:underline"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {commentError && <p className="text-xs text-heart-red">{commentError}</p>}

                          {/* Add Comment Input */}
                          <form onSubmit={(e) => handleAddComment(e, t.id)} className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              className="input-field text-xs py-1.5 px-3 flex-1 bg-black/20"
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                            />
                            <button
                              type="submit"
                              disabled={postingComment || !commentInput.trim()}
                              className="btn-primary !px-3 !py-1 text-xs"
                            >
                              {postingComment ? '...' : 'Reply'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}