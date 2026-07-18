import { useState } from 'react'
import { signInWithFacebook } from '../lib/oauth'

export default function FacebookButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithFacebook()
      // On success, the browser/redirect flow takes over — the app's
      // auth state updates automatically once it completes.
    } catch (err) {
      setError(err.message || 'Could not start Facebook sign-in.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-midnight-border px-5 py-3 text-ink font-medium transition-colors hover:bg-midnight-surface disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
        </svg>
        {loading ? 'Opening Facebook…' : 'Continue with Facebook'}
      </button>
      {error && <p className="text-heart-red text-sm text-center">{error}</p>}
    </div>
  )
}
