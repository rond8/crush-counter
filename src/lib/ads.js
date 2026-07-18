import { Capacitor } from '@capacitor/core'
import { AdMob } from '@capacitor-community/admob'
import { supabase } from '../supabaseClient'

// Google's official TEST ad unit IDs. Safe to ship during development
// — showing your real ad unit IDs before release risks Google
// flagging your AdMob account for invalid traffic from dev testing.
//
// Swap these for your real IDs once you're ready to actually publish
// (from your AdMob dashboard: App_Open_Splash =
// ca-app-pub-3066204861051598/1525955762, y_ad (Rewarded) =
// ca-app-pub-3066204861051598/3668335151).
//
// Note: this plugin doesn't support the "App Open" ad format
// specifically — an Interstitial ad shown right on launch is the
// standard substitute, and is what's wired up below. If you want a
// true App Open ad, that's a separate native format you'd add
// directly in Android Studio.
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712'
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917'

const LAUNCH_AD_UNIT_ID = TEST_INTERSTITIAL_ID
const REWARDED_AD_UNIT_ID = TEST_REWARDED_ID

// Minimum time between launch-ad shows. Launch ads are only ever
// triggered from an explicit login action now (see
// AuthContext.signIn) — never from app foreground/visibility events,
// which felt spammy. This cooldown is just a cheap safety net against
// accidental double-fires (e.g. a fast double-submit of the login
// form).
const LAUNCH_AD_COOLDOWN_MS = 3 * 60 * 1000

let initialized = false
let launchAdReady = false
let lastShownAt = 0

/**
 * Initialize the AdMob SDK. Safe to call multiple times — no-ops
 * after the first successful call. Also a no-op on web (ads are
 * native-only).
 */
export async function initAds() {
  if (initialized || !Capacitor.isNativePlatform()) return
  try {
    await AdMob.initialize({ initializeForTesting: true })
    initialized = true
    preloadLaunchAd()
  } catch {
    // Ads are a nice-to-have — never let a failure here block the app.
  }
}

async function preloadLaunchAd() {
  try {
    await AdMob.prepareInterstitial({ adId: LAUNCH_AD_UNIT_ID, isTesting: true })
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
 *
 * showRewardVideoAd() resolves with the earned AdMobRewardItem
 * directly once the reward is granted — that's the plugin's own
 * documented pattern, and the reliable way to detect completion.
 * (An earlier version of this raced the Rewarded and Dismissed
 * events against each other, which could resolve as "not rewarded"
 * even on a genuinely completed watch, since both events can fire
 * close together and either could win the race.)
 */
export async function watchRewardedAd(rewardType) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Ads are only available in the installed app, not the web preview.')
  }

  await AdMob.prepareRewardVideoAd({ adId: REWARDED_AD_UNIT_ID, isTesting: true })

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
