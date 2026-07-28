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

  // Social Media Links
  const [instagram, setInstagram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')

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

    // Load social media links (assuming profile.social_links object or individual columns)
    const social = profile.social_links || {}
    setInstagram(social.instagram ?? profile.instagram ?? '')
    setTwitter(social.twitter ?? profile.twitter ?? '')
    setFacebook(social.facebook ?? profile.facebook ?? '')
    setTiktok(social.tiktok ?? profile.tiktok ?? '')
  }, [profile])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSuccess('')
    setUploading(true)

    try {
      const url = await uploadAvatar(user.id, file)
      setAvatarUrl(url)
    } catch (err) {
      setError(err.message || 'Could not upload avatar image.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Helper to strip URLs/at-signs for clean handle storage
  const cleanHandle = (val) => val.trim().replace(/^https?:\/\/(www\.)?[^/]+\//, '').replace(/^@/, '')

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
      const socialLinksData = {
        instagram: cleanHandle(instagram),
        twitter: cleanHandle(twitter),
        facebook: cleanHandle(facebook),
        tiktok: cleanHandle(tiktok),
      }

      await updateProfile(user.id, {
        avatar_url: avatarUrl || null,
        gender: gender || null,
        relationship_status: relationshipStatus || null,
        age: age ? Number(age) : null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        social_links: socialLinksData,
      })
      await refreshProfile()
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      setError(err.message || 'Could not save profile changes.')
    } finally {
      setSaving(false)
    }
  }

  const bioRemaining = BIO_MAX - bio.length

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <section className="text-center space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Edit Profile</h1>
        <p className="text-muted text-xs sm:text-sm max-w-sm mx-auto">
          Personalize your profile cards to make a great impression on your matches.
        </p>
      </section>

      {/* Main Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
      >
        {/* Avatar Upload Section */}
        <div className="flex items-center gap-5 pb-6 border-b border-white/10">
          <div className="relative group">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center shadow-lg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <span className="text-2xl font-bold font-display text-purple-400">
                  {profile?.username?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}

              {/* Uploading Overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-ink transition-all disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Change Photo'}
            </button>
            <p className="text-[11px] text-muted">JPG, PNG or WEBP up to 5MB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* Gender & Relationship Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="" className="bg-slate-900">Prefer not to say</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g} className="bg-slate-900">
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider" htmlFor="status">
              Relationship Status
            </label>
            <select
              id="status"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              value={relationshipStatus}
              onChange={(e) => setRelationshipStatus(e.target.value)}
            >
              <option value="" className="bg-slate-900">Prefer not to say</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-slate-900">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Age & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              type="number"
              min={18}
              max={120}
              placeholder="18+"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g. Lipa, PH"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-sm placeholder:text-muted/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Bio Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider" htmlFor="bio">
              About You
            </label>
            <span
              className={`text-[11px] font-mono ${
                bioRemaining < 20
                  ? 'text-rose-400 font-bold'
                  : bioRemaining < 50
                  ? 'text-amber-400'
                  : 'text-muted'
              }`}
            >
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="bio"
            rows={4}
            maxLength={BIO_MAX}
            placeholder="Tell potential matches a little about your passions and hobbies..."
            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-sm placeholder:text-muted/40 resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* Social Media Links Section */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Social Links</h3>
            <p className="text-[11px] text-muted/70 mt-0.5">Enter your handles or profile links.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Instagram */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted/60 text-xs font-mono">ig/</span>
              <input
                type="text"
                placeholder="username"
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-xs placeholder:text-muted/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>

            {/* X / Twitter */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted/60 text-xs font-mono">x/</span>
              <input
                type="text"
                placeholder="username"
                className="w-full pl-8 pr-3 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-xs placeholder:text-muted/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
              />
            </div>

            {/* Facebook */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted/60 text-xs font-mono">fb/</span>
              <input
                type="text"
                placeholder="profile name or id"
                className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-xs placeholder:text-muted/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
              />
            </div>

            {/* TikTok */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-muted/60 text-xs font-mono">tt/</span>
              <input
                type="text"
                placeholder="username"
                className="w-full pl-8 pr-3 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-ink text-xs placeholder:text-muted/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs text-center font-medium">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-primary flex-1 py-3 text-sm font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes…</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-5 py-3 text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-ink transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}