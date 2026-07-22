import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getTodaysMysteryWord, guessMysteryWord, submitMysteryWord } from '../lib/mysteryWord'

export default function MysteryWord() {
  const { refreshProfile } = useAuth()

  const [today, setToday] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [guess, setGuess] = useState('')
  const [guessing, setGuessing] = useState(false)
  const [guessFeedback, setGuessFeedback] = useState('')
  const [guessFeedbackType, setGuessFeedbackType] = useState('') // 'success' | 'error'

  const [submitWord, setSubmitWord] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await getTodaysMysteryWord()
      setToday(data)
    } catch (err) {
      setError(err.message || "Could not load today's word.")
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const handleGuess = async (e) => {
    e.preventDefault()
    if (!guess.trim()) return
    setGuessing(true)
    setGuessFeedback('')
    try {
      const result = await guessMysteryWord(guess)
      setGuess('')
      if (result.correct) {
        setGuessFeedbackType('success')
        setGuessFeedback(`🎉 Correct! It was "${result.word}" — +5 🪙 +1 🌟`)
        await Promise.all([refreshProfile(), load()])
      } else {
        setGuessFeedbackType('error')
        setGuessFeedback(
          result.guesses_remaining > 0
            ? `Not quite — ${result.guesses_remaining} guess${result.guesses_remaining === 1 ? '' : 'es'} left.`
            : 'Out of guesses for today — try again tomorrow.'
        )
        await load()
      }
    } catch (err) {
      setGuessFeedbackType('error')
      setGuessFeedback(err.message || 'Could not submit that guess.')
    } finally {
      setGuessing(false)
    }
  }

  const handleSubmitWord = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    if (!submitWord.trim()) return
    setSubmitting(true)
    try {
      await submitMysteryWord(submitWord)
      setSubmitSuccess("Submitted! It'll go live on a future day.")
      setSubmitWord('')
    } catch (err) {
      setSubmitError(err.message || 'Could not submit that word.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">🔮 Mystery Word</h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          Guess today's secret word for coins and fame. One new word a day, submitted by the community.
        </p>
      </section>

      {error && <p className="text-heart-red text-sm text-center">{error}</p>}

      {loading ? (
        <p className="text-muted text-sm font-mono text-center">loading…</p>
      ) : !today || !today.mystery_word_id ? (
        <div className="card p-8 text-center text-muted text-sm">
          No mystery word today — submit one below to queue it up for a future day.
        </div>
      ) : today.is_my_submission ? (
        <div className="card p-8 text-center space-y-2">
          <p className="text-3xl">✍️</p>
          <p className="text-sm text-ink font-semibold">This is your word today!</p>
          <p className="text-sm text-muted">
            You submitted today's mystery word, so you can't guess it yourself — but everyone else can.
          </p>
        </div>
      ) : today.already_solved_by_me ? (
        <div className="card p-8 text-center space-y-2">
          <p className="text-3xl">🎉</p>
          <p className="text-sm text-ink font-semibold">You solved it!</p>
          <p className="font-display text-2xl text-heart-purple">{today.solved_word}</p>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div className="flex justify-center gap-2 flex-wrap" aria-label={`${today.word_length} letters`}>
            {Array.from({ length: today.word_length }).map((_, i) => (
              <span
                key={i}
                className="w-8 h-10 rounded-lg bg-midnight border border-midnight-border flex items-center justify-center text-lg font-display text-muted"
              >
                _
              </span>
            ))}
          </div>
          <form onSubmit={handleGuess} className="flex gap-2">
            <input
              type="text"
              placeholder="Your guess"
              className="input-field flex-1"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              maxLength={30}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={guessing || !guess.trim() || today.guesses_remaining <= 0}
              className="btn-primary !px-5"
            >
              {guessing ? '…' : 'Guess'}
            </button>
          </form>
          <p className="text-xs text-muted text-center">
            {today.guesses_remaining} guess{today.guesses_remaining === 1 ? '' : 'es'} left today
          </p>
          {guessFeedback && (
            <p
              className={`text-sm text-center ${
                guessFeedbackType === 'success' ? 'text-heart-green' : 'text-heart-red'
              }`}
            >
              {guessFeedback}
            </p>
          )}
        </div>
      )}

      <section className="card p-5 space-y-3">
        <h2 className="font-display text-lg">✍️ Submit a mystery word</h2>
        <p className="text-sm text-muted">
          One word, 3–30 letters, no spaces. It'll be queued up for a future day — when it goes live,
          you get <span className="text-ink">+10 🪙</span>.
        </p>
        <form onSubmit={handleSubmitWord} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. sunshine"
            className="input-field flex-1"
            value={submitWord}
            onChange={(e) => setSubmitWord(e.target.value)}
            maxLength={30}
          />
          <button type="submit" disabled={submitting || !submitWord.trim()} className="btn-primary !px-5">
            {submitting ? '…' : 'Submit'}
          </button>
        </form>
        {submitError && <p className="text-heart-red text-sm">{submitError}</p>}
        {submitSuccess && <p className="text-heart-green text-sm">{submitSuccess}</p>}
      </section>
    </div>
  )
}
