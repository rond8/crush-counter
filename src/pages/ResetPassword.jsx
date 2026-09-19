import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    try {
      const { error } = await supabase.rpc('update_password', { p_new_password: password })
      if (error) throw error
      setMessage('Your password has been updated. Redirecting to sign in...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Unable to update your password. Please request a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm card p-8 text-center border-midnight-border shadow-xl">
        <h1 className="font-display text-3xl font-black text-ink italic">Choose a new password</h1>
        <p className="text-muted text-sm mt-2 mb-6">Make it something only you know.</p>

        {error && (
          <div className="p-3 mb-4 bg-heart-red/10 border border-heart-red/20 rounded-xl text-heart-red text-xs font-bold">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 mb-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 text-xs font-bold">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full input-field !py-2.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">Confirm Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full input-field !py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || Boolean(message)}
            className="btn-primary w-full py-3.5 font-black uppercase tracking-widest text-xs shadow-glow-purple"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <Link to="/login" className="inline-block mt-6 text-xs font-bold text-heart-purple hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
