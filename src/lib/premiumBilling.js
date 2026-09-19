export function hasActivePremiumPurchase(purchases) {
  return purchases.some((purchase) => {
    const isPurchased = purchase?.purchaseState === 'PURCHASED' || purchase?.purchaseState === 0
    const hasSubscribeProduct = purchase?.products?.includes('subscribe')
    return isPurchased && hasSubscribeProduct
  })
}

export function checkPremiumFromPlayBilling(billingClient, onResult) {
  if (!billingClient || typeof billingClient.queryPurchasesAsync !== 'function') {
    onResult?.(false)
    return
  }

  const params = window?.BillingClient?.ProductType
    ? {
        productType: window.BillingClient.ProductType.SUBS,
      }
    : null

  if (!params) {
    onResult?.(false)
    return
  }

  billingClient.queryPurchasesAsync(params, (billingResult, purchases) => {
    if (billingResult?.responseCode === window?.BillingClient?.BillingResponseCode?.OK) {
      const isPremium = hasActivePremiumPurchase(purchases || [])
      onResult?.(isPremium)
      return
    }

    onResult?.(false)
  })
}
