import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getFriendsList,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  removeFriend,
  getDiscoverProfiles,
  pokeUser,
  getFriendLevel,
} from '../lib/friends'
import UsernameSearchInput from '../components/UsernameSearchInput'
import { isOnline } from '../lib/presence'
import { timeAgo } from '../lib/time'
import { handleImageError } from '../lib/utils'

export default function Friends() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('requests') // requests | friends | discover

  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [discover, setDiscover] = useState([])
  const [loading, setLoading] = useState(true)

  const [targetUsername, setTargetUsername] = useState('')
  const [addingUser, setAddingUser] = useState(null) // Tracks which username is being added
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [fList, rList, dList] = await Promise.all([
        getFriendsList(),
        getPendingFriendRequests(),
        getDiscoverProfiles(),
      ])
      setFriends(fList)
      setRequests(rList)
      setDiscover(dList)
    } catch (err) {
      setError('Could not load friends.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleAddFriend = async (e, username = null) => {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')
    const clean = (username || targetUsername).trim().toLowerCase()
    if (!clean) return
    if (clean === profile?.username) return setError("You can't add yourself.")

    if (username) setAddingUser(clean)
    else setSending(true)

    try {
      await sendFriendRequest(clean)
      setSuccess(`Request sent to @${clean}!`)
      setTargetUsername('')

      // Update local state to show "Added" immediately
      if (username) {
        setDiscover(prev => prev.map(p => p.username === clean ? { ...p, requested: true } : p))
      }

      refresh()
    } catch (err) {
      setError(err.message || 'Could not send request.')
    } finally {
      setSending(false)
      setAddingUser(null)
    }
  }

  const handleAccept = async (id) => {
    try {
      await acceptFriendRequest(id)
      refresh()
    } catch (err) { alert(err.message) }
  }

  const handleReject = async (id) => {
    try {
      await rejectFriendRequest(id)
      refresh()
    } catch (err) { alert(err.message) }
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this friend?')) return
    try {
      await removeFriend(id)
      refresh()
    } catch (err) { alert(err.message) }
  }

  const handlePoke = async (username) => {
    try {
      await pokeUser(username)
      alert(`You poked @${username}! 👉`)
    } catch (err) { alert(err.message) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-32">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-ink italic">Friends</h1>
          <p className="text-muted text-sm font-medium">Connect and interact with your community.</p>
        </div>
        <div className="flex gap-2 bg-midnight-surface p-1 rounded-2xl border border-midnight-border">
          <TabButton id="requests" label="Requests" count={requests.length} active={activeTab} onClick={setActiveTab} />
          <TabButton id="friends" label="Friends" count={friends.length} active={activeTab} onClick={setActiveTab} />
          <TabButton id="discover" label="Discover" active={activeTab} onClick={setActiveTab} />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="min-h-[60vh]">
        {activeTab === 'requests' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
               <h2 className="text-lg font-bold text-ink">Friend Requests</h2>
               <span className="text-xs font-black text-heart-purple uppercase tracking-widest">{requests.length} Pending</span>
            </div>

            {requests.length === 0 ? (
              <div className="card p-12 text-center space-y-4 border-dashed border-2">
                 <div className="text-4xl">👋</div>
                 <p className="text-muted text-sm">No pending requests. Why not discover someone new?</p>
                 <button onClick={() => setActiveTab('discover')} className="btn-primary !px-6 !py-2 text-xs">Browse People</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {requests.map((r) => (
                  <div key={r.id} className="card overflow-hidden flex flex-col group hover:border-heart-purple/40 transition-all">
                    <div className="aspect-square bg-midnight-surface flex items-center justify-center text-3xl font-black text-heart-purple border-b border-midnight-border group-hover:bg-heart-purple/5 transition-colors">
                      {r.from_username[0].toUpperCase()}
                    </div>
                    <div className="p-3 space-y-3">
                      <p className="text-sm font-bold truncate">@{r.from_username}</p>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleAccept(r.id)} className="btn-primary w-full !py-2 text-[10px] font-black uppercase">Confirm</button>
                        <button onClick={() => handleReject(r.id)} className="btn-ghost w-full !py-2 text-[10px] font-black uppercase">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'friends' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between bg-midnight-surface p-4 rounded-2xl border border-midnight-border">
               <div className="relative flex-1 max-w-sm">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
                  <input type="text" placeholder="Search friends..." className="w-full pl-10 pr-4 py-2 bg-midnight border border-midnight-border rounded-xl text-sm focus:outline-none focus:border-heart-purple" />
               </div>
               <button onClick={() => setActiveTab('discover')} className="text-xs font-bold text-heart-purple hover:underline ml-4 whitespace-nowrap">Find Friends</button>
            </div>

            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-24 bg-midnight-surface rounded-2xl animate-pulse" />)}
               </div>
            ) : friends.length === 0 ? (
              <div className="card p-12 text-center text-muted text-sm italic border-dashed border-2">
                You haven't added any friends yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {friends.map((f) => (
                  <div key={f.id} className="card p-4 flex items-center justify-between group hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {f.avatar_url ? (
                          <>
                            <img
                              src={f.avatar_url}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-midnight"
                              onError={handleImageError}
                            />
                            <div className="avatar-fallback hidden w-14 h-14 rounded-full bg-gradient-to-br from-heart-purple/20 to-heart-red/20 border border-white/5 items-center justify-center font-black text-lg">
                              {f.username[0].toUpperCase()}
                            </div>
                          </>
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-heart-purple/20 to-heart-red/20 border border-white/5 flex items-center justify-center font-black text-lg">
                            {f.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-midnight rounded-full ${isOnline(f.last_seen) ? 'bg-heart-green' : 'bg-slate-500'}`} />
                      </div>
                      <div className="min-w-0">
                        <Link to={`/u/${f.username}`} className="text-sm font-black hover:text-heart-purple transition-colors truncate block flex items-center gap-1.5">
                          @{f.username}
                          <span
                            className="text-[9px] px-1 rounded bg-white/5 font-mono"
                            style={{ color: getFriendLevel(f.points).color }}
                          >
                            Lv.{getFriendLevel(f.points).lv}
                          </span>
                        </Link>
                        <p className="text-[10px] text-muted font-medium flex items-center gap-1">
                          {getFriendLevel(f.points).label} • {isOnline(f.last_seen) ? 'Active now' : `Last seen ${timeAgo(f.last_seen)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handlePoke(f.username)} className="p-2 text-muted hover:text-heart-purple transition-colors" title="Poke">👉</button>
                      <Link to={`/chat/${f.username}`} className="p-2 text-muted hover:text-heart-purple transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </Link>
                      <button onClick={() => handleRemove(f.id)} className="p-2 text-muted hover:text-heart-red transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'discover' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
               <h2 className="text-lg font-bold text-ink">People You May Know</h2>
               <button onClick={refresh} className="text-[10px] font-black text-heart-purple uppercase tracking-widest hover:underline">Refresh</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {discover.map(p => (
                 <div key={p.id} className="card p-4 flex flex-col items-center text-center space-y-4 group transition-all hover:bg-white/5">
                    <Link to={`/u/${p.username}`} className="relative">
                       {p.avatar_url ? (
                         <>
                           <img
                             src={p.avatar_url}
                             className="w-20 h-20 rounded-full object-cover ring-4 ring-midnight shadow-xl"
                             onError={handleImageError}
                           />
                           <div className="avatar-fallback hidden w-20 h-20 rounded-full bg-gradient-to-tr from-heart-purple/10 to-heart-red/10 border border-white/5 items-center justify-center text-3xl font-black">
                             {p.username[0].toUpperCase()}
                           </div>
                         </>
                       ) : (
                         <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-heart-purple/10 to-heart-red/10 border border-white/5 flex items-center justify-center text-3xl font-black">
                           {p.username[0].toUpperCase()}
                         </div>
                       )}
                    </Link>
                    <div className="space-y-1 w-full">
                       <Link to={`/u/${p.username}`} className="text-sm font-black hover:text-heart-purple transition-colors block truncate">@{p.username}</Link>
                       <p className="text-[10px] text-muted line-clamp-1 h-4">{p.bio || 'New member'}</p>
                    </div>
                    <button
                      onClick={(e) => handleAddFriend(null, p.username)}
                      disabled={addingUser === p.username || p.requested}
                      className={`w-full !py-2 text-[10px] font-black uppercase shadow-lg group-hover:scale-105 transition-transform ${
                        p.requested ? 'btn-ghost border-heart-green text-heart-green opacity-80' : 'btn-primary'
                      }`}
                    >
                      {addingUser === p.username ? '...' : p.requested ? 'Requested' : 'Add Friend'}
                    </button>
                 </div>
               ))}
            </div>
          </section>
        )}
      </div>

      {/* Manual Search Footer */}
      <section className="pt-10 border-t border-midnight-border">
         <div className="card p-6 bg-gradient-to-br from-heart-purple/5 to-transparent">
            <h3 className="text-sm font-black uppercase tracking-widest text-ink mb-4">Search by Username</h3>
            <form onSubmit={handleAddFriend} className="flex gap-2">
              <div className="flex-1">
                <UsernameSearchInput value={targetUsername} onChange={setTargetUsername} excludeUsername={profile?.username} />
              </div>
              <button type="submit" disabled={sending || !targetUsername.trim()} className="btn-primary !px-8 shrink-0">Add</button>
            </form>
         </div>
      </section>
    </div>
  )
}

function TabButton({ id, label, count, active, onClick }) {
  const isActive = active === id
  return (
    <button
      onClick={() => onClick(id)}
      className={`relative px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all duration-300
        ${isActive ? 'bg-heart-purple text-white shadow-lg' : 'text-muted hover:text-ink hover:bg-white/5'}
      `}
    >
      <span className="flex items-center gap-2">
        {label}
        {count > 0 && (
          <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold shadow-sm
            ${isActive ? 'bg-white text-heart-purple' : 'bg-heart-red text-white'}
          `}>
            {count}
          </span>
        )}
      </span>
    </button>
  )
}
