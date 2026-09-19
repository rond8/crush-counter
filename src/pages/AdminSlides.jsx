import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function AdminSlides() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    priority: 0,
    is_active: true
  })

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/')
      return
    }
    fetchSlides()
  }, [profile, authLoading, navigate])

  async function fetchSlides() {
    setLoading(true)
    const { data, error } = await supabase
      .from('home_slides')
      .select('*')
      .order('priority', { ascending: true })

    if (!error && data) setSlides(data)
    setLoading(false)
  }

  const handleEdit = (slide) => {
    setEditingId(slide.id)
    setFormData(slide)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      image_url: '',
      button_text: '',
      button_link: '',
      priority: 0,
      is_active: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingId) {
        const { error } = await supabase
          .from('home_slides')
          .update(formData)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('home_slides')
          .insert([formData])
        if (error) throw error
      }

      handleCancel()
      await fetchSlides()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    const { error } = await supabase.from('home_slides').delete().eq('id', id)
    if (!error) fetchSlides()
  }

  if (loading || authLoading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-ink italic">Manage Slides</h1>
          <p className="text-muted text-sm">Create and edit the homepage slider content.</p>
        </div>
        <Link to="/settings" className="btn-secondary px-4 py-2 text-xs">Back</Link>
      </header>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 border-heart-purple/20 bg-heart-purple/5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-heart-purple">
          {editingId ? 'Edit Slide' : 'New Slide'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted ml-1">Title</label>
            <input
              required
              className="input-field !py-2"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted ml-1">Image URL</label>
            <input
              className="input-field !py-2"
              placeholder="https://..."
              value={formData.image_url}
              onChange={e => setFormData({...formData, image_url: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-muted ml-1">Description</label>
          <textarea
            className="input-field !py-2 min-h-[60px]"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted ml-1">Button Text</label>
            <input
              className="input-field !py-2"
              value={formData.button_text}
              onChange={e => setFormData({...formData, button_text: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted ml-1">Button Link</label>
            <input
              className="input-field !py-2"
              placeholder="/dashboard or https://..."
              value={formData.button_link}
              onChange={e => setFormData({...formData, button_link: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted ml-1">Priority (Order)</label>
            <input
              type="number"
              className="input-field !py-2"
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
            />
            <span className="text-xs font-bold uppercase text-muted">Active</span>
          </label>
          <div className="flex-1" />
          {editingId && (
            <button type="button" onClick={handleCancel} className="btn-ghost text-xs">Cancel</button>
          )}
          <button type="submit" disabled={saving} className="btn-primary py-2 px-8 text-xs font-black italic uppercase">
            {saving ? 'Saving...' : editingId ? 'Update Slide' : 'Create Slide'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted px-1">Existing Slides</h2>
        <div className="grid gap-4">
          {slides.map(slide => (
            <div key={slide.id} className={`card p-4 flex gap-4 items-center ${!slide.is_active && 'opacity-50'}`}>
              {slide.image_url && (
                <img src={slide.image_url} className="w-16 h-10 rounded-lg object-cover bg-midnight-surface" />
              )}
              <div className="flex-1">
                <h3 className="text-sm font-bold leading-tight">{slide.title}</h3>
                <p className="text-[10px] text-muted line-clamp-1">{slide.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(slide)} className="p-2 hover:text-heart-purple transition-colors">✏️</button>
                <button onClick={() => handleDelete(slide.id)} className="p-2 hover:text-heart-red transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
