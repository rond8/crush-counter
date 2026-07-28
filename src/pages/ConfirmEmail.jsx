import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ConfirmEmail() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Verifying your email link...')

  useEffect(() => {
    // Listen for auth state after redirection from confirmation email
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        setStatus('Email confirmed! Redirecting to dashboard...')
        setTimeout(() => navigate('/dashboard'), 1500)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card p-8 text-center max-w-sm space-y-4">
        <span className="text-4xl animate-bounce inline-block">💌</span>
        <h2 className="font-display text-xl font-bold text-white">Email Verification</h2>
        <p className="text-xs text-muted">{status}</p>
      </div>
    </div>
  )
}