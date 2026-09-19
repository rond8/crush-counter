import { useEffect, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { getGameLeaderboard, getGameQualification, recordGamePlay, recordGameScore } from '../lib/gameLeaderboards'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const PIECES = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }

export default function ChessGamePage() {
  const { profile } = useAuth()
  const channelRef = useRef(null)
  const roleRef = useRef(null)
  const [game, setGame] = useState(new Chess(STARTING_FEN))
  const [mode, setMode] = useState('online')
  const [phase, setPhase] = useState('idle')
  const [opponent, setOpponent] = useState(null)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('Find an opponent to start')
  const [searchError, setSearchError] = useState('')
  const [scoreSaved, setScoreSaved] = useState(false)
  const [leaderboardVersion, setLeaderboardVersion] = useState(0)

  useEffect(() => {
    recordGamePlay('chess')
    return () => {
      channelRef.current?.untrack()
      channelRef.current?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (mode !== 'computer' || phase !== 'playing' || game.turn() !== 'b' || game.isGameOver()) return undefined
    const timer = window.setTimeout(() => {
      const nextGame = new Chess(game.fen())
      const moves = nextGame.moves({ verbose: true })
      nextGame.move(moves[Math.floor(Math.random() * moves.length)])
      setGame(nextGame)
      setStatus(nextGame.isGameOver() ? getResult(nextGame, 'You', 'Computer') : 'Your move')
      saveFinishedScore(nextGame, 'You', 'Computer', null)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [game, mode, phase])

  async function findOpponent() {
    if (!profile?.id) return
    await leaveLobby()
    setSearchError('')
    setPhase('searching')
    setMode('online')
    const channel = supabase.channel('chess-online-lobby', { config: { presence: { key: profile.id } } })
      .on('presence', { event: 'sync' }, () => {
        const presence = channel.presenceState()
        const players = Object.values(presence).flat().filter((player) => player.user_id !== profile.id && player.status === 'searching')
        const player = players[0]
        if (!player || opponent) return
        const hostId = [profile.id, player.user_id].sort()[0]
        roleRef.current = profile.id === hostId ? 'host' : 'guest'
        setOpponent(player)
        setPhase('playing')
        setStatus(roleRef.current === 'host' ? 'Your move' : 'Opponent moves first')
        channel.send({ type: 'broadcast', event: 'chess', payload: { type: 'match-start', hostId } })
      })
      .on('broadcast', { event: 'chess' }, ({ payload }) => {
        if (payload.type === 'move') {
          setGame(new Chess(payload.fen))
          setSelected(null)
          setStatus(payload.gameOver ? getResult(new Chess(payload.fen), profile?.username, opponent?.username) : 'Your move')
          if (payload.gameOver) saveFinishedScore(new Chess(payload.fen), profile?.username, opponent?.username, roleRef.current)
        }
      })
    channelRef.current = channel
    const result = await channel.subscribe(async (subscriptionStatus) => {
      if (subscriptionStatus === 'SUBSCRIBED') await channel.track({ user_id: profile.id, username: profile.username, status: 'searching' })
    })
    if (result === 'CHANNEL_ERROR' || result === 'TIMED_OUT') {
      setSearchError('Could not connect to the chess lobby.')
      setPhase('idle')
    }
  }

  async function leaveLobby() {
    await channelRef.current?.untrack()
    await channelRef.current?.unsubscribe()
    channelRef.current = null
    setOpponent(null)
  }

  function startLocalGame(gameMode) {
    leaveLobby()
    setMode(gameMode)
    setPhase('playing')
    setGame(new Chess(STARTING_FEN))
    setSelected(null)
    setScoreSaved(false)
    setStatus(gameMode === 'computer' ? 'Your move' : 'White to move')
  }

  function handleSquareClick(square) {
    if (phase !== 'playing' || game.isGameOver()) return
    if (mode === 'online' && ((roleRef.current === 'host' && game.turn() !== 'w') || (roleRef.current === 'guest' && game.turn() !== 'b'))) return
    const piece = game.get(square)
    if (!selected) {
      if (piece?.color === game.turn()) setSelected(square)
      return
    }
    if (piece?.color === game.turn()) { setSelected(square); return }
    try {
      const nextGame = new Chess(game.fen())
      nextGame.move({ from: selected, to: square, promotion: 'q' })
      setGame(nextGame)
      setSelected(null)
      setStatus(nextGame.isGameOver() ? getResult(nextGame, playerName('white'), playerName('black')) : mode === 'computer' ? 'Computer is thinking...' : mode === 'online' ? 'Opponent is thinking...' : `${nextGame.turn() === 'w' ? 'White' : 'Black'} to move`)
      if (mode === 'online') channelRef.current?.send({ type: 'broadcast', event: 'chess', payload: { type: 'move', fen: nextGame.fen(), gameOver: nextGame.isGameOver() } })
      saveFinishedScore(nextGame, playerName('white'), playerName('black'), mode === 'online' ? roleRef.current : null)
    } catch {
      setSelected(null)
    }
  }

  function playerName(color) {
    if (mode === 'computer') return color === 'white' ? profile?.username || 'You' : 'Computer'
    if (mode === 'online') return color === (roleRef.current === 'host' ? 'white' : 'black') ? profile?.username || 'You' : opponent?.username || 'Opponent'
    return color === 'white' ? 'White' : 'Black'
  }

  function saveFinishedScore(completedGame, white, black, role) {
    if (!completedGame.isGameOver() || scoreSaved || (mode === 'online' && role !== 'host')) return
    const winner = completedGame.isCheckmate() ? (completedGame.turn() === 'w' ? black : white) : 'Draw'
    recordGameScore('chess', winner, completedGame.isCheckmate() ? 1 : 0)
    setScoreSaved(true)
    setLeaderboardVersion((version) => version + 1)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-7 animate-fade-in">
      <section className="text-center space-y-2"><span className="text-xs font-black uppercase tracking-[0.25em] text-heart-purple">Chess room</span><h1 className="font-display text-4xl font-black text-ink">Casual Chess</h1><p className="text-sm text-muted">Find a live opponent, play the computer, or start a local match.</p></section>

      <section className="card p-5 border border-heart-purple/25 bg-heart-purple/5 space-y-4">
        <div className="flex flex-wrap gap-2"><button type="button" onClick={findOpponent} className={`btn-primary !py-2.5 text-xs ${phase === 'searching' ? 'opacity-60' : ''}`} disabled={phase === 'searching'}>{phase === 'searching' ? 'Looking for opponent...' : 'Find online opponent'}</button><button type="button" onClick={() => startLocalGame('computer')} className="btn-secondary !py-2.5 text-xs">Play vs computer</button><button type="button" onClick={() => startLocalGame('local')} className="btn-secondary !py-2.5 text-xs">Local 1v1</button>{phase === 'searching' && <button type="button" onClick={() => { leaveLobby(); setPhase('idle') }} className="btn-ghost !py-2.5 text-xs">Cancel</button>}</div>
        {searchError && <p className="text-xs text-heart-red">{searchError}</p>}
        {phase === 'searching' && <p className="text-xs text-muted">You are in the live chess queue. Stay here while another player joins.</p>}
        {opponent && <p className="text-xs text-heart-green font-bold">Matched with @{opponent.username}</p>}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(320px,620px)_260px] gap-6 items-start">
        <div className="card p-4 sm:p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between text-xs"><span className="font-bold text-ink">{playerName('white')} vs {playerName('black')}</span><span className="text-muted">{status}</span></div>
          <div className="w-full max-w-[600px] mx-auto aspect-square grid grid-cols-8 border-2 border-heart-purple/40 rounded-lg overflow-hidden shadow-glow-purple">
            {FILES.flatMap((file, fileIndex) => Array.from({ length: 8 }, (_, rankIndex) => { const square = `${file}${8 - rankIndex}`; const squarePiece = game.get(square); const piece = squarePiece?.type; const color = squarePiece?.color; const isTarget = selected && game.moves({ square: selected, verbose: true }).some((move) => move.to === square); return <button key={square} type="button" onClick={() => handleSquareClick(square)} className={`relative flex items-center justify-center text-[clamp(1.6rem,7vw,3.4rem)] leading-none ${(fileIndex + rankIndex) % 2 ? 'bg-heart-purple/35' : 'bg-white/10'} ${selected === square ? 'ring-4 ring-inset ring-heart-red' : ''}`} aria-label={square}>{isTarget && <span className="absolute h-3 w-3 rounded-full bg-heart-red/70" />}{piece && <span className={color === 'w' ? 'text-white drop-shadow-md' : 'text-black drop-shadow-md'}>{PIECES[color === 'w' ? piece.toUpperCase() : piece]}</span>}</button> }))}
          </div>
        </div>
        <ChessLeaderboard refreshToken={leaderboardVersion} />
      </section>
    </div>
  )
}

function getResult(game, white, black) { return game.isCheckmate() ? `${game.turn() === 'w' ? black : white} wins` : 'Draw game' }

function ChessLeaderboard({ refreshToken }) {
  const entries = getGameLeaderboard('chess')
  return <section className="card p-5 border border-white/10"><p className="text-xs font-black uppercase tracking-widest text-heart-purple">Leaderboard</p><h2 className="font-display text-xl font-black text-ink mt-1">Chess results</h2><p className="text-xs text-muted mt-1 mb-4">{entries.length ? 'Completed local matches' : 'Finish a match to appear here.'}</p>{entries.length ? <div className="space-y-3">{entries.slice(0, 10).map((entry, index) => <div key={entry.id} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate text-muted"><strong className="text-ink mr-2">#{index + 1}</strong>{entry.playerName}</span><span className="shrink-0 text-right"><strong className="block text-heart-purple">{entry.score ? 'Win' : 'Draw'}</strong><small className="text-[9px] text-muted">{getGameQualification('chess', entry.score)}</small></span></div>)}</div> : <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-muted">No results yet</div>}<span className="hidden">{refreshToken}</span></section>
}