import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

const GAME_OPTIONS = ['Mobile Legends', 'Call of Duty Mobile', 'Free Fire', 'PUBG Mobile', 'Valorant']
const TEAM_OPTIONS = ['Duo', 'Squad']
const GAME_DETAILS = {
  'Mobile Legends': {
    ranks: ['Any rank', 'Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic'],
    positions: ['Any position', 'Roam', 'Jungle', 'Mid Lane', 'Gold Lane', 'EXP Lane'],
  },
  'Call of Duty Mobile': {
    ranks: ['Any rank', 'Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster', 'Legendary'],
    positions: ['Any position', 'Slayer', 'Objective', 'Sniper', 'Support', 'Flex'],
  },
  'Free Fire': {
    ranks: ['Any rank', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Heroic', 'Grandmaster'],
    positions: ['Any position', 'Entry', 'Rusher', 'Sniper', 'Support', 'IGL'],
  },
  'PUBG Mobile': {
    ranks: ['Any rank', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'],
    positions: ['Any position', 'IGL', 'Entry', 'Support', 'Scout', 'Sniper'],
  },
  Valorant: {
    ranks: ['Any rank', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
    positions: ['Any position', 'Duelist', 'Controller', 'Initiator', 'Sentinel', 'Flex'],
  },
}

export default function GameTeammateFinder() {
  const { profile } = useAuth()
  const channelRef = useRef(null)
  const [game, setGame] = useState(GAME_OPTIONS[0])
  const [teamSize, setTeamSize] = useState(TEAM_OPTIONS[0])
  const [region, setRegion] = useState('Any region')
  const [rank, setRank] = useState(GAME_DETAILS[GAME_OPTIONS[0]].ranks[0])
  const [position, setPosition] = useState(GAME_DETAILS[GAME_OPTIONS[0]].positions[0])
  const [note, setNote] = useState('Ready to play and use voice chat')
  const [status, setStatus] = useState('idle')
  const [players, setPlayers] = useState([])
  const [error, setError] = useState('')
  const gameDetails = GAME_DETAILS[game]

  useEffect(() => () => {
    channelRef.current?.untrack()
    channelRef.current?.unsubscribe()
  }, [])

  async function findTeammates() {
    if (!profile?.id) return
    await stopSearching()
    setError('')
    setStatus('searching')
    const channel = supabase.channel(`game-teammates:${game}:${teamSize}`, { config: { presence: { key: profile.id } } })
      .on('presence', { event: 'sync' }, () => {
        const presence = channel.presenceState()
        const matches = Object.values(presence)
          .flat()
          .filter((player) => player.status === 'looking')
          .filter((player) => region === 'Any region' || player.region === region)
        setPlayers(matches)
      })

    channelRef.current = channel
    const result = await channel.subscribe(async (subscriptionStatus) => {
      if (subscriptionStatus === 'SUBSCRIBED') {
        await channel.track({
          user_id: profile.id,
          username: profile.username,
          game,
          teamSize,
          region,
          rank,
          position,
          note: note.trim().slice(0, 120),
          status: 'looking',
        })
      }
    })
    if (result === 'CHANNEL_ERROR' || result === 'TIMED_OUT') {
      setError('Could not connect to the teammate lobby.')
      setStatus('idle')
    }
  }

  async function stopSearching() {
    await channelRef.current?.untrack()
    await channelRef.current?.unsubscribe()
    channelRef.current = null
    setPlayers([])
  }

  async function toggleSearch() {
    if (status === 'searching') {
      await stopSearching()
      setStatus('idle')
    } else {
      await findTeammates()
    }
  }

  return (
    <section className="card p-5 sm:p-6 border border-white/5 bg-[#16191F] shadow-xl rounded-[2rem] space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-black text-ink">Finder Filters</h2>
        {status === 'searching' && (
          <div className="px-2 py-1 rounded-lg bg-heart-green/10 text-heart-green text-[8px] font-black tracking-widest border border-heart-green/20 animate-pulse">
            LIVE MATCHMAKING
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Compact 2-row layout for inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted/50 ml-1">Game</label>
            <select
              value={game}
              onChange={(e) => {
                const g = e.target.value
                setGame(g); setRank(GAME_DETAILS[g].ranks[0]); setPosition(GAME_DETAILS[g].positions[0])
              }}
              disabled={status === 'searching'}
              className="w-full px-3 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-[11px] font-bold text-ink outline-none"
            >
              {GAME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted/50 ml-1">Team</label>
            <select
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              disabled={status === 'searching'}
              className="w-full px-3 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-[11px] font-bold text-ink outline-none"
            >
              {TEAM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted/50 ml-1">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={status === 'searching'}
              className="w-full px-3 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-[11px] font-bold text-ink outline-none"
            >
              <option>Any region</option>
              <option>North America</option><option>Europe</option><option>Asia</option><option>Africa</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted/50 ml-1">Rank</label>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              disabled={status === 'searching'}
              className="w-full px-3 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-[11px] font-bold text-ink outline-none"
            >
              {gameDetails.ranks.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted/50 ml-1">Role</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={status === 'searching'}
              className="w-full px-3 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-[11px] font-bold text-ink outline-none"
            >
              {gameDetails.positions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center ml-1">
             <label className="text-[9px] font-black uppercase tracking-widest text-muted/50">Short Note</label>
             <span className="text-[8px] font-mono text-muted/30">{note.length}/120</span>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 120))}
            disabled={status === 'searching'}
            className="w-full px-3 py-2 bg-[#0F1115] border border-white/10 rounded-xl text-[11px] font-medium text-ink outline-none"
            placeholder="Mic on, chill teammates..."
          />
        </div>
      </div>

      <button
        type="button"
        onClick={toggleSearch}
        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
          status === 'searching'
            ? 'bg-heart-red text-white shadow-lg shadow-heart-red/20'
            : 'bg-heart-green text-[#0F1115] shadow-lg shadow-heart-green/20'
        }`}
      >
        {status === 'searching' ? 'Stop Searching' : 'Find Teammates'}
      </button>

      {error && <p className="text-[10px] text-heart-red text-center font-bold">⚠️ {error}</p>}

      {status === 'searching' && (
        <div className="pt-5 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-ink">Results</h3>
            <span className="text-[9px] font-bold text-heart-green px-2 py-0.5 rounded-full bg-heart-green/10 border border-heart-green/20">
              {players.length} ONLINE
            </span>
          </div>

          {players.length === 0 ? (
            <div className="py-8 text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
              <p className="text-[10px] text-muted italic">Waiting for others to join...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {players.map((player, index) => (
                <div
                  key={`${player.user_id}-${index}`}
                  className={`flex items-center justify-between p-3 rounded-2xl border ${
                    player.user_id === profile.id
                      ? 'border-heart-purple/30 bg-heart-purple/5'
                      : 'border-white/5 bg-[#0F1115]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs shrink-0">
                       {player.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-ink truncate">@{player.username}</p>
                      <p className="text-[8px] text-muted uppercase tracking-tighter truncate">
                        {player.rank} • {player.position}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                     {player.user_id !== profile.id && (
                       <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-ink border border-white/10">
                         INVITE
                       </button>
                     )}
                     <span className="w-1.5 h-1.5 rounded-full bg-heart-green animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}