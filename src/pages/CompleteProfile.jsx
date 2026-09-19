import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { calculateAge } from '../lib/age'

export default function CompleteProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '')
  const [birthday, setBirthday] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [skipping, setSkipping] = useState(false)

  // If the user already has a profile loaded (e.g. from a partial success),
  // pre-fill the fields so they aren't stuck.
  useEffect(() => {
    if (profile) {
      if (profile.username) setUsername(profile.username)
      if (profile.display_name) setDisplayName(profile.display_name)
      if (profile.birthday) setBirthday(profile.birthday)
    }
  }, [profile])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const cleanUsername = username.trim().toLowerCase()
    const computedAge = calculateAge(birthday)

    if (!cleanUsername) return setError('Username is required.')
    if (!birthday) return setError('Birthday is required.')
    if (computedAge === null || computedAge < 18) return setError('You must be at least 18 years old.')

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return setError('Username must be 3-20 characters: letters, numbers, underscores.')
    }

    setLoading(true)
    setError('')

    try {
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle()

      if (checkError) throw checkError
      if (existing && existing.id !== user.id) {
        throw new Error('That username is already taken. Please try another one.')
      }

      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
          age: computedAge,
          birthday: birthday,
          avatar_url: user?.user_metadata?.avatar_url || profile?.avatar_url || null
        },
        { onConflict: 'id' }
      )

      if (upsertError) {
        if (upsertError.code === '23505') throw new Error('Username is already in use.')
        throw upsertError
      }

      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to save profile.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Generates a temporary profile so the user can enter the app immediately
   * and finish their details later.
   */
  const handleDoLater = async () => {
    setSkipping(true)
    setError('')
    try {
      // Generate a random temp username
      const tempId = Math.random().toString(36).substring(2, 7)
      const tempUsername = `user_${tempId}`

      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          username: tempUsername,
          display_name: user?.user_metadata?.full_name || tempUsername,
          age: 18, // Default minimum age
          avatar_url: user?.user_metadata?.avatar_url || null
        },
        { onConflict: 'id' }
      )

      if (upsertError) throw upsertError

      await refreshProfile()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError('Could not skip at this time. Please fill in the details.')
    } finally {
      setSkipping(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10 bg-midnight">
      <div className="w-full max-w-sm card p-8 text-center border-heart-purple/20 shadow-2xl">
        <div className="mb-6">
          <div className="w-16 h-16 bg-heart-purple/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✨</div>
          <h1 className="font-display text-2xl font-bold text-ink">Welcome to the Club!</h1>
          <p className="text-muted text-xs mt-2">Just a few more details to get you started.</p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-heart-red/10 border border-heart-red/20 rounded-xl text-heart-red text-xs font-bold animate-in shake-in-1">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">Unique Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-mono text-sm">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full input-field pl-8 !py-2.5 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full input-field !py-2.5 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">Birthday</label>
            <input
              type="date"
              required
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full input-field !py-2.5 text-sm"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={loading || skipping}
              className="btn-primary w-full py-3.5 shadow-glow-purple font-black uppercase tracking-widest text-xs"
            >
              {loading ? 'Finalizing...' : 'Start Matching 🚀'}
            </button>

            <button
              type="button"
              onClick={handleDoLater}
              disabled={loading || skipping}
              className="w-full py-2 text-[10px] font-bold text-muted hover:text-ink uppercase tracking-widest transition-colors"
            >
              {skipping ? 'Skipping...' : 'Do it later'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
