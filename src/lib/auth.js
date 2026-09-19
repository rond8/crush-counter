import { supabase } from '../supabaseClient'

/**
 * Send a 6-digit OTP code to the user's email for passwordless login
 */
export async function sendEmailOTP(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // For login, we usually don't want to create a user here if using email/password signup
    },
  })
  if (error) throw error
  return data
}

/**
 * Verify a 6-digit OTP code.
 * type can be 'signup', 'invite', 'magiclink', 'recovery', 'email_change', or 'email'
 */
export async function verifyOTP(email, token, type = 'signup') {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: token.trim(),
    type,
  })
  if (error) throw error
  return data
}

/**
 * Resend email verification link / code
 */
export async function resendVerification(email, type = 'signup') {
  const { data, error } = await supabase.auth.resend({
    type,
    email,
  })
  if (error) throw error
  return data
}
