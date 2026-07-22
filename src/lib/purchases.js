import { Capacitor } from '@capacitor/core'
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor'
import { supabase } from '../supabaseClient'

// RevenueCat dashboard -> Project settings -> API keys. These are
// PUBLIC keys (safe to ship inside the app) — completely separate
// from your Play Console / App Store Connect credentials, which
// never go in client code. Get one per store you support.
//
// NOTE: the exact method names/shapes below (configure, logIn,
// getOfferings, purchasePackage, restorePurchases, entitlements
// object) match @revenuecat/purchases-capacitor as of writing —
// always double check against the current docs at
// https://www.revenuecat.com/docs/getting-started/installation/capacitor
// since SDK APIs do evolve between major versions.
const REVENUECAT_ANDROID_KEY = 'YOUR_REVENUECAT_ANDROID_PUBLIC_KEY'
const REVENUECAT_IOS_KEY = 'YOUR_REVENUECAT_IOS_PUBLIC_KEY'

// Must match the Entitlement identifier you create in the RevenueCat
// dashboard (Entitlements tab), which you attach to the premium
// product(s) you create in Play Console / App Store Connect.
const PREMIUM_ENTITLEMENT_ID = 'premium'

let configured = false

/**
 * Configure the RevenueCat SDK for the current logged-in user. Call
 * this once a Supabase session exists (see AuthContext). Safe to
 * call multiple times — subsequent calls just log in the (possibly
 * different) user. No-op on web, since IAP is native-only.
 */
export async function initPurchases(userId) {
  if (!Capacitor.isNativePlatform() || !userId) return
  try {
    const apiKey = Capacitor.getPlatform() === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY
    if (!configured) {
      await Purchases.setLogLevel({ level: LOG_LEVEL.WARN })
      await Purchases.configure({ apiKey, appUserID: userId })
      configured = true
    } else {
      await Purchases.logIn({ appUserID: userId })
    }
  } catch {
    // Purchases are a nice-to-have on top of the app — never let a
    // failure here block anything else from loading.
  }
}

/**
 * The premium package to show on the Premium page (price, product
 * identifier, etc.), or null if unavailable (e.g. web preview, no
 * network, or nothing configured yet in the RevenueCat dashboard).
 */
export async function getPremiumPackage() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const offerings = await Purchases.getOfferings()
    const current = offerings.current
    if (!current) return null
    // Prefer a lifetime/non-consumable package if present, otherwise
    // fall back to whatever's first — adjust this to match however
    // you set up your Offering in the RevenueCat dashboard.
    return (
      current.availablePackages.find((p) => p.packageType === 'LIFETIME') ??
      current.availablePackages[0] ??
      null
    )
  } catch {
    return null
  }
}

/**
 * Buy the given package. Returns true if the purchase went through
 * and the premium entitlement is now active. Throws on a real error
 * (payment declined, network, etc) — the thrown error has
 * `userCancelled: true` if the person just closed the purchase sheet,
 * which callers should treat as a non-error.
 */
export async function purchasePremium(pkg) {
  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return isPremiumEntitled(customerInfo)
}

/**
 * Restore previous purchases on this store account (needed after a
 * reinstall or on a new device — required by both Apple's and
 * Google's review guidelines for non-consumable purchases).
 */
export async function restorePurchases() {
  const { customerInfo } = await Purchases.restorePurchases()
  return isPremiumEntitled(customerInfo)
}

function isPremiumEntitled(customerInfo) {
  return Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID])
}

/**
 * Sync a confirmed entitlement to Supabase so the rest of the app
 * (which reads profiles.premium_unlocked) doesn't need to talk to
 * RevenueCat directly.
 *
 * This trusts the client's report that the purchase succeeded. For
 * stronger protection against a tampered client, the more robust
 * setup is a RevenueCat webhook (Project Settings -> Integrations ->
 * Webhooks) that POSTs purchase events to a Supabase Edge Function,
 * which then updates profiles.premium_unlocked using the service
 * role key — that way the source of truth is RevenueCat's own
 * server-validated event, not something the app itself asserts.
 */
export async function syncPremiumToProfile() {
  const { error } = await supabase.rpc('mark_premium_purchased')
  if (error) throw error
}

/**
 * Find a specific package by its underlying store product identifier
 * within the current Offering — used by the Shop to buy one specific
 * item, as opposed to getPremiumPackage()'s "pick the lifetime one."
 * Returns null if that product isn't configured/available.
 */
export async function getShopPackage(productIdentifier) {
  if (!Capacitor.isNativePlatform() || !productIdentifier) return null
  try {
    const offerings = await Purchases.getOfferings()
    const current = offerings.current
    if (!current) return null
    return current.availablePackages.find((p) => p.product.identifier === productIdentifier) ?? null
  } catch {
    return null
  }
}

/**
 * Buy a consumable (repeatable) item. Unlike purchasePremium(), this
 * doesn't check an entitlement afterward — consumables in RevenueCat
 * aren't entitlement-gated, a successful purchasePackage() call IS
 * the confirmation. Throws on failure; the error has
 * `userCancelled: true` if the person just closed the purchase sheet.
 * Caller is responsible for granting the item server-side afterward
 * (see grantPurchasedItem in lib/shop.js).
 */
export async function purchaseConsumable(pkg) {
  await Purchases.purchasePackage({ aPackage: pkg })
}