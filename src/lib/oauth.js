import { Capacitor } from '@capacitor/core'

// Custom URL scheme registered in capacitor.config.json / AndroidManifest.xml.
// Must exactly match the app's declared scheme (see android/app/src/main/res/values/strings.xml -> custom_url_scheme).
const NATIVE_REDIRECT_URL = 'com.rdosio.crushcounter://login-callback'

/**
 * Where Supabase should send the user back to after completing an
 * OAuth flow (e.g. Google Sign-In). Must match an entry in Supabase's
 * Authentication -> URL Configuration -> Redirect URLs allowlist.
 *
 * On native (Capacitor/Android), window.location.origin resolves to
 * "https://localhost" inside the WebView, which is useless as a
 * redirect target -- so native gets a custom URL scheme instead,
 * caught by an appUrlOpen listener in App.jsx.
 */
export function getOAuthRedirectUrl() {
  if (Capacitor.isNativePlatform()) {
    return NATIVE_REDIRECT_URL
  }
  return `${window.location.origin}/dashboard`
}