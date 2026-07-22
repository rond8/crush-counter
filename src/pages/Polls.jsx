import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPollRows, groupPolls, createPoll, closePoll, votePoll } from '../lib/polls'
import { timeAgo } from '../lib/time'

const MAX_OPTIONS = 6
const DEFAULT_COLOR = '#B57BFF'

function emptyOption() {
  return { label: '', imageUrl: '', color: '' }
}

export default function Polls() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const isAdmin = Boolean(profile?.is_admin)

  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState([emptyOption(), emptyOption()])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [votingOptionId, setVotingOptionId] = useState(null)
  const [voteError, setVoteError] = useState('')

  const refresh = useCallback(async () => {
    const rows = await getPollRows()
    setPolls(groupPolls(rows))
  }, [])

  useEffect(() => {
    refresh()
      .catch((err) => setError(err.message || 'Could not load polls.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const updateOption = (i, field, value) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, [field]: value } : o)))
  }

  const addOption = () => {
    if (options.length < MAX_OPTIONS) setOptions((prev) => [...prev, emptyOption()])
  }

  const removeOption = (i) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateError('')
    const validOptions = options
      .map((o) => ({ label: o.label.trim(), imageUrl: o.imageUrl.trim(), color: o.color }))
      .filter((o) => o.label)
    if (!question.trim() || validOptions.length < 2) {
      setCreateError('Add a question and at least 2 options.')
      return
    }
    setCreating(true)
    try {
      await createPoll(question, validOptions)
      setQuestion('')
      setOptions([emptyOption(), emptyOption()])
      await refresh()
    } catch (err) {
      setCreateError(err.message || 'Could not create that poll.')
    } finally {
      setCreating(false)
    }
  }

  const handleVote = async (optionId) => {
    if (!session) return navigate('/login')
    setVoteError('')
    setVotingOptionId(optionId)
    try {
      await votePoll(optionId)
      await refresh()
    } catch (err) {
      setVoteError(err.message || 'Could not cast that vote.')
    } finally {
      setVotingOptionId(null)
    }
  }

  const handleClose = async (pollId) => {
    try {
      await closePoll(pollId)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not close that poll.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🗳️ Polls</h1>
        <p className="text-muted text-sm">One vote per poll — make it count.</p>
      </section>

      {isAdmin && (
        <form onSubmit={handleCreate} className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Create a poll</h2>
          <input
            type="text"
            placeholder="Question"
            className="input-field"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="card p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    className="input-field"
                    value={opt.label}
                    onChange={(e) => updateOption(i, 'label', e.target.value)}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="btn-ghost !px-3 !py-2 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    className="input-field text-xs flex-1"
                    value={opt.imageUrl}
                    onChange={(e) => updateOption(i, 'imageUrl', e.target.value)}
                  />
                  <input
                    type="color"
                    className="w-9 h-9 rounded-lg border border-midnight-border bg-midnight cursor-pointer shrink-0"
                    value={opt.color || DEFAULT_COLOR}
                    onChange={(e) => updateOption(i, 'color', e.target.value)}
                    title="Option color (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
          {options.length < MAX_OPTIONS && (
            <button type="button" onClick={addOption} className="text-xs text-heart-purple hover:underline">
              + Add option
            </button>
          )}
          {createError && <p className="text-heart-red text-sm">{createError}</p>}
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating…' : 'Create poll'}
          </button>
        </form>
      )}

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}
      {voteError && <p className="text-heart-red text-sm text-center">{voteError}</p>}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : polls.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">No polls yet — check back soon.</div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.vote_count, 0)
            const hasVoted = Boolean(poll.my_option_id)
            const isClosed = Boolean(poll.closed_at)
            const showResults = hasVoted || isClosed

            return (
              <article key={poll.id} className="card p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-lg">{poll.question}</h3>
                  <span className="text-xs text-muted font-mono whitespace-nowrap">{timeAgo(poll.created_at)}</span>
                </div>
                {isClosed && <p className="text-xs text-heart-red mt-1">Closed</p>}

                <div className="space-y-2 mt-3">
                  {poll.options.map((opt) => {
                    const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0
                    const isMine = poll.my_option_id === opt.id

                    if (showResults) {
                      const barColor = opt.color || (isMine ? '#B57BFF' : '#3A2650')
                      return (
                        <div
                          key={opt.id}
                          className="relative overflow-hidden rounded-xl border border-midnight-border"
                        >
                          <div
                            className="absolute inset-y-0 left-0 opacity-40"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                          <div className="relative flex items-center gap-3 px-4 py-2.5 text-sm">
                            {opt.image_url && (
                              <img
                                src={opt.image_url}
                                alt=""
                                className="w-8 h-8 rounded-lg object-cover shrink-0"
                              />
                            )}
                            <span className={`flex-1 ${isMine ? 'text-ink font-semibold' : 'text-ink'}`}>
                              {opt.label} {isMine && '✓'}
                            </span>
                            <span className="text-muted whitespace-nowrap">
                              {pct}% ({opt.vote_count})
                            </span>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleVote(opt.id)}
                        disabled={votingOptionId === opt.id}
                        className="w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-xl border border-midnight-border text-sm text-ink hover:border-heart-purple/50 hover:bg-midnight-surface transition-colors"
                        style={opt.color ? { borderLeftColor: opt.color, borderLeftWidth: '4px' } : undefined}
                      >
                        {opt.image_url && (
                          <img src={opt.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        )}
                        <span className="flex-1">{votingOptionId === opt.id ? 'Voting…' : opt.label}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted">
                    {totalVotes} vote{totalVotes === 1 ? '' : 's'}
                  </p>
                  {isAdmin && !isClosed && (
                    <button
                      onClick={() => handleClose(poll.id)}
                      className="text-xs text-muted hover:text-heart-red transition-colors"
                    >
                      Close poll
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}