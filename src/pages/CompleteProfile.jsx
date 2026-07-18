import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { calculateAge, MINIMUM_AGE } from '../lib/age'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function CompleteProfile() {
  const { completeOAuthProfile } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanUsername = username.trim().toLowerCase()
    if (!USERNAME_RE.test(cleanUsername)) {
      setError('Username must be 3-20 characters: lowercase letters, numbers, underscores.')
      return
    }

    if (!birthdate) {
      setError('Please enter your date of birth.')
      return
    }
    const age = calculateAge(birthdate)
    if (age === null) {
      setError('Please enter a valid date of birth.')
      return
    }
    if (age < MINIMUM_AGE) {
      setError(`You must be at least ${MINIMUM_AGE} years old to use Crush Counter.`)
      return
    }
    if (age > 120) {
      setError('Please enter a valid date of birth.')
      return
    }

    setSubmitting(true)
    try {
      await completeOAuthProfile({ username: cleanUsername, age })
      navigate('/dashboard')
    } catch (err) {
      if (err.message?.toLowerCase().includes('duplicate') || err.code === '23505') {
        setError('That username is already taken.')
      } else {
        setError(err.message || 'Could not finish setting up your account.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">👋</p>
          <h1 className="font-display text-3xl">One last step</h1>
          <p className="text-muted text-sm mt-2">
            Pick a username — this is what people use to send you a heart.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              placeholder="e.g. sunflower_22"
              className="input-field font-mono"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="birthdate">
              Date of birth
            </label>
            <input
              id="birthdate"
              type="date"
              required
              autoComplete="bday"
              className="input-field"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
            <p className="text-xs text-muted mt-1">You must be 18 or older to use Crush Counter.</p>
          </div>

          {error && <p className="text-heart-red text-sm">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Finishing up…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
