import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await signIn({ email, password })
      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError(err?.message || err?.error_description || String(err))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Capacitor.isNativePlatform()
          ? 'com.rdosio.crushcounter://reset-password'
          : `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setMessage('Check your email for a password reset link.')
    } catch (err) {
      console.error('Reset error:', err)
      setError(err?.message || err?.error_description || String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Capacitor.isNativePlatform()
            ? 'com.rdosio.crushcounter://login-callback'
            : `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
    } catch (err) {
      console.error('Google Sign-In error:', err)
      setError(err?.message || 'Failed to initialize Google Sign-In.')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm card p-8 text-center border-midnight-border shadow-xl">
        <div className="mb-6">
          <div className="w-16 h-16 bg-heart-purple/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <img src="/images/hearts/purple.png" alt="logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="font-display text-3xl font-black text-ink italic">Welcome back</h1>
          <p className="text-muted text-sm mt-2">Sign in to see who’s thinking of you.</p>
        </div>

        {!!error && (
          <div className="p-3 mb-4 bg-heart-red/10 border border-heart-red/20 rounded-xl text-heart-red text-xs font-bold">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 mb-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 text-xs font-bold">
            {message}
          </div>
        )}

        {forgotPassword ? (
          <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
            <p className="text-sm text-muted">Enter your email and we’ll send you a link to choose a new password.</p>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full input-field !py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 font-black uppercase tracking-widest text-xs shadow-glow-purple"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => { setForgotPassword(false); setError(''); setMessage('') }}
              className="w-full text-xs font-bold text-muted hover:text-ink"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full input-field !py-2.5 text-sm"
            />
          </div>

          <div className="text-right -mt-2">
            <button
              type="button"
              onClick={() => { setForgotPassword(true); setError(''); setMessage('') }}
              className="text-xs font-bold text-heart-purple hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full input-field !py-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 font-black uppercase tracking-widest text-xs shadow-glow-purple"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          </form>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-midnight-border/50"></div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">or</span>
          <div className="h-[1px] flex-1 bg-midnight-border/50"></div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-sm font-bold">Continue with Google</span>
        </button>

        <p className="text-center text-xs text-muted mt-8 font-medium">
          New here?{' '}
          <Link to="/register" className="text-heart-purple font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
