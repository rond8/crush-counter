// The real, publicly-reachable URL your site is deployed at (e.g. a
// Vercel domain). MUST be set in .env for the native Android app —
// window.location.origin inside the Capacitor WebView resolves to
// something like "https://localhost", which isn't a link anyone
// outside the app could ever open. Falls back to window.location.origin
// so it still works out of the box in local dev / web preview.
const PUBLIC_APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin

/**
 * Build a shareable invite link for the given username. Register.jsx
 * reads the `ref` query param back out and credits it via
 * claimReferral() once the new account has a session.
 */
export function getInviteLink(username) {
  if (!username) return ''
  return `${PUBLIC_APP_URL}/register?ref=${encodeURIComponent(username)}`
}