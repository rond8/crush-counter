import { supabase } from '../supabaseClient'

/**
 * Send a 6-digit OTP code to the user's email
 */
export async function sendEmailOTP(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Creates user if they don't exist yet
    },
  })
  if (error) throw error
  return data
}

/**
 * Verify the 6-digit OTP code entered by the user
 */
export async function verifyEmailOTP(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: token.trim(),
    type: 'email',
  })
  if (error) throw error
  return data
}

/**
 * Resend email verification link / code
 */
export async function resendVerification(email) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  if (error) throw error
  return data
}