import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updatePassword, updateEmail, deleteMyAccount } from '../lib/account'

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

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
    </div>
  )
}
