import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { touchLastSeen } from '../lib/presence'
import { claimDailyCoins } from '../lib/game'
import { checkNewAdmirers } from '../lib/crush'
import { getUnreadNotificationCount } from '../lib/notifications'
import { maybeShowLaunchAd } from '../lib/ads'
import { initPurchases } from '../lib/purchases'
import { claimReferral, PENDING_REFERRAL_STORAGE_KEY } from '../lib/missions'

const HEARTBEAT_INTERVAL_MS = 45 * 1000
const ADMIRER_POLL_INTERVAL_MS = 60 * 1000

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dailyReward, setDailyReward] = useState(null)
  const [newAdmirer, setNewAdmirer] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, username, display_name, is_admin, avatar_url, gender, relationship_status, age, location, bio, coins, fame, leaderboard_opt_in, premium_unlocked, ad_free_spins, is_verified'
      )
      .eq('id', userId)
      .maybeSingle()
    if (!error) setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadProfile(session?.user?.id).finally(() => setLoading(false))
      if (session?.user?.id) initPurchases(session.user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      loadProfile(session?.user?.id)
      if (session?.user?.id) initPurchases(session.user.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  // Keep last_seen fresh while the app is open
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    const beat = () => {
      if (document.visibilityState === 'visible') {
        touchLastSeen(userId).catch(() => {})
      }
    }
    beat()
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS)
    document.addEventListener('visibilitychange', beat)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [session?.user?.id])

  // Claim once-per-day coin reward
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    claimDailyCoins()
      .then((result) => {
        if (result.awarded) {
          setDailyReward(result)
          setProfile((prev) => (prev ? { ...prev, coins: result.new_balance } : prev))
        }
      })
      .catch(() => {})
  }, [session?.user?.id])

  // Poll for new admirers and notifications
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    const check = () => {
      if (document.visibilityState !== 'visible') return
      checkNewAdmirers()
        .then((result) => {
          if (result.has_new) {
            setNewAdmirer(result)
          }
        })
        .catch(() => {})
      getUnreadNotificationCount()
        .then(setUnreadCount)
        .catch(() => {})
    }
    check()
    const interval = setInterval(check, ADMIRER_POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', check)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [session?.user?.id])

  // Claim pending referral
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    let pending
    try {
      pending = localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY)
    } catch {
      return
    }
    if (!pending) return
    claimReferral(pending).finally(() => {
      try {
        localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY)
      } catch {}
    })
  }, [session?.user?.id])

  const signUp = async ({ email, password, username, displayName, age }) => {
    const cleanUsername = username.trim().toLowerCase()

    // Pass metadata into auth signup as well so database triggers can pick it up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          age: age ?? null,
        },
      },
    })
    if (error) throw error

    // Only update profiles table if a user object was returned and session exists
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          username: cleanUsername,
          display_name: displayName?.trim() || cleanUsername,
          age: age ?? null,
        },
        { onConflict: 'id' }
      )

      // Ignore non-fatal RLS error if trigger already handled creation
      if (profileError && !profileError.message.includes('permission denied')) {
        throw profileError
      }
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const userId = data.user?.id
    if (userId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('fame, premium_unlocked')
        .eq('id', userId)
        .maybeSingle()
      const isPremium = (prof?.fame ?? 0) >= 500 || Boolean(prof?.premium_unlocked)
      if (!isPremium) maybeShowLaunchAd()
    }

    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    // True once we know for sure: there's an authenticated session but
    // no matching profiles row yet (e.g. just completed Google OAuth
    // for the first time, which never collects a username).
    profileIncomplete: !loading && Boolean(session) && !profile,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => loadProfile(session?.user?.id),
    dailyReward,
    clearDailyReward: () => setDailyReward(null),
    newAdmirer,
    clearNewAdmirer: () => setNewAdmirer(null),
    unreadCount,
    refreshUnreadCount: () => getUnreadNotificationCount().then(setUnreadCount).catch(() => {}),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}