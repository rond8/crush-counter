import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useAuth } from '../context/AuthContext'
import { showBanner, removeBanner } from '../lib/ads'

/**
 * Mount once, globally (alongside FloatingHearts/PullToRefresh in
 * App.jsx) — renders nothing itself (the banner is a native overlay,
 * not DOM content). Skips entirely for premium users and on web.
 * Publishes --banner-height on the document root so BottomTabBar and
 * page content can shift up to sit above the banner instead of
 * being covered by it.
 */
export default function BannerAd() {
  const { profile } = useAuth()
  const isPremium = (profile?.fame ?? 0) >= 5000 || Boolean(profile?.premium_unlocked)

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || isPremium) {
      document.documentElement.style.setProperty('--banner-height', '0px')
      return
    }

    let active = true
    showBanner((heightPx) => {
      if (active) document.documentElement.style.setProperty('--banner-height', `${heightPx}px`)
    })

    return () => {
      active = false
      removeBanner()
      document.documentElement.style.setProperty('--banner-height', '0px')
    }
  }, [isPremium])

  return null
}