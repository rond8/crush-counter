import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMatches } from '../lib/crush'
import { supabase } from '../supabaseClient'

export default function PurpleHeartRoom() {
  const { profile } = useAuth()
  const channelRef = useRef(null)
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState('')
  const [roomPhase, setRoomPhase] = useState('idle')
  const [present, setPresent] = useState([])
  const [glows, setGlows] = useState([])
  const [notes, setNotes] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getMatches().then((items) => {
      setMatches(items)
      if (items[0]?.username) setSelectedMatch(items[0].username)
    }).catch(() => setError('Could not load your mutual matches.'))
  }, [])

  const roomKey = useMemo(() => {
    if (!profile?.id || !selectedMatch) return null
    return [profile.username, selectedMatch].sort().join(':')
  }, [profile?.id, profile?.username, selectedMatch])

  useEffect(() => {
    if (!roomKey || !profile?.id) return undefined
    let mounted = true
    setRoomPhase('connecting')
    setError('')
    setGlows([])
    setNotes([])
    const channel = supabase.channel(`purple-heart:${roomKey}`, { config: { presence: { key: profile.id } } })
      .on('presence', { event: 'sync' }, () => {
        if (!mounted) return
        setPresent(Object.values(channel.presenceState()).flat())
        setRoomPhase('ready')
      })
      .on('broadcast', { event: 'touch' }, ({ payload }) => {
        if (!mounted || payload.user_id === profile.id) return
        setGlows((items) => [...items.slice(-7), { ...payload, id: `${Date.now()}-${Math.random()}` }])
      })
      .on('broadcast', { event: 'note' }, ({ payload }) => {
        if (mounted) setNotes((items) => [...items.slice(-19), payload])
      })

    channelRef.current = channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ user_id: profile.id, username: profile.username, role: 'match' })
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { setError('Could not open the shared room.'); setRoomPhase('idle') }
    })

    return () => {
      mounted = false
      channel.untrack()
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomKey, profile?.id, profile?.username])

  async function sendTouch(event) {
    if (!channelRef.current || roomPhase !== 'ready') return
    const rect = event.currentTarget.getBoundingClientRect()
    const payload = { user_id: profile.id, username: profile.username, x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }
    setGlows((items) => [...items.slice(-7), { ...payload, id: `${Date.now()}-${Math.random()}` }])
    await channelRef.current.send({ type: 'broadcast', event: 'touch', payload })
  }

  async function submitNote(event) {
    event.preventDefault()
    const body = draft.trim().slice(0, 180)
    if (!body || !channelRef.current) return
    const payload = { user_id: profile.id, username: profile.username, body, id: `${Date.now()}-${Math.random()}` }
    setNotes((items) => [...items.slice(-19), payload])
    setDraft('')
    await channelRef.current.send({ type: 'broadcast', event: 'note', payload })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-7 animate-fade-in">
      <Link to="/dashboard" className="text-xs font-bold text-heart-purple hover:underline">← Back to Dashboard</Link>
      <section className="relative overflow-hidden rounded-3xl border border-heart-purple/30 bg-gradient-to-br from-heart-purple/20 via-heart-red/10 to-transparent p-7 sm:p-10"><div className="relative max-w-2xl space-y-3"><span className="inline-flex items-center gap-2 rounded-full border border-heart-purple/30 bg-heart-purple/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-heart-purple">💜 Mutual space</span><h1 className="font-display text-4xl sm:text-5xl font-black text-ink">Your shared purple heart.</h1><p className="text-sm leading-relaxed text-muted">Open a room with someone who chose you back. Touch the space to send a glow, or leave a little note for them.</p></div><div className="absolute -right-5 -bottom-10 text-[10rem] opacity-10" aria-hidden="true">💜</div></section>

      {matches.length === 0 ? <div className="card p-10 text-center space-y-3"><p className="text-4xl">💜</p><h2 className="font-display text-xl font-bold text-ink">No mutual match yet</h2><p className="text-sm text-muted">When someone sends a heart back, your shared room will appear here.</p><Link to="/dashboard" className="btn-primary inline-flex">Find your crush</Link></div> : <>
        <section className="card p-5 border border-white/10 space-y-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-muted">Choose a room</p><h2 className="font-display text-xl font-black text-ink mt-1">Mutual matches</h2></div><span className="text-xs text-heart-purple font-bold">{matches.length} connected</span></div><select value={selectedMatch} onChange={(event) => setSelectedMatch(event.target.value)} className="input-field w-full bg-midnight">{matches.map((match) => <option key={match.username} value={match.username}>@{match.username}</option>)}</select><p className="text-xs text-muted">Room status: <span className={roomPhase === 'ready' ? 'text-heart-green font-bold' : 'text-heart-yellow'}>{roomPhase === 'ready' ? `${present.length} present` : roomPhase}</span></p></section>
        {error && <p className="text-xs text-heart-red">{error}</p>}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start"><div className="space-y-4"><div onClick={sendTouch} className="relative min-h-[360px] cursor-crosshair overflow-hidden rounded-3xl border border-heart-purple/30 bg-[radial-gradient(circle_at_center,rgba(181,123,255,0.2),transparent_60%),#160C22] shadow-[0_0_45px_rgba(181,123,255,0.12)]"><div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(181,123,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(181,123,255,0.2)_1px,transparent_1px)] bg-[size:42px_42px]" /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-7xl opacity-20 animate-pulse">💜</span></div>{glows.map((glow) => <span key={glow.id} className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping text-2xl" style={{ left: `${glow.x}%`, top: `${glow.y}%` }}>✨</span>)}<p className="absolute bottom-4 left-0 right-0 text-center text-[10px] uppercase tracking-[0.2em] text-heart-purple/70">Touch anywhere to send a glow</p></div><form onSubmit={submitNote} className="flex gap-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={180} className="input-field flex-1 bg-midnight" placeholder="Write something for your match..." /><button className="btn-primary !px-5" disabled={!draft.trim() || roomPhase !== 'ready'}>Send</button></form></div><aside className="card p-5 border border-white/10 space-y-4"><div><p className="text-xs font-black uppercase tracking-widest text-heart-purple">Shared notes</p><p className="text-xs text-muted mt-1">Only you and @{selectedMatch} can see this room.</p></div>{notes.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-muted">Your first note is waiting.</p> : <div className="space-y-2 max-h-80 overflow-y-auto">{notes.map((note) => <div key={note.id} className={`rounded-xl p-3 ${note.user_id === profile.id ? 'bg-heart-purple/15 ml-4' : 'bg-white/[0.05] mr-4'}`}><p className="text-[10px] font-bold text-heart-purple">@{note.username}</p><p className="mt-1 text-xs leading-relaxed text-ink">{note.body}</p></div>)}</div>}</aside></section>
      </>}
    </div>
  )
}