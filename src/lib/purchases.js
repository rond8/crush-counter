import { Capacitor } from '@capacitor/core'
import { supabase } from '../supabaseClient'

/**
 * Initialize direct Google Play Billing.
 * Registers products for premium subscription and one-time coin purchases.
 */
export async function initPurchases(userId) {
  if (!Capacitor.isNativePlatform() || !window.store) return

  const { store, ProductType, Platform } = window.store

  // 1. Configure the store
  store.verbosity = store.DEBUG

  // 2. Register Products
  // 100 Coins (One-time / Consumable)
  store.register({
    id: '100coin',
    type: ProductType.CONSUMABLE,
    platform: Platform.GOOGLE_PLAY,
  })

  // 3. Handle successful purchases

  // 100 Coins Handler (Image shows 100coin ID gives 50 coins)
  store.when('100coin')
    .approved((transaction) => {
      console.log('50 Coins Purchase approved:', transaction)
      // Grant 50 coins via Supabase RPC (matches Product Name in Play Console)
      supabase.rpc('grant_coins', { p_amount: 50 }).then(({ error }) => {
        if (!error) {
          transaction.finish()
        }
      })
    })
    .verified((receipt) => {
      receipt.finish()
    })

  // 4. Start the store
  store.initialize([Platform.GOOGLE_PLAY])
  store.update()
}

/**
 * Trigger the Google Play purchase flow for Coins.
 */
export async function purchaseCoins(productId = '100coin') {
  return orderProduct(productId)
}

/**
 * Internal helper to order a registered product.
 */
async function orderProduct(productId) {
  if (!Capacitor.isNativePlatform() || !window.store) {
    // Fallback logic if needed (e.g. testing on web)
    return false
  }

  const { store } = window.store
  const product = store.get(productId)

  if (product && product.canPurchase) {
    store.order(productId)
    return true
  } else {
    throw new Error(`Product ${productId} currently unavailable in Google Play`)
  }
}

// Stubs for compatibility with your existing UI
export async function getPremiumPackage() { return null }
export async function restorePurchases() {
  if (window.store) window.store.refresh()
  return false
}
