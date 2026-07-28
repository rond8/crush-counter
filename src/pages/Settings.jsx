import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext.jsx'
import { updatePassword, updateEmail, deleteMyAccount } from '../lib/account'
import { getAdsLive, setAdsLive } from '../lib/ads'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = Boolean(profile?.is_admin)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')

  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [adsLive, setAdsLiveState] = useState(null)
  const [loadingAds, setLoadingAds] = useState(isAdmin)
  const [togglingAds, setTogglingAds] = useState(false)
  const [adsError, setAdsError] = useState('')

  const { theme, toggleTheme, preferences, setPreference, resetPreferences } = useTheme()

  const handlePreferenceToggle = (key) => setPreference(key, !preferences[key])

  useEffect(() => {
    if (!isAdmin) return
    getAdsLive()
      .then(setAdsLiveState)
      .catch((err) => setAdsError(err.message || 'Could not load ad settings.'))
      .finally(() => setLoadingAds(false))
  }, [isAdmin])

  const handleToggleAds = async () => {
    setAdsError('')
    setTogglingAds(true)
    try {
      const next = !adsLive
      await setAdsLive(next)
      setAdsLiveState(next)
    } catch (err) {
      setAdsError(err.message || 'Could not update ad settings.')
    } finally {
      setTogglingAds(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await updatePassword(newPassword)
      setPasswordSuccess('Password updated.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message || 'Could not update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')
    if (!newEmail.trim()) return
    setSavingEmail(true)
    try {
      await updateEmail(newEmail)
      setEmailSuccess('Check your new email address for a confirmation link.')
      setNewEmail('')
    } catch (err) {
      setEmailError(err.message || 'Could not update email.')
    } finally {
      setSavingEmail(false)
    }
  }

  const handleDelete = async () => {
    setDeleteError('')
    setDeleting(true)
    try {
      await deleteMyAccount(user?.id)
      await signOut()
      navigate('/')
    } catch (err) {
      setDeleteError(err.message || 'Could not delete your account.')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-muted text-sm">{user?.email}</p>
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg">Theme</h2>
            <p className="text-sm text-muted">Switch between light and dark mode.</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="card p-4 border border-white/10">
            <p className="text-sm font-semibold text-ink">Current theme</p>
            <p className="text-xs text-muted mt-1">{theme === 'dark' ? 'Dark' : 'Light'}</p>
          </div>
          <div className="card p-4 border border-white/10">
            <p className="text-sm font-semibold text-ink">Saved preferences</p>
            <p className="text-xs text-muted mt-1">Auto-applied on every visit.</p>
          </div>
        </div>
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="font-display text-lg">App preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-midnight-border bg-midnight-surface px-4 py-4">
            <div>
              <p className="font-semibold text-ink">Sound effects</p>
              <p className="text-xs text-muted">Toggle the app audio feedback.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.soundEffects}
              onChange={() => handlePreferenceToggle('soundEffects')}
              className="h-5 w-5 rounded bg-midnight-border text-heart-purple"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-midnight-border bg-midnight-surface px-4 py-4">
            <div>
              <p className="font-semibold text-ink">Reduced motion</p>
              <p className="text-xs text-muted">Lower animations across the app.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={() => handlePreferenceToggle('reduceMotion')}
              className="h-5 w-5 rounded bg-midnight-border text-heart-purple"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-midnight-border bg-midnight-surface px-4 py-4">
            <div>
              <p className="font-semibold text-ink">Compact layout</p>
              <p className="text-xs text-muted">Use tighter spacing and smaller cards.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.compactMode}
              onChange={() => handlePreferenceToggle('compactMode')}
              className="h-5 w-5 rounded bg-midnight-border text-heart-purple"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-2xl border border-midnight-border bg-midnight-surface px-4 py-4">
            <div>
              <p className="font-semibold text-ink">Item hints</p>
              <p className="text-xs text-muted">Show extra item descriptions in the spin wheel and inventory.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.showItemHints}
              onChange={() => handlePreferenceToggle('showItemHints')}
              className="h-5 w-5 rounded bg-midnight-border text-heart-purple"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={resetPreferences}
          className="btn-ghost !px-4 !py-2 text-sm"
        >
          Reset preferences
        </button>
      </section>

      {isAdmin && (
        <section className="card p-6 space-y-4 ring-1 ring-heart-purple/40">
          <h2 className="font-display text-lg">🛠️ Admin — Ads</h2>
          <p className="text-sm text-muted">
            Toggle real AdMob ads on/off remotely — no app update needed. Off serves Google's test
            ads only. Takes effect the next time someone opens the app, not instantly.
          </p>
          {loadingAds ? (
            <p className="text-xs text-muted font-mono">loading…</p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span className={`text-sm font-semibold ${adsLive ? 'text-heart-green' : 'text-muted'}`}>
                {adsLive ? '🟢 Real ads are LIVE' : '⚪ Test ads only'}
              </span>
              <button
                onClick={handleToggleAds}
                disabled={togglingAds}
                className={`!px-4 !py-2 text-sm ${adsLive ? 'btn-ghost !border-heart-red/50 !text-heart-red' : 'btn-primary'}`}
              >
                {togglingAds ? 'Saving…' : adsLive ? 'Turn off real ads' : 'Turn on real ads'}
              </button>
            </div>
          )}
          {adsError && <p className="text-heart-red text-sm">{adsError}</p>}
        </section>
      )}

      <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-4">
        <h2 className="font-display text-lg">Change password</h2>
        <div>
          <label className="block text-sm text-muted mb-1.5" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-1.5" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {passwordError && <p className="text-heart-red text-sm">{passwordError}</p>}
        {passwordSuccess && <p className="text-heart-green text-sm">{passwordSuccess}</p>}
        <button type="submit" disabled={savingPassword || !newPassword} className="btn-primary">
          {savingPassword ? 'Saving…' : 'Update password'}
        </button>
      </form>

      <form onSubmit={handleEmailSubmit} className="card p-6 space-y-4">
        <h2 className="font-display text-lg">Change email</h2>
        <div>
          <label className="block text-sm text-muted mb-1.5" htmlFor="newEmail">
            New email address
          </label>
          <input
            id="newEmail"
            type="email"
            className="input-field"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={user?.email}
          />
        </div>
        {emailError && <p className="text-heart-red text-sm">{emailError}</p>}
        {emailSuccess && <p className="text-heart-green text-sm">{emailSuccess}</p>}
        <button type="submit" disabled={savingEmail || !newEmail.trim()} className="btn-primary">
          {savingEmail ? 'Saving…' : 'Update email'}
        </button>
      </form>

      <section className="card p-6 space-y-4 ring-1 ring-heart-red/40">
        <h2 className="font-display text-lg text-heart-red">Danger zone</h2>
        <p className="text-sm text-muted">
          Deleting your account permanently removes your profile, crush, messages, matches,
          inventory, and photo. This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ghost !border-heart-red/50 !text-heart-red hover:!bg-heart-red/10"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm text-muted" htmlFor="confirmDelete">
              Type <span className="font-mono text-ink">DELETE</span> to confirm
            </label>
            <input
              id="confirmDelete"
              type="text"
              className="input-field"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
            {deleteError && <p className="text-heart-red text-sm">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="btn-primary !bg-heart-red flex-1"
              >
                {deleting ? 'Deleting…' : 'Permanently delete my account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setConfirmText('')
                  setDeleteError('')
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="font-display text-lg">Account</h2>
        <p className="text-sm text-muted">
          Signed in as <span className="font-semibold text-ink">{user?.email}</span>
        </p>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={signOut} className="btn-ghost !text-ink">
            Sign out
          </button>
          <div className="rounded-2xl border border-midnight-border bg-midnight-surface p-4 text-xs text-muted">
            App version: 1.0.0
          </div>
        </div>
      </section>
    </div>
  )
}