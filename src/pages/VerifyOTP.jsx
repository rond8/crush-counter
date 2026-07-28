import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyEmailOTP, resendVerification } from '../lib/auth'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Retrieve email passed from Register/Login page state
  const email = location.state?.email || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cooldown, setCooldown] = useState(30)

  const inputRefs = useRef([])

  // Resend Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Handle key entry & auto-advance
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Numbers only

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Take last typed digit
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle pasting full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter all 6 digits.')
      return
    }

    setLoading(true)
    try {
      await verifyEmailOTP(email, code)
      setSuccess('Verified successfully! Redirecting…')
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setError('')
    setSuccess('')
    setResending(true)

    try {
      await resendVerification(email)
      setSuccess('A new verification code has been sent!')
      setCooldown(60)
    } catch (err) {
      setError(err.message || 'Could not resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md card p-8 bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl space-y-6 text-center">
        <div>
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="font-display text-2xl font-bold text-white">Enter Verification Code</h1>
          <p className="text-xs text-muted mt-1">
            We sent a 6-digit code to <span className="text-purple-300 font-semibold">{email || 'your email'}</span>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 text-center text-xl font-mono font-bold bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
            ))}
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {success && <p className="text-xs text-emerald-400">{success}</p>}

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="btn-primary w-full py-3 text-sm font-semibold rounded-xl disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? 'Verifying…' : 'Verify & Continue 🚀'}
          </button>
        </form>

        <div className="text-xs text-muted pt-2 border-t border-white/5 flex items-center justify-between">
          <span>Didn't receive code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-purple-400 hover:underline font-semibold disabled:opacity-40 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  )
}