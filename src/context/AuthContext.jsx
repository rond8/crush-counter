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
        'id, username, display_name, is_admin, is_verified, avatar_url, gender, relationship_status, age, location, bio, coins, fame, leaderboard_opt_in, premium_unlocked, ad_free_spins'
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

  // Keep last_seen fresh while the app is open, so other users' online
  // indicators (for their crush / matches) stay accurate. Pauses when
  // the tab isn't visible to avoid unnecessary writes.
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

  // Claim the once-per-day coin reward whenever a session starts.
  // No-op server-side if already claimed today, so it's safe to call
  // on every login/app open.
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

  // Notify when new (non-matched) admirers show up — checked once on
  // session start, then periodically while the app is open, so it
  // feels like a live notification without needing push infra.
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

  // Claim a pending referral left by Register.jsx if email
  // confirmation meant there was no session yet at signup time. Runs
  // once per new user id; harmless to re-run since claim_referral()
  // is idempotent server-side.
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
      } catch {
        // Not critical if this doesn't clear — worst case it retries
        // harmlessly next session.
      }
    })
  }, [session?.user?.id])

  const signUp = async ({ email, password, username, displayName, age }) => {
    const cleanUsername = username.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // If email confirmation is required, there may be no active session yet.
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: cleanUsername,
        display_name: displayName?.trim() || cleanUsername,
        age: age ?? null,
      })
      if (profileError) throw profileError
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Show the launch ad only on an explicit login action — not on
    // page refresh (restored session) and not on every foreground
    // return. Skip it for premium users. Query fresh here rather than
    // relying on `profile` state, since that hasn't updated yet at
    // this point in the login flow.
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