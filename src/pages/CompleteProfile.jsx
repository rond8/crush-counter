import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { calculateAge, MINIMUM_AGE } from '../lib/age'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function CompleteProfile() {
  const navigate = useNavigate()
  const { user, profileIncomplete, loading, refreshProfile } = useAuth()

  const [username, setUsername] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState(null)

  // Not logged in at all -> nothing to complete, send to login.
  // Already has a profile -> nothing to do here, send to dashboard.
  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
    } else if (!profileIncomplete) {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, user, profileIncomplete, navigate])

  const checkAvailability = useCallback(async (candidate) => {
    if (!USERNAME_RE.test(candidate)) {
      setAvailable(null)
      return
    }
    setChecking(true)
    try {
      const { data, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', candidate)
        .maybeSingle()
      if (checkError) throw checkError
      setAvailable(!data)
    } catch {
      setAvailable(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const clean = username.trim().toLowerCase()
    if (!clean) {
      setAvailable(null)
      return
    }
    const timer = setTimeout(() => checkAvailability(clean), 400)
    return () => clearTimeout(timer)
  }, [username, checkAvailability])

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
      const { error: insertError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: cleanUsername,
          display_name: cleanUsername,
          age,
        },
        { onConflict: 'id' }
      )

      if (insertError) {
        if (insertError.code === '23505' || insertError.message?.toLowerCase().includes('duplicate')) {
          setError('That username is already taken.')
        } else {
          setError(insertError.message || 'Could not save your profile.')
        }
        return
      }

      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not save your profile.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm card p-8">
        <div className="text-center mb-8">
          <span className="text-4xl">👋</span>
          <h1 className="font-display text-3xl mt-4">One last step</h1>
          <p className="text-muted text-sm mt-2">
            Choose your username and confirm your age to finish creating your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="username">
              Choose username
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
            {username.trim() && USERNAME_RE.test(username.trim().toLowerCase()) && (
              <p className={`text-xs mt-1 ${available === false ? 'text-heart-red' : available ? 'text-heart-green' : 'text-muted'}`}>
                {checking
                  ? 'Checking availability…'
                  : available === false
                  ? `@${username.trim().toLowerCase()} is already taken`
                  : available
                  ? `@${username.trim().toLowerCase()} is available`
                  : ''}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="birthdate">
              Date of birth
            </label>
            <input
              id="birthdate"
              type="date"
              required
              className="input-field"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
            <p className="text-xs text-muted mt-1">You must be 18 or older to use Crush Counter.</p>
          </div>

          {error && <p className="text-heart-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting || available === false}
            className="btn-primary w-full"
          >
            {submitting ? 'Saving…' : 'Complete profile 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}