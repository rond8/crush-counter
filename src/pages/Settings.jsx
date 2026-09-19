import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext.jsx'
import { updatePassword, deleteMyAccount } from '../lib/account'
import { getAdsLive, setAdsLive } from '../lib/ads'
import { setupPhoneNotifications } from '../lib/notifications'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = Boolean(profile?.is_admin)

  const { theme, toggleTheme, preferences, setPreference } = useTheme()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [adsLive, setAdsLiveState] = useState(null)
  const [loadingAds, setLoadingAds] = useState(isAdmin)
  const [togglingAds, setTogglingAds] = useState(false)
  const [adsError, setAdsError] = useState('')

  const [enablingNotifs, setEnablingNotifs] = useState(false)
  const [notifError, setNotifError] = useState('')

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

  const handleEnableNotifications = async () => {
    setNotifError('')
    setEnablingNotifs(true)
    try {
      await setupPhoneNotifications(user?.id)
      // setupPhoneNotifications handles internal logic for native vs web
    } catch (err) {
      setNotifError(err.message || 'Could not enable push notifications.')
    } finally {
      setEnablingNotifs(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword.length < 6) return setPasswordError('Password must be at least 6 characters.')
    if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match.')

    setSavingPassword(true)
    try {
      await updatePassword(newPassword)
      setPasswordSuccess('Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteMyAccount(user?.id)
      await signOut()
      navigate('/')
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-32">
      <header className="space-y-1">
        <h1 className="text-4xl font-display font-black text-ink italic">Settings</h1>
        <p className="text-muted text-sm font-mono">{user?.email}</p>
      </header>

      {/* Preferences Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted px-1 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-heart-purple" />
          General Preferences
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PreferenceCard
            title="Appearance"
            desc={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            icon={theme === 'dark' ? '🌙' : '☀️'}
            action={
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-midnight-border/30 text-[10px] font-bold uppercase hover:bg-midnight-border/50 transition-colors"
              >
                Switch
              </button>
            }
          />
          <PreferenceCard
            title="Language"
            desc={preferences.language === 'fil' ? 'Filipino' : 'English'}
            icon="🌐"
            action={
              <select
                value={preferences.language || 'en'}
                onChange={(e) => setPreference('language', e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-heart-purple outline-none cursor-pointer text-right"
              >
                <option value="en">English</option>
                <option value="fil">Filipino</option>
              </select>
            }
          />
        </div>

        <div className="card divide-y divide-midnight-border/30 overflow-hidden">
          <ToggleItem
            title="Sound Effects"
            desc="Play sounds for matches and hearts"
            active={preferences.soundEffects}
            onToggle={() => setPreference('soundEffects', !preferences.soundEffects)}
          />
          <ToggleItem
            title="Compact Mode"
            desc="Hide extra details in lists"
            active={preferences.compactMode}
            onToggle={() => setPreference('compactMode', !preferences.compactMode)}
          />
          <ToggleItem
            title="Item Hints"
            desc="Show explanations for game items"
            active={preferences.showItemHints}
            onToggle={() => setPreference('showItemHints', !preferences.showItemHints)}
          />
        </div>
      </section>

      {/* Security Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted px-1 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-heart-purple" />
          Security
        </h2>
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">🔐</span>
            <h3 className="text-sm font-bold">Update Password</h3>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <input
                type="password"
                placeholder="New Password"
                className="input-field !text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="input-field !text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {passwordError && <p className="text-xs text-heart-red font-medium">{passwordError}</p>}
            {passwordSuccess && <p className="text-xs text-heart-green font-medium">{passwordSuccess}</p>}

            <button
              type="submit"
              disabled={savingPassword || !newPassword}
              className="btn-primary w-full py-3 text-sm"
            >
              {savingPassword ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted px-1 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-heart-purple" />
          Notifications
        </h2>
        <div className="card p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <div>
              <h3 className="text-sm font-bold">Push Notifications</h3>
              <p className="text-[11px] text-muted">Get alerts for mutual matches and hearts</p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            disabled={enablingNotifs}
            className="px-4 py-2 rounded-xl bg-heart-purple/10 text-heart-purple text-xs font-bold hover:bg-heart-purple/20 transition-all border border-heart-purple/20"
          >
            {enablingNotifs ? 'Enabling...' : 'Setup'}
          </button>
        </div>
        {notifError && <p className="text-xs text-heart-red px-2">{notifError}</p>}
      </section>

      {/* Admin Section */}
      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted px-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-heart-purple" />
            Admin Dashboard
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <Link
              to="/admin/admirers"
              className="card p-5 flex items-center justify-between hover:bg-heart-purple/5 transition-colors border-heart-purple/20"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-sm font-bold">Admirer Insights</h3>
                  <p className="text-[10px] text-muted">View users receiving the most hearts.</p>
                </div>
              </div>
              <span className="text-heart-purple text-xl">→</span>
            </Link>

            <Link
              to="/admin/slides"
              className="card p-5 flex items-center justify-between hover:bg-heart-purple/5 transition-colors border-heart-purple/20"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">🎞️</span>
                <div>
                  <h3 className="text-sm font-bold">Manage Slides</h3>
                  <p className="text-[10px] text-muted">Customize the home page slider.</p>
                </div>
              </div>
              <span className="text-heart-purple text-xl">→</span>
            </Link>

            <div className="card p-5 space-y-4 bg-heart-purple/5 border-heart-purple/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Ad Visibility</h3>
                  <p className="text-[10px] text-muted">Force real AdMob ads for all non-premium users.</p>
                </div>
                <button
                  onClick={handleToggleAds}
                  disabled={togglingAds || loadingAds}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    adsLive ? 'bg-heart-green text-midnight' : 'bg-midnight-surface border border-midnight-border text-muted'
                  }`}
                >
                  {togglingAds ? '...' : adsLive ? 'Real Ads: ON' : 'Test Ads Only'}
                </button>
              </div>
              {adsError && <p className="text-xs text-heart-red">{adsError}</p>}
            </div>
          </div>
        </section>
      )}

      {/* Danger Zone */}
      <section className="pt-6 space-y-4">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full p-5 rounded-3xl border-2 border-dashed border-heart-red/20 bg-heart-red/5 text-heart-red text-sm font-bold hover:bg-heart-red/10 transition-all active:scale-[0.98]"
        >
          Delete Account
        </button>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-midnight/95 backdrop-blur-md">
            <div className="card max-w-sm w-full p-8 space-y-6 shadow-2xl ring-2 ring-heart-red/20">
              <div className="text-center space-y-2">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-2xl font-display font-black text-heart-red italic uppercase">Permanently Delete?</h3>
                <p className="text-sm text-muted">This action is final. Type <span className="text-ink font-bold font-mono">DELETE</span> below to confirm.</p>
              </div>

              <input
                type="text"
                placeholder="Type DELETE here"
                className="input-field !text-center !font-black !tracking-widest !bg-heart-red/5 !border-heart-red/20"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="btn-primary !bg-heart-red disabled:opacity-30 flex-1 py-4 font-black italic"
                >
                  {deleting ? 'Deleting...' : 'GOODBYE'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setDeleteError('') }}
                  className="btn-ghost flex-1 font-bold"
                >
                  KEEP IT
                </button>
              </div>
              {deleteError && <p className="text-xs text-heart-red text-center font-bold">{deleteError}</p>}
            </div>
          </div>
        )}
      </section>

      <footer className="pt-12 flex flex-col items-center gap-6">
        <button
          onClick={signOut}
          className="px-8 py-3 rounded-full bg-midnight-surface border border-midnight-border text-sm font-bold hover:text-heart-purple transition-all active:scale-95"
        >
          Sign Out
        </button>
        <div className="text-center space-y-1 opacity-30 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-mono tracking-tighter">CRUSH COUNTER v1.9.3</p>
          <p className="text-[8px] uppercase tracking-[0.2em] font-bold">Made for Lovers & Dreamers</p>
        </div>
      </footer>
    </div>
  )
}

function PreferenceCard({ title, desc, icon, action }) {
  return (
    <div className="card p-4 flex items-center justify-between gap-4 border-midnight-border/50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-midnight-surface flex items-center justify-center text-xl shadow-inner">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-black text-ink italic leading-tight uppercase tracking-tight">{title}</h3>
          <p className="text-[10px] text-muted font-medium">{desc}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function ToggleItem({ title, desc, active, onToggle }) {
  return (
    <div className="flex items-center justify-between p-5 gap-6 hover:bg-midnight-surface/30 transition-colors">
      <div className="space-y-0.5">
        <span className="text-sm font-bold text-ink italic block leading-none">{title}</span>
        <span className="text-[10px] text-muted">{desc}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative flex items-center ${active ? 'bg-heart-purple' : 'bg-midnight-border'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
