import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDailyFeed, createDailyPost, canPostToday, likeDailyPost, addDailyComment, getDailyComments } from '../lib/dailyPosts'
import { timeAgo } from '../lib/time'
import ImageModal from '../components/ImageModal'

export default function DailyFeed() {
  const { session, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [error, setError] = useState('')

  const [viewingImage, setViewImage] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [feed, can] = await Promise.all([getDailyFeed(), canPostToday()])
      setPosts(feed)
      setAllowed(can)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await createDailyPost(file, caption)
      setFile(null)
      setPreview(null)
      setCaption('')
      refresh()
    } catch (err) {
      setError(err.message || 'Post failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-32">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-display font-black text-ink italic">Daily Snap 📸</h1>
        <p className="text-muted text-sm max-w-sm mx-auto">Upload 1 photo every 24 hours. Everything vanishes after a day.</p>
      </header>

      {/* Upload Section */}
      {session && allowed ? (
        <section className="card p-6 bg-heart-purple/5 border-heart-purple/20">
          <form onSubmit={handlePost} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
               <div className="flex-1 space-y-3">
                  <textarea
                    placeholder="What's happening right now?"
                    className="input-field h-20 resize-none text-sm"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                  <label className="btn-ghost w-full cursor-pointer flex items-center justify-center gap-2 border-dashed border-2">
                    <span>{file ? 'Change Photo' : '📷 Take/Pick Photo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
               </div>
               {preview && (
                 <div className="w-full sm:w-40 h-40 rounded-2xl overflow-hidden border-2 border-heart-purple/30 relative shadow-xl">
                    <img src={preview} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => {setFile(null); setPreview(null)}} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
                 </div>
               )}
            </div>
            {error && <p className="text-[10px] text-heart-red font-bold">{error}</p>}
            <button
              disabled={uploading || !file}
              className="btn-primary w-full py-3 shadow-glow-purple font-black uppercase tracking-widest text-xs"
            >
              {uploading ? 'Uploading to Cloud...' : 'Publish to Feed'}
            </button>
          </form>
        </section>
      ) : session && !allowed ? (
        <div className="card p-6 text-center bg-white/5 border-white/10 italic text-muted text-sm">
           ✨ You've shared your snap for today! Check back tomorrow.
        </div>
      ) : null}

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
             {[1,2].map(i => <div key={i} className="h-96 bg-white/5 rounded-3xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-muted italic">
             The feed is empty. Be the first to share a moment!
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onImageClick={setViewImage} />
          ))
        )}
      </div>

      {viewingImage && <ImageModal src={viewingImage} onClose={() => setViewImage(null)} />}
    </div>
  )
}

function PostCard({ post, onImageClick }) {
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [liking, setLiking] = useState(false)

  const loadComments = async () => {
    try {
      const data = await getDailyComments(post.id)
      setComments(data)
    } catch {}
  }

  const handleLike = async () => {
    setLiking(true)
    try {
      await likeDailyPost(post.id)
      post.like_count += 1 // Optimistic
    } finally {
      setLiking(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      await addDailyComment(post.id, newComment)
      setNewComment('')
      loadComments()
    } catch {}
  }

  return (
    <article className="card overflow-hidden bg-midnight-surface/50">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
         <Link to={`/u/${post.profiles.username}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-heart-purple/10 flex items-center justify-center font-bold text-heart-purple">
               {post.profiles.username[0].toUpperCase()}
            </div>
            <div>
               <p className="text-sm font-black">@{post.profiles.username}</p>
               <p className="text-[10px] text-muted">{timeAgo(post.created_at)}</p>
            </div>
         </Link>
      </div>

      {/* Photo */}
      <div className="relative aspect-square sm:aspect-video cursor-pointer" onClick={() => onImageClick(post.image_url)}>
         <img src={post.image_url} className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
         {post.caption && <p className="text-sm text-ink/90 leading-relaxed">{post.caption}</p>}

         <div className="flex items-center gap-4 pt-2">
            <button onClick={handleLike} disabled={liking} className="flex items-center gap-1.5 text-muted hover:text-heart-red transition-colors">
               <span className="text-lg">❤️</span>
               <span className="text-xs font-bold">{post.like_count || 0}</span>
            </button>
            <button onClick={() => { setShowComments(!showComments); if(!showComments) loadComments(); }} className="flex items-center gap-1.5 text-muted hover:text-heart-purple transition-colors">
               <span className="text-lg">💬</span>
               <span className="text-xs font-bold">Comments</span>
            </button>
         </div>

         {/* Comments Area */}
         {showComments && (
           <div className="pt-4 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                 {comments.map(c => (
                   <div key={c.id} className="text-xs">
                      <span className="font-black mr-2">@{c.profiles.username}</span>
                      <span className="text-muted">{c.body}</span>
                   </div>
                 ))}
                 {comments.length === 0 && <p className="text-[10px] text-muted italic">No comments yet.</p>}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                 <input
                   type="text"
                   placeholder="Write a comment..."
                   className="input-field !py-1.5 !text-xs"
                   value={newComment}
                   onChange={(e) => setNewComment(e.target.value)}
                 />
                 <button className="btn-primary !py-1.5 !px-4 text-[10px] uppercase font-black">Send</button>
              </form>
           </div>
         )}
      </div>
    </article>
  )
}
