import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import VerifiedBadge from '../components/VerifiedBadge'

export default function Verify() {
  const { profile } = useAuth()
  const isVerified = Boolean(profile?.is_verified)

  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleVerifyCode = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!inviteCode.trim()) {
      setError('Please enter a valid developer invite code.')
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setError('Invalid developer invite code. Verification is currently invite-only.')
    }, 1000)
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 space-y-8">
      {/* Page Header */}
      <section className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30 mb-2">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          Get Verified <VerifiedBadge verified={true} size="lg" />
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          Verification grants your profile an official blue checkmark, extra visibility across the platform, and exclusive spin styling.
        </p>
      </section>

      {/* Already Verified Banner */}
      {isVerified ? (
        <div className="card p-6 border-sky-500/30 bg-sky-500/10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-sky-400 font-semibold text-base">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            You are already verified!
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Your account has been granted developer-verified status. Your checkmark is visible to all users across search and random chat.
          </p>
          <div className="pt-2">
            <Link to="/profile" className="btn-ghost text-xs !px-4 !py-2 font-medium">
              Back to Profile
            </Link>
          </div>
        </div>
      ) : (
        /* Invite Only Notice Card */
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
            <svg className="w-5 h-5 fill-current shrink-0 mt-0.5 text-amber-400" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div>
              <span className="font-semibold block mb-0.5 text-amber-200">Developer Invite Only</span>
              Verification badges are currently restricted. To receive a badge, you must receive an explicit invite or direct verification from the platform developer.
            </div>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="invite-code" className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Developer Invite Code
              </label>
              <input
                id="invite-code"
                type="text"
                placeholder="Enter 8-digit invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="input-field font-mono uppercase tracking-widest text-center"
              />
            </div>

            {error && <p className="text-heart-red text-xs text-center font-medium">{error}</p>}
            {success && <p className="text-emerald-400 text-xs text-center font-medium">{success}</p>}

            <button
              type="submit"
              disabled={submitting || !inviteCode.trim()}
              className="btn-primary w-full !py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              {submitting ? 'Verifying Code…' : 'Redeem Verification Code'}
            </button>
          </form>

          <hr className="border-midnight-border/60" />

          <div className="space-y-3 text-center">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
              How do I get an invite?
            </h3>
            <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">
              Badges are awarded to active community leaders, creators, and early adopters by direct developer invite. Stay tuned for public verification requests!
            </p>
            <div className="pt-2">
              <Link to="/profile" className="btn-ghost text-xs !px-4 !py-2 font-medium">
                Return to Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}