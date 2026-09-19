import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { verifyOTP, resendVerification } from '../lib/auth'

export default function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Retrieve info passed from Register/Login page state
  const email = location.state?.email || ''
  const type = location.state?.type || 'signup' // 'signup' or 'email' (for login)

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

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

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
    if (e) e.preventDefault()
    setError('')
    setSuccess('')

    const code = otp.join('')
    if (code.length !== 6) return setError('Please enter all 6 digits.')

    setLoading(true)
    try {
      await verifyOTP(email, code, type)
      setSuccess('Verified successfully! Redirecting…')
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-submit when all digits filled
  useEffect(() => {
    if (otp.join('').length === 6 && !loading && !success) {
      handleVerify()
    }
  }, [otp])

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setError('')
    setSuccess('')
    setResending(true)

    try {
      await resendVerification(email, type)
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
      <div className="w-full max-w-sm card p-8 text-center border-midnight-border shadow-2xl space-y-6">
        <div>
          <div className="w-16 h-16 bg-heart-purple/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔐</div>
          <h1 className="font-display text-2xl font-black text-ink italic">Verify Email</h1>
          <p className="text-xs text-muted mt-1 leading-relaxed px-4">
            Enter the 6-digit code we sent to <br/>
            <span className="text-heart-purple font-bold font-mono">{email || 'your email'}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
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
                className="w-10 h-12 text-center text-xl font-mono font-black bg-midnight-surface border border-midnight-border rounded-xl text-ink focus:outline-none focus:border-heart-purple focus:ring-2 focus:ring-heart-purple/20 transition-all shadow-inner"
              />
            ))}
          </div>

          {error && <p className="text-xs text-heart-red font-bold animate-in shake-in-1">{error}</p>}
          {success && <p className="text-xs text-heart-green font-bold">{success}</p>}

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6 || !!success}
            className="btn-primary w-full py-3.5 font-black uppercase tracking-widest text-xs shadow-glow-purple disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue 🚀'}
          </button>
        </form>

        <div className="text-[10px] text-muted pt-4 border-t border-midnight-border/50 flex flex-col items-center gap-2">
          <p className="font-medium">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending || !!success}
            className="text-heart-purple hover:underline font-black uppercase tracking-wider disabled:opacity-40 disabled:no-underline transition-all"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-[10px] text-muted hover:text-ink font-bold uppercase tracking-widest transition-colors"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  )
}
