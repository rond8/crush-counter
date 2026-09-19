import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getArtFeed, uploadArtwork, likeArtwork } from '../lib/artist'
import { timeAgo } from '../lib/time'
import ImageModal from '../components/ImageModal'

export default function ArtCorner() {
  const { session, profile } = useAuth()
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')

  const [viewingImage, setViewImage] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getArtFeed()
      setFeed(data)
    } catch (err) {
      setError('Could not load art feed.')
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) return
    setUploading(true)
    setError('')
    try {
      await uploadArtwork(selectedFile, caption)
      setCaption('')
      setSelectedFile(null)
      setPreviewUrl(null)
      refresh()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleLike = async (id) => {
    if (!session) return
    try {
      await likeArtwork(id)
      setFeed(prev => prev.map(art => art.id === id ? { ...art, like_count: (art.like_count || 0) + 1 } : art))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-32">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-display font-bold text-ink">🎨 Art Corner</h1>
        <p className="text-muted text-sm max-w-md mx-auto">A creative space for artists to showcase their drawings, paintings, and digital masterpieces.</p>
      </header>

      {/* Upload Section */}
      {session && (
        <section className="card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-4">Share your Masterpiece</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <textarea
                  placeholder="Tell us about your art..."
                  className="input-field h-24 resize-none text-sm"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                <label className="btn-ghost w-full cursor-pointer flex items-center justify-center gap-2 border-dashed border-2">
                  <span>{selectedFile ? 'Change Image' : '📁 Select Artwork'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {previewUrl && (
                <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-lg relative group">
                  <img src={previewUrl} className="w-full h-full object-cover" />
                  <button onClick={() => {setSelectedFile(null); setPreviewUrl(null)}} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-heart-red font-bold">{error}</p>}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="btn-primary w-full md:w-auto px-10 py-3 shadow-glow-purple"
            >
              {uploading ? '🎨 Publishing...' : 'Post Artwork'}
            </button>
          </form>
        </section>
      )}

      {/* Art Feed */}
      <section className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {loading ? (
           <div className="text-center py-20 text-muted">Loading the gallery...</div>
        ) : feed.length === 0 ? (
           <div className="text-center py-20 text-muted italic col-span-full">The gallery is empty. Be the first to post!</div>
        ) : (
          feed.map((art) => (
            <div
              key={art.id}
              className="break-inside-avoid card overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer"
              onClick={() => setViewImage(art.image_url)}
            >
              <div className="relative">
                <img src={art.image_url} className="w-full h-auto object-cover max-h-[500px]" alt={art.caption} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                   <p className="text-white text-xs leading-relaxed line-clamp-3">{art.caption}</p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <Link to={`/u/${art.profiles.username}`} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-heart-purple/20 flex items-center justify-center text-[10px] font-bold">
                    {art.profiles.username[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-ink">@{art.profiles.username}</span>
                </Link>

                <div className="flex items-center gap-3">
                   <button onClick={() => handleLike(art.id)} className="flex items-center gap-1 text-muted hover:text-heart-red transition-colors">
                     <span className="text-sm">❤️</span>
                     <span className="text-[10px] font-bold">{art.like_count || 0}</span>
                   </button>
                   <span className="text-[9px] text-muted">{timeAgo(art.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {viewingImage && (
        <ImageModal src={viewingImage} onClose={() => setViewImage(null)} />
      )}
    </div>
  )
}
