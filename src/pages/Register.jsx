import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { calculateAge, MINIMUM_AGE } from '../lib/age'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmationNeeded, setConfirmationNeeded] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanUsername = username.trim().toLowerCase()
    if (!USERNAME_RE.test(cleanUsername)) {
      setError('Username must be 3-20 characters: lowercase letters, numbers, underscores.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
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
      const data = await signUp({ email, password, username: cleanUsername, age })
      if (!data.session) {
        // Email confirmation is enabled on the Supabase project.
        setConfirmationNeeded(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes('duplicate') || err.code === '23505') {
        setError('That username is already taken.')
      } else {
        setError(err.message || 'Could not create account.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmationNeeded) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center card p-8">
          <span className="text-4xl">💌</span>
          <h1 className="font-display text-2xl mt-4">Check your inbox</h1>
          <p className="text-muted text-sm mt-2">
            We sent a confirmation link to <span className="text-ink">{email}</span>. Confirm your
            email, then sign in.
          </p>
          <Link to="/login" className="btn-primary w-full mt-6 inline-flex">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl">Join Crush Counter</h1>
          <p className="text-muted text-sm mt-2">Anonymous hearts. No spoilers unless it’s mutual.</p>
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
            />
            <p className="text-xs text-muted mt-1">This is what people use to send you a heart.</p>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-heart-purple hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
