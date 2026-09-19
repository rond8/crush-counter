import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { touchLastSeen } from '../lib/presence'
import { claimDailyCoins } from '../lib/game'
import { checkNewAdmirers } from '../lib/crush'
import { getUnreadNotificationCount, setupPhoneNotifications } from '../lib/notifications'
import { maybeShowLaunchAd, preloadLaunchAd } from '../lib/ads'
import { claimReferral, PENDING_REFERRAL_STORAGE_KEY } from '../lib/missions'
import { recordEngagementEvent } from '../lib/gamification'

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
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('Error loading profile:', error)
      return
    }
    setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadProfile(session?.user?.id).finally(() => setLoading(false))
      if (session?.user?.id) recordEngagementEvent(session.user.id, 'login')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      loadProfile(session?.user?.id)
      if (session?.user?.id) recordEngagementEvent(session.user.id, 'login')
    })

    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  // AUTO-SHOW LAUNCH AD: When profile is ready and user is not premium
  useEffect(() => {
    if (!loading && profile) {
      const isPremium = (profile.fame ?? 0) >= 5000 || Boolean(profile.premium_unlocked)
      if (!isPremium) {
        // First preload it
        preloadLaunchAd().then(() => {
           // Then show it (respects internal cooldown)
           maybeShowLaunchAd(isPremium)
        })
      }
    }
  }, [loading, !!profile])

  // Setup Phone Push Notifications
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    setupPhoneNotifications(userId).catch(() => {})
  }, [session?.user?.id])

  // Keep last_seen fresh
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
          if (result.has_new) setNewAdmirer(result)
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
    try { pending = localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY) } catch { return }
    if (!pending) return
    claimReferral(pending).finally(() => {
      try { localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY) } catch {}
    })
  }, [session?.user?.id])

  const signUp = async ({ email, password, username, displayName, age, birthday }) => {
    const cleanUsername = username.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: cleanUsername, age: age ?? null, birthday: birthday ?? null } },
    })
    if (error) throw error
    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          username: cleanUsername,
          display_name: displayName?.trim() || cleanUsername,
          age: age ?? null,
          birthday: birthday ?? null,
        },
        { onConflict: 'id' }
      )
      if (profileError && !profileError.message.includes('permission denied')) throw profileError
    }
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Ad showing is now handled by the global useEffect [loading, profile]
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
    isVerified: Boolean(session?.user?.email_confirmed_at),
    profileIncomplete: !loading && Boolean(session) && (!profile || !profile.username),
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
