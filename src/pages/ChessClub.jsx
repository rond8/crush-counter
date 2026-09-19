import { useEffect, useState } from 'react'
import { Chess } from 'chess.js'
import { getChessProfile, getChessStats, getChessRatingHistory, getCasualMatchLink, getTitledPlayers } from '../lib/chessApi'
import { recordGamePlay, recordGameScore } from '../lib/gameLeaderboards'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

export default function ChessClub() {
  const [search, setSearch] = useState('')
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [ratingHistory, setRatingHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [featured, setFeatured] = useState([])
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [game, setGame] = useState(new Chess(STARTING_FEN))
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [gameMessage, setGameMessage] = useState('White to move')
  const [whitePlayer, setWhitePlayer] = useState('White')
  const [blackPlayer, setBlackPlayer] = useState('Black')
  const [scoreSaved, setScoreSaved] = useState(false)
  const [gameMode, setGameMode] = useState('local')
  const [computerThinking, setComputerThinking] = useState(false)

  useEffect(() => {
    recordGamePlay('chess')
    getTitledPlayers('GM').then(players => {
      setFeatured(players.sort(() => 0.5 - Math.random()).slice(0, 4))
      setLoadingFeatured(false)
    })
  }, [])

  useEffect(() => {
    if (gameMode !== 'computer' || game.turn() !== 'b' || game.isGameOver()) return undefined

    setComputerThinking(true)
    const timer = window.setTimeout(() => {
      const nextGame = new Chess(game.fen())
      const legalMoves = nextGame.moves({ verbose: true })
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)]
      nextGame.move(randomMove)
      setGame(nextGame)
      setGameMessage(nextGame.isGameOver() ? 'Game over' : 'White to move')
      setComputerThinking(false)
      recordFinishedGame(nextGame)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [game, gameMode])

  const handleSearch = async (e, username = search) => {
    if (e) e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')
    setProfile(null)
    setStats(null)
    setRatingHistory([])

    try {
      const [p, s] = await Promise.all([
        getChessProfile(username),
        getChessStats(username)
      ])

      if (!p) {
        setError('Chess.com user not found.')
      } else {
        setProfile(p)
        setStats(s)
        setRatingHistory(await getChessRatingHistory(username))
      }
    } catch (err) {
      setError('Error fetching chess data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      <section className="text-center space-y-3">
        <h1 className="font-display text-4xl font-black flex items-center justify-center gap-3">
          <span className="text-heart-purple animate-bounce">♟️</span>
          Chess Club
        </h1>
        <p className="text-muted text-sm max-w-lg mx-auto">
          Connect with matches over a casual game of chess. Search Chess.com profiles, compare ratings, and challenge your crush to a 1v1 match!
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Search & Results */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSearch} className="card p-5 flex gap-2">
            <input
              type="text"
              placeholder="Enter Chess.com username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field flex-1 bg-midnight"
            />
            <button type="submit" disabled={loading} className="btn-primary !py-2.5 !px-6 text-xs font-bold">
              {loading ? '...' : 'Look Up'}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-heart-red/10 border border-heart-red/20 rounded-2xl text-heart-red text-sm text-center font-bold">
              {error}
            </div>
          )}

          {profile && (
            <div className="card p-6 space-y-6 border-heart-purple/30 bg-heart-purple/5 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-5">
                <img
                  src={profile.avatar || 'https://www.chess.com/bundles/web/images/noavatar_l.84a924a6.gif'}
                  alt=""
                  className="w-20 h-20 rounded-2xl object-cover shadow-glow-purple border-2 border-heart-purple/40"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-ink truncate">{profile.name || profile.username}</h2>
                  <p className="text-xs text-muted font-mono">@{profile.username}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-muted">
                      {profile.location || 'Global'}
                    </span>
                    {profile.title && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-heart-red/20 border border-heart-red/40 rounded-full text-heart-red">
                        {profile.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="Rapid" rating={stats.chess_rapid?.last?.rating} />
                  <StatBox label="Blitz" rating={stats.chess_blitz?.last?.rating} />
                  <StatBox label="Bullet" rating={stats.chess_bullet?.last?.rating} />
                </div>
              )}

              {ratingHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted">Recent rating history</h3>
                    <span className="text-[10px] text-muted">last {ratingHistory.length} games</span>
                  </div>
                  <div className="flex items-end gap-1 h-16 rounded-xl bg-midnight border border-white/5 px-2 pt-2">
                    {ratingHistory.map((entry, index) => {
                      const ratings = ratingHistory.map(item => item.rating)
                      const min = Math.min(...ratings)
                      const max = Math.max(...ratings)
                      const height = max === min ? 50 : 18 + ((entry.rating - min) / (max - min)) * 72
                      return <div key={`${entry.date}-${index}`} title={`${entry.rating} rating`} className="flex-1 min-w-[3px] rounded-t-sm bg-heart-purple/70" style={{ height: `${height}%` }} />
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <a
                  href={getCasualMatchLink(profile.username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-glow-purple flex items-center justify-center gap-2"
                >
                  ⚔️ Challenge to 1v1
                </a>
                <p className="text-[10px] text-muted text-center mt-3 italic">Challenge will open on Chess.com</p>
              </div>
            </div>
          )}
        </div>

        {/* Featured / Titled Players */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted px-1 flex items-center gap-2">
            <span>⭐</span> Grandmasters
          </h3>
          <div className="space-y-3">
            {loadingFeatured ? (
              [0,1,2,3].map(i => <div key={i} className="h-16 bg-midnight-surface rounded-2xl animate-pulse" />)
            ) : (
              featured.map(username => (
                <button
                  key={username}
                  onClick={() => { setSearch(username); handleSearch(null, username); }}
                  className="w-full text-left card p-3 flex items-center gap-3 hover:border-heart-purple/50 hover:bg-heart-purple/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-heart-purple/20 flex items-center justify-center text-sm font-black text-heart-purple group-hover:scale-110 transition-transform">
                    {username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">@{username}</p>
                    <p className="text-[9px] text-muted font-black uppercase tracking-tighter">GM TITLE</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <section className="card p-5 sm:p-7 border-heart-purple/20 bg-heart-purple/5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-heart-purple">Casual mini-match</p>
            <h2 className="font-display text-2xl font-black text-ink mt-1">Play a quick game</h2>
          </div>
          <button type="button" onClick={resetGame} className="btn-secondary !px-4 !py-2 text-xs">New game</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[['local', 'User vs user'], ['computer', 'Vs computer'], ['random', 'Random user']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setGameMode(value); resetGame(); if (value === 'computer') setBlackPlayer('Computer'); if (value === 'random') findRandomOpponent(); }}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${gameMode === value ? 'border-heart-purple/60 bg-heart-purple/20 text-ink' : 'border-white/10 text-muted hover:border-white/25'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-5">
          <input value={whitePlayer} onChange={(event) => setWhitePlayer(event.target.value)} className="input-field bg-midnight text-xs" placeholder="White player" aria-label="White player name" />
          <input value={blackPlayer} onChange={(event) => setBlackPlayer(event.target.value)} disabled={gameMode === 'computer'} className="input-field bg-midnight text-xs disabled:opacity-60" placeholder="Black player" aria-label="Black player name" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[minmax(280px,480px)_1fr] gap-6 items-start">
          <div className="w-full max-w-[480px] mx-auto aspect-square grid grid-cols-8 border-2 border-heart-purple/40 rounded-lg overflow-hidden shadow-glow-purple">
            {FILES.flatMap((file, fileIndex) => Array.from({ length: 8 }, (_, rankIndex) => {
              const square = `${file}${8 - rankIndex}`
              const squarePiece = game.get(square)
              const piece = squarePiece?.type
              const color = squarePiece?.color
              const isDark = (fileIndex + rankIndex) % 2 === 1
              const isSelected = selectedSquare === square
              const isTarget = selectedSquare && game.moves({ square: selectedSquare, verbose: true }).some(move => move.to === square)
              return (
                <button
                  key={square}
                  type="button"
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center text-[clamp(1.6rem,7vw,3.2rem)] leading-none ${isDark ? 'bg-heart-purple/35' : 'bg-white/10'} ${isSelected ? 'ring-4 ring-inset ring-heart-red' : ''}`}
                  aria-label={`${square}${piece ? ` ${color === 'w' ? 'white' : 'black'} ${piece}` : ''}`}
                >
                  {isTarget && <span className="absolute w-3 h-3 rounded-full bg-heart-red/70" />}
                  {piece && <span className={color === 'w' ? 'text-white drop-shadow-md' : 'text-black drop-shadow-md'}>{PIECES[color === 'w' ? piece.toUpperCase() : piece]}</span>}
                </button>
              )
            }))}
          </div>
          <div className="space-y-4 text-sm text-muted">
            <div className="p-4 rounded-xl bg-midnight border border-white/5">
              <p className="text-ink font-bold">{game.isGameOver() ? (game.isCheckmate() ? `${game.turn() === 'w' ? blackPlayer : whitePlayer} wins` : 'Draw game') : computerThinking ? 'Computer is thinking...' : gameMessage}</p>
              <p className="text-xs mt-1">White moves first. Tap a piece, then its destination.</p>
            </div>
            <p className="text-xs leading-relaxed">This board runs locally for a private 1v1 match. Chess.com profile data, ratings, and game archives are read from its free public API with no API key.</p>
          </div>
        </div>
      </section>
    </div>
  )

  function resetGame() {
    setGame(new Chess(STARTING_FEN))
    setSelectedSquare(null)
    setGameMessage('White to move')
    setScoreSaved(false)
  }

  function findRandomOpponent() {
    const opponent = featured[Math.floor(Math.random() * featured.length)] || 'Random challenger'
    setBlackPlayer(opponent)
  }

  function recordFinishedGame(completedGame) {
    if (!completedGame.isGameOver() || scoreSaved) return
    const winner = completedGame.isCheckmate() ? (completedGame.turn() === 'w' ? blackPlayer : whitePlayer) : 'Draw'
    recordGameScore('chess', winner, completedGame.isCheckmate() ? 1 : 0)
    setScoreSaved(true)
  }

  function handleSquareClick(square) {
    const piece = game.get(square)
    if (!selectedSquare) {
      if (piece?.color === game.turn()) setSelectedSquare(square)
      return
    }

    if (piece?.color === game.turn()) {
      setSelectedSquare(square)
      return
    }

    try {
      const nextGame = new Chess(game.fen())
      const move = nextGame.move({ from: selectedSquare, to: square, promotion: 'q' })
      setGame(nextGame)
      setSelectedSquare(null)
      setGameMessage(nextGame.isGameOver() ? 'Game over' : `${nextGame.turn() === 'w' ? 'White' : 'Black'} to move`)
      recordFinishedGame(nextGame)
      return move
    } catch {
      setSelectedSquare(null)
      setGameMessage('That move is not legal')
    }
  }
}

function StatBox({ label, rating }) {
  return (
    <div className="p-3 bg-midnight border border-white/5 rounded-2xl text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className="text-sm font-bold text-ink">{rating || 'N/A'}</p>
    </div>
  )
}
