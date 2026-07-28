import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob'
import { supabase } from '../supabaseClient'

// Google's official TEST ad unit IDs. Always safe to serve — used
// whenever the remote ads_live toggle (see below) is off.
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712'
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917'
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'

// Your real, live ad unit IDs from the AdMob dashboard (Apps ->
// Crush Counter -> Ad units). Note this plugin doesn't support the
// "App Open" ad format specifically — an Interstitial ad shown right
// on launch is the standard substitute, and is what's wired up below,
// reusing the App_Open_Splash unit for that purpose.
const REAL_INTERSTITIAL_ID = 'ca-app-pub-3066204861051598/1525955762' // App_Open_Splash
const REAL_REWARDED_ID = 'ca-app-pub-3066204861051598/3668335151' // y_ad
const REAL_BANNER_ID = 'ca-app-pub-3066204861051598/4206991824' // ban

// Minimum time between launch-ad shows. Launch ads only ever trigger
// from an explicit login action (see AuthContext.signIn), never from
// app foreground/visibility events — this cooldown is just a cheap
// safety net against accidental double-fires.
const LAUNCH_AD_COOLDOWN_MS = 3 * 60 * 1000

// Whether to serve real ads this session — fetched once from
// Supabase in initAds() and cached for the rest of the app's
// lifetime. Toggling app_config.ads_live remotely takes effect the
// NEXT time someone opens the app, not instantly mid-session.
let adsLive = false
let initialized = false
let launchAdReady = false
let lastShownAt = 0
let bannerShown = false

function launchAdUnitId() {
  return adsLive ? REAL_INTERSTITIAL_ID : TEST_INTERSTITIAL_ID
}
function rewardedAdUnitId() {
  return adsLive ? REAL_REWARDED_ID : TEST_REWARDED_ID
}
function bannerAdUnitId() {
  return adsLive ? REAL_BANNER_ID : TEST_BANNER_ID
}

/**
 * Initialize the AdMob SDK. Safe to call multiple times — no-ops
 * after the first successful call. Also a no-op on web (ads are
 * native-only). Fetches the remote ads_live flag first; if that
 * fetch fails for any reason, falls back to test ads rather than
 * risk accidentally serving real ones.
 */
export async function initAds() {
  if (initialized || !Capacitor.isNativePlatform()) return

  try {
    const { data, error } = await supabase.rpc('get_app_config')
    adsLive = error ? false : Boolean(data?.[0]?.ads_live)
  } catch {
    adsLive = false
  }

  try {
    await AdMob.initialize({ initializeForTesting: !adsLive })
    initialized = true
    preloadLaunchAd()
  } catch {
    // Ads are a nice-to-have — never let a failure here block the app.
  }
}

async function preloadLaunchAd() {
  try {
    await AdMob.prepareInterstitial({ adId: launchAdUnitId(), isTesting: !adsLive })
    launchAdReady = true
  } catch {
    launchAdReady = false
  }
}

/**
 * Show the launch ad if one is ready. Call this only from explicit
 * user actions (e.g. a successful login) — never from app
 * foreground/visibility events. Silently does nothing on web, before
 * init, without a loaded ad, or within the cooldown window.
 */
export async function maybeShowLaunchAd() {
  if (!Capacitor.isNativePlatform() || !initialized || !launchAdReady) return
  if (Date.now() - lastShownAt < LAUNCH_AD_COOLDOWN_MS) return

  launchAdReady = false
  try {
    await AdMob.showInterstitial()
    lastShownAt = Date.now()
  } catch {
    // Ignore — not worth surfacing an error to the user for this.
  } finally {
    preloadLaunchAd()
  }
}

/**
 * Show a rewarded ad and, only if the person actually watches it to
 * completion, claim the reward via claim_ad_reward(). rewardType is
 * 'coins' or 'spin'. Returns { new_coins, new_free_spins } or throws.
 */
export async function watchRewardedAd(rewardType) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Ads are only available in the installed app, not the web preview.')
  }

  await AdMob.prepareRewardVideoAd({ adId: rewardedAdUnitId(), isTesting: !adsLive })

  let rewardItem
  try {
    rewardItem = await AdMob.showRewardVideoAd()
  } catch {
    throw new Error('Ad was not completed — no reward given.')
  }

  if (!rewardItem || typeof rewardItem.amount !== 'number') {
    throw new Error('Ad was not completed — no reward given.')
  }

  const { data, error } = await supabase.rpc('claim_ad_reward', { p_reward_type: rewardType })
  if (error) throw error
  return data?.[0] ?? { new_coins: null, new_free_spins: null }
}

/**
 * Admin: read the current remote ads_live value (for a Settings
 * toggle UI).
 */
export async function getAdsLive() {
  const { data, error } = await supabase.rpc('get_app_config')
  if (error) throw error
  return Boolean(data?.[0]?.ads_live)
}

/**
 * Admin-only: flip real ads on/off remotely. Takes effect for
 * sessions that start AFTER this call, not the current one.
 */
export async function setAdsLive(live) {
  const { error } = await supabase.rpc('set_ads_live', { p_live: live })
  if (error) throw error
}

/**
 * Show a bottom banner ad. Banners are a native overlay drawn by the
 * OS/AdMob SDK on top of the WebView — NOT part of the page's DOM —
 * so they can visually cover fixed-position UI (like BottomTabBar)
 * unless the app's own layout is shifted to make room. `onSizeChange`
 * is called with the banner's height in px whenever it's known/changes,
 * so the caller can offset its layout accordingly (see
 * src/components/BannerAd.jsx, which does exactly this).
 */
export async function showBanner(onSizeChange) {
  if (!Capacitor.isNativePlatform() || !initialized || bannerShown) return
  try {
    if (onSizeChange) {
      AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info) => {
        onSizeChange(info?.height ?? 50)
      })
    }
    await AdMob.showBanner({
      adId: bannerAdUnitId(),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: !adsLive,
    })
    bannerShown = true
  } catch {
    bannerShown = false
  }
}

/** Temporarily hide the banner without destroying it (cheap to re-show). */
export async function hideBanner() {
  if (!Capacitor.isNativePlatform() || !bannerShown) return
  try {
    await AdMob.hideBanner()
  } catch {
    // Not critical — worst case it stays visible until removeBanner().
  }
}

/** Fully remove the banner (call on unmount). */
export async function removeBanner() {
  if (!Capacitor.isNativePlatform() || !bannerShown) return
  try {
    await AdMob.removeBanner()
  } catch {
    // Not critical.
  } finally {
    bannerShown = false
  }
}