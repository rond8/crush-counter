import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile, uploadAvatar, updateUsername } from '../lib/profile'
import { calculateAge } from '../lib/age'
import { searchArtists } from '../lib/music'

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say']
const STATUS_OPTIONS = ['Single', 'Taken', "It's complicated", 'Prefer not to say']
const BIO_MAX = 300
const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function EditProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [gender, setGender] = useState('')
  const [relationshipStatus, setRelationshipStatus] = useState('')
  const [birthday, setBirthday] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [likes, setLikes] = useState('')
  const [favoriteArtist, setFavoriteArtist] = useState('')

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
    setUsername(profile.username ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
    setGender(profile.gender ?? '')
    setRelationshipStatus(profile.relationship_status ?? '')
    setBirthday(profile.birthday ?? '')
    setLocation(profile.location ?? '')
    setBio(profile.bio ?? '')
    setHobbies(profile.hobbies ?? '')
    setLikes(profile.likes ?? '')
    setFavoriteArtist(profile.favorite_artist ?? '')

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

  const handleRemovePhoto = () => {
    setAvatarUrl('')
    setError('')
    setSuccess('')
  }

  const cleanHandle = (val) => val.trim().replace(/^https?:\/\/(www\.)?[^/]+\//, '').replace(/^@/, '')

  const [artistQuery, setArtistQuery] = useState('')
  const [artistResults, setArtistResults] = useState([])
  const [searchingArtist, setSearchingArtist] = useState(false)

  const handleArtistSearch = async (val) => {
    setArtistQuery(val)
    if (val.trim().length < 2) {
      setArtistResults([])
      return
    }
    setSearchingArtist(true)
    const results = await searchArtists(val)
    setArtistResults(results)
    setSearchingArtist(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const cleanUsername = username.trim().toLowerCase()
    if (!USERNAME_RE.test(cleanUsername)) {
      setError('Username must be 3-20 characters: lowercase letters, numbers, underscores.')
      return
    }

    const computedAge = calculateAge(birthday)
    if (birthday && (computedAge === null || computedAge < 18 || computedAge > 120)) {
      setError('You must be at least 18 years old.')
      return
    }

    setSaving(true)
    try {
      if (cleanUsername !== profile?.username) {
        await updateUsername(user.id, cleanUsername)
      }

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
        age: computedAge,
        birthday: birthday || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        hobbies: hobbies.trim() || null,
        likes: likes.trim() || null,
        favorite_artist: favoriteArtist.trim() || null,
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
  const usernameChanged = username.trim().toLowerCase() !== (profile?.username ?? '')

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <section className="text-center space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">Edit Profile</h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
            Personalize your profile cards to make a great impression on your matches.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="bg-[#5F636F] p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6"
        >
          <div className="flex items-center gap-5 pb-6 border-b border-white/10">
            <div className="relative group">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="text-2xl font-bold font-display text-white/80">
                    {(username || profile?.username)?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Change Photo'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-red-500/20 text-white/80 hover:text-red-400 transition-all disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-white/60">JPG, PNG or WEBP up to 5MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-white uppercase tracking-wider" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm font-mono">@</span>
              <input
                id="username"
                type="text"
                className="w-full pl-8 pr-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                autoComplete="off"
              />
            </div>
            <p className={`text-[11px] ${usernameChanged ? 'text-amber-300' : 'text-white/60'}`}>
              {usernameChanged
                ? "Changing this updates where you're found."
                : '3-20 characters: lowercase letters, numbers, underscores.'}
            </p>
          </div>

          {/* Gender & Relationship Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
              >
                <option value="" className="bg-[#2D323E]">Prefer not to say</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g} className="bg-[#2D323E]">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider" htmlFor="status">
                Relationship Status
              </label>
              <select
                id="status"
                className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all appearance-none"
                value={relationshipStatus}
                onChange={(e) => setRelationshipStatus(e.target.value)}
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
              >
                <option value="" className="bg-[#2D323E]">Prefer not to say</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-[#2D323E]">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Age & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider" htmlFor="birthday">
                Birthday
              </label>
              <input
                id="birthday"
                type="date"
                className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-white/20"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Lipa, PH"
                className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-white uppercase tracking-wider" htmlFor="bio">
                About You
              </label>
              <span className="text-[10px] font-mono text-white/50">{bio.length}/{BIO_MAX}</span>
            </div>
            <textarea
              id="bio"
              rows={4}
              maxLength={BIO_MAX}
              placeholder="Tell potential matches a little about your passions..."
              className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm placeholder:text-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Interests & Hobbies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Hobbies
              </label>
              <input
                type="text"
                placeholder="e.g. Hiking, Gaming, Cooking"
                className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Interests / Likes
              </label>
              <input
                type="text"
                placeholder="e.g. Sci-Fi, Dogs, Pizza"
                className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
              />
            </div>
          </div>

          {/* Favorite Artist with Search */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Favorite Artist
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search for an artist..."
                  className="w-full px-3.5 py-2.5 bg-[#2D323E] border-none rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                  value={artistQuery}
                  onChange={(e) => handleArtistSearch(e.target.value)}
                />
                {searchingArtist && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin inline-block" />
                  </div>
                )}
              </div>
              <input
                type="text"
                readOnly
                placeholder="Selected Artist"
                className="w-1/3 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none font-bold"
                value={favoriteArtist}
              />
            </div>

            {artistResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#2D323E] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {artistResults.map((artist, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFavoriteArtist(artist.name)
                      setArtistResults([])
                      setArtistQuery('')
                    }}
                    className="w-full text-left px-4 py-3 text-xs text-white hover:bg-white/5 border-b border-white/5 last:border-none flex justify-between items-center group"
                  >
                    <span>{artist.name}</span>
                    <span className="text-[9px] uppercase tracking-tighter text-white/30 group-hover:text-white/60">
                      {artist.genre}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || uploading || !username.trim()}
              className="bg-white text-slate-800 flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-[0.98]"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 py-3 text-sm font-bold rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-center text-xs text-red-400 font-bold">{error}</p>}
          {success && <p className="text-center text-xs text-green-400 font-bold">{success}</p>}
        </form>
      </div>
    </div>
  )
}
