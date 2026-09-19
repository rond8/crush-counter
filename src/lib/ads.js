import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob'
import { supabase } from '../supabaseClient'

// Google's official TEST ad unit IDs. Always safe to serve.
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712'
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917'
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'

// Your real, live ad unit IDs.
const REAL_INTERSTITIAL_ID = 'ca-app-pub-3066204861051598/9687269392' // App_Open_Splash (Fixed Interstitial)
const REAL_REWARDED_ID = 'ca-app-pub-3066204861051598/3668335151' // y_ad
const REAL_BANNER_ID = 'ca-app-pub-3066204861051598/4206991824' // ban

const LAUNCH_AD_COOLDOWN_MS = 5 * 60 * 1000

let adsLive = false
let initialized = false
let launchAdLoading = false
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
 * Initialize the AdMob SDK. Safe to call multiple times.
 */
export async function initAds() {
  if (initialized || !Capacitor.isNativePlatform()) return

  try {
    const { data, error } = await supabase.rpc('get_app_config')
    adsLive = error ? false : Boolean(data?.[0]?.ads_live)
    console.log('Ads Live Status:', adsLive)
  } catch (err) {
    console.warn('Supabase config fetch failed, defaulting to test ads:', err)
    adsLive = false
  }

  try {
    const result = await AdMob.initialize({ initializeForTesting: !adsLive })
    console.log('AdMob Initialized:', result)
    initialized = true
    // We don't automatically preload here to avoid wasting "matches"
    // unless we know we're going to show it.
  } catch (err) {
    console.error('AdMob Init Failed:', err)
  }
}

/**
 * Preloads the launch ad if one isn't already ready or loading.
 */
export async function preloadLaunchAd() {
  if (!initialized || launchAdReady || launchAdLoading) return

  launchAdLoading = true
  try {
    console.log('Preloading Launch Ad with ID:', launchAdUnitId())
    await AdMob.prepareInterstitial({ adId: launchAdUnitId(), isTesting: !adsLive })
    launchAdReady = true
    console.log('Launch Ad Ready')
  } catch (err) {
    console.error('Preload Launch Ad Failed:', err)
    launchAdReady = false
  } finally {
    launchAdLoading = false
  }
}

/**
 * Show the launch ad. If not ready, it will start preloading and
 * return false. If ready and shown, returns true.
 */
export async function maybeShowLaunchAd(isPremium = false) {
  if (!Capacitor.isNativePlatform() || !initialized || isPremium) return false

  // Respect cooldown
  const now = Date.now()
  if (now - lastShownAt < LAUNCH_AD_COOLDOWN_MS) return false

  if (!launchAdReady) {
    preloadLaunchAd().catch(() => {})
    return false
  }

  launchAdReady = false
  try {
    await AdMob.showInterstitial()
    lastShownAt = Date.now()
    console.log('Launch Ad Shown successfully')
    // Preload next one after a delay to ensure this impression registers
    setTimeout(() => preloadLaunchAd().catch(() => {}), 2000)
    return true
  } catch (err) {
    console.error('Show Launch Ad Failed:', err)
    preloadLaunchAd().catch(() => {})
    return false
  }
}

/**
 * Reward ad logic - preloads on demand to ensure high fill-to-impression ratio.
 */
export async function watchRewardedAd(rewardType) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Ads are only available in the installed app.')
  }

  try {
    // Load right before showing to maximize impression chance
    await AdMob.prepareRewardVideoAd({ adId: rewardedAdUnitId(), isTesting: !adsLive })
  } catch (err) {
    if (err.message?.includes('JavascriptEngine')) {
      throw new Error('Ad system failed (JS Engine error). Please update "Android System WebView" in the Play Store.')
    }
    throw new Error('Could not load the ad. Please try again later.')
  }

  let rewardItem
  try {
    rewardItem = await AdMob.showRewardVideoAd()
  } catch (err) {
    if (err.message?.includes('JavascriptEngine')) {
      throw new Error('Ad system failed (JS Engine error). Please update "Android System WebView" in the Play Store.')
    }
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
 * Admin: read the current remote ads_live value.
 */
export async function getAdsLive() {
  const { data, error } = await supabase.rpc('get_app_config')
  if (error) throw error
  return Boolean(data?.[0]?.ads_live)
}

/**
 * Admin-only: flip real ads on/off remotely.
 */
export async function setAdsLive(live) {
  const { error } = await supabase.rpc('set_ads_live', { p_live: live })
  if (error) throw error
}

export async function showBanner(onSizeChange) {
  if (!Capacitor.isNativePlatform() || !initialized || bannerShown) return
  try {
    console.log('Showing Banner with ID:', bannerAdUnitId())
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
    console.log('Banner Shown successfully')
  } catch (err) {
    console.error('Show Banner Failed:', err)
    bannerShown = false
  }
}

export async function hideBanner() {
  if (!Capacitor.isNativePlatform() || !bannerShown) return
  try {
    await AdMob.hideBanner()
  } catch {}
}

export async function removeBanner() {
  if (!Capacitor.isNativePlatform() || !bannerShown) return
  try {
    await AdMob.removeBanner()
  } catch {
  } finally {
    bannerShown = false
  }
}
