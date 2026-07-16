import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadAvatar } from '../lib/profile'

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say']
const STATUS_OPTIONS = ['Single', 'Taken', "It's complicated", 'Prefer not to say']
const BIO_MAX = 300

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [avatarUrl, setAvatarUrl] = useState('')
  const [gender, setGender] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [age, setAge] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!profile) return
    setAvatarUrl(profile.avatar_url ?? '')
    setGender(profile.gender ?? '')
    setRelationshipStatus(profile.relationship_status ?? '')
    setAge(profile.age ?? '')
    setLocation(profile.location ?? '')
    setBio(profile.bio ?? '')
  }, [profile])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadAvatar(user.id, file)
      setAvatarUrl(url)
    } catch (err) {
      setError(err.message || 'Could not upload image.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (age && (Number(age) < 18 || Number(age) > 120)) {
      setError('Age must be between 18 and 120.')
      return
    }

    setSaving(true)
    try {
      await updateProfile(user.id, {
        avatar_url: avatarUrl || null,
        gender: gender || null,
        relationship_status: relationshipStatus || null,
        age: age ? Number(age) : null,
        location: location.trim() || null,
        bio: bio.trim() || null,
      })
      await refreshProfile()
      setSuccess('Profile updated.')
    } catch (err) {
      setError(err.message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl">Edit profile</h1>
        <p className="text-muted text-sm">This is what shows up if you ever get a mutual match.</p>
      </section>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your avatar"
              className="w-16 h-16 rounded-full object-cover ring-1 ring-midnight-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-heart-purple/20 ring-1 ring-heart-purple/40 flex items-center justify-center text-xl font-display">
              {profile?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-ghost !px-4 !py-2 text-sm"
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              className="input-field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Prefer not to say</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className="input-field"
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
            >
              <option value="">Prefer not to say</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              type="number"
              min={18}
              max={120}
              className="input-field"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              type="text"
              placeholder="City, country"
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm text-muted" htmlFor="bio">
              Bio
            </label>
            <span className="text-xs text-muted">
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="bio"
            rows={4}
            maxLength={BIO_MAX}
            className="input-field resize-none"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {error && <p className="text-heart-red text-sm">{error}</p>}
        {success && <p className="text-heart-green text-sm">{success}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => navigate('/profile')} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
