import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGameLeaderboard, getGamePlayCount, getGameQualification, recordGamePlay, recordGameScore } from '../lib/gameLeaderboards'

const CARD_SYMBOLS = ['💜', '💌', '🌟', '🔥', '🎁', '♟️']
const THINK_CATEGORIES = ['fruit', 'animals', 'colors', 'things at the beach', 'date ideas']

function createDeck() {
  return [...CARD_SYMBOLS, ...CARD_SYMBOLS].sort(() => Math.random() - 0.5).map((symbol, index) => ({ id: index, symbol }))
}

export default function Games() {
  const [leaderboardVersion, setLeaderboardVersion] = useState(0)
  const refreshLeaderboards = () => setLeaderboardVersion((version) => version + 1)

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12 animate-fade-in">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-heart-purple/10 border border-heart-purple/20">
          <span className="w-2 h-2 rounded-full bg-heart-purple animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-heart-purple">Play & Earn Fame</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-ink">Games Hall</h1>
        <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
          Challenge yourself solo, compete in matches, and climb the global hall of fame.
        </p>
      </section>

      {/* Featured Card */}
      <Link to="/games/chess" className="group block relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#1E1E2E] to-transparent p-1 transition-all hover:border-heart-purple/50 shadow-2xl">
        <div className="absolute inset-0 bg-heart-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-8 p-8 sm:p-10">
          <div className="flex items-start sm:items-center gap-6">
            <div className="w-20 h-20 shrink-0 rounded-[2rem] bg-gradient-to-br from-heart-purple to-heart-purple/50 flex items-center justify-center text-5xl shadow-lg shadow-heart-purple/20 group-hover:rotate-6 transition-transform">
              ♟️
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-heart-purple/80">PRO 1V1 STRATEGY</span>
              <h2 className="font-display text-3xl font-black text-ink">Chess Club</h2>
              <p className="text-sm text-muted max-w-sm">Global matchmaking, AI battles, and private duels.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-[10px] font-bold text-muted/60 uppercase tracking-tighter">Matches Live Now</span>
            <div className="btn-primary !rounded-2xl !px-8 !py-4 text-sm font-bold shadow-xl shadow-heart-purple/30 group-hover:scale-105 active:scale-95 transition-all">
              Join Club
            </div>
          </div>
        </div>
      </Link>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Arcade Mode</p>
            <h2 className="font-display text-2xl font-black text-ink mt-1">Available Games</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <GameOption refreshToken={leaderboardVersion} gameKey="chess" title="Chess Club" icon="♟️" description="PvP Matchmaking & AI" to="/games/chess" color="purple" />
          <GameOption refreshToken={leaderboardVersion} gameKey="heart_match" title="Heart Match" icon="💜" description="Timed Memory Challenge" to="/games/heart-match" color="red" />
          <GameOption refreshToken={leaderboardVersion} gameKey="think_same" title="Think Same" icon="🧠" description="Online Word Duo" to="/games/think-same" color="blue" />
        </div>
      </section>

      {/* Teammate Banner */}
      <Link to="/teammates" className="group block relative overflow-hidden rounded-[2rem] border border-heart-green/20 bg-heart-green/5 p-8 hover:border-heart-green/40 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-heart-green animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-heart-green">Lobby Open</p>
            </div>
            <h2 className="font-display text-2xl font-black text-ink">Find a Teammate</h2>
            <p className="text-xs text-muted max-w-sm">MLBB, COD Mobile, Valorant, and more. Connect with live players.</p>
          </div>
          <span className="btn-secondary !rounded-xl !py-3 !px-6 text-xs font-bold group-hover:bg-heart-green/10 transition-colors">Launch Finder →</span>
        </div>
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 text-9xl opacity-5 pointer-events-none group-hover:scale-110 transition-transform">🎮</div>
      </Link>

      <section className="space-y-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-heart-purple">The Elite</p>
          <h2 className="font-display text-2xl font-black text-ink mt-1">Global Rankings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Leaderboard gameKey="chess" title="♟️ Chess Pro" refreshToken={leaderboardVersion} />
          <Leaderboard gameKey="heart_match" title="💜 Heart Blitz" refreshToken={leaderboardVersion} />
          <Leaderboard gameKey="think_same" title="🧠 Think Same" refreshToken={leaderboardVersion} />
        </div>
      </section>
    </div>
  )
}

export function MemoryGame({ onScore = () => {} }) {
  const [deck, setDeck] = useState(createDeck)
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [moves, setMoves] = useState(0)
  const [locked, setLocked] = useState(false)
  const [playerName, setPlayerName] = useState('Player')
  const [startedAt, setStartedAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [saved, setSaved] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  const complete = matched.length === deck.length

  useEffect(() => {
    if (complete || !startedAt) return undefined
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt), 250)
    return () => window.clearInterval(timer)
  }, [complete, startedAt])

  const resetGame = () => {
    setDeck(createDeck()); setFlipped([]); setMatched([]); setMoves(0); setLocked(false); setElapsed(0); setStartedAt(null); setSaved(false); setHasPlayed(false)
  }

  const handleCardClick = (card) => {
    if (locked || flipped.includes(card.id) || matched.includes(card.id)) return
    if (!hasPlayed) { recordGamePlay('heart_match'); setHasPlayed(true); setStartedAt(Date.now()) }
    const nextFlipped = [...flipped, card.id]
    setFlipped(nextFlipped)
    if (nextFlipped.length !== 2) return
    setMoves((value) => value + 1)
    const firstCard = deck.find((item) => item.id === nextFlipped[0])
    const secondCard = deck.find((item) => item.id === nextFlipped[1])
    if (firstCard.symbol === secondCard.symbol) {
      setMatched((value) => [...value, ...nextFlipped])
      setFlipped([])
      return
    }
    setLocked(true)
    window.setTimeout(() => { setFlipped([]); setLocked(false) }, 700)
  }

  const finish = () => {
    if (saved || !complete) return
    const finishTime = Math.max(1, Math.ceil(elapsed / 1000))
    recordGameScore('heart_match', playerName || 'Player', finishTime); setSaved(true); onScore()
  }

  return (
    <section className="card p-5 sm:p-7 border border-white/10 space-y-5">
      <GameHeader eyebrow="Solo speed run" title="Heart Match" description="Find every pair as quickly as possible. Your fastest time climbs the leaderboard." onReset={resetGame} />
      <div className="grid grid-cols-2 gap-2"><input value={playerName} onChange={(event) => setPlayerName(event.target.value)} aria-label="Player name" className="input-field bg-midnight text-xs" placeholder="Your name" /><div className="input-field bg-midnight text-xs text-muted">Time: {Math.ceil(elapsed / 1000)}s · Moves: {moves}</div></div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 max-w-xl mx-auto">
        {deck.map((card) => {
          const visible = flipped.includes(card.id) || matched.includes(card.id)
          return <button key={card.id} type="button" onClick={() => handleCardClick(card)} aria-label={visible ? `Card ${card.symbol}` : 'Hidden card'} className={`aspect-square rounded-xl border text-2xl sm:text-3xl flex items-center justify-center transition-all ${visible ? 'bg-heart-purple/20 border-heart-purple/50' : 'bg-white/[0.04] border-white/10 hover:border-heart-purple/40'}`}>{visible ? card.symbol : '♡'}</button>
        })}
      </div>
      {complete && <ResultBar text={`Finished in ${Math.max(1, Math.ceil(elapsed / 1000))} seconds · ${matched.length / 2}/6 pairs`} saved={saved} onSave={finish} />}
    </section>
  )
}

export function ThinkSameGame({ onScore = () => {} }) {
  const [first, setFirst] = useState('Player 1')
  const [second, setSecond] = useState('Player 2')
  const [category, setCategory] = useState(THINK_CATEGORIES[0])
  const [phase, setPhase] = useState('setup')
  const [round, setRound] = useState(1)
  const [firstAnswer, setFirstAnswer] = useState('')
  const [secondAnswer, setSecondAnswer] = useState('')
  const [scores, setScores] = useState([0, 0])
  const [saved, setSaved] = useState(false)

  const start = () => { setPhase('first'); setRound(1); setScores([0, 0]); setSaved(false); setFirstAnswer(''); setSecondAnswer('') }
  const submitFirst = (event) => { event.preventDefault(); if (firstAnswer.trim()) setPhase('second') }
  const submitSecond = (event) => {
    event.preventDefault()
    if (!secondAnswer.trim()) return
    const matched = firstAnswer.trim().toLowerCase() === secondAnswer.trim().toLowerCase()
    setScores((value) => matched ? [value[0] + 1, value[1] + 1] : value)
    setPhase('result')
  }
  const nextRound = () => { setFirstAnswer(''); setSecondAnswer(''); setRound((value) => value + 1); setPhase('first') }
  const finish = () => {
    if (saved) return
    const winner = scores[0] === scores[1] ? 'Draw' : scores[0] > scores[1] ? first : second
    recordGameScore('think_same', winner, scores[0]); setSaved(true); onScore()
  }

  return (
    <section className="card p-5 sm:p-7 border border-heart-red/20 bg-heart-red/5 space-y-5">
      <GameHeader eyebrow="Online 1v1 word game" title="Let's Think the Same Thing" description="Find another online player and choose the same word without seeing their answer." onReset={() => setPhase('setup')} />
      {phase === 'setup' && <div className="space-y-4"><PlayerNames first={first} second={second} setFirst={setFirst} setSecond={setSecond} /><div><label className="text-xs text-muted">Category</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="input-field mt-1 w-full bg-midnight">{THINK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div><button type="button" onClick={start} className="btn-primary w-full">Start round 1</button></div>}
      {phase !== 'setup' && <div className="space-y-4"><div className="flex justify-between text-xs text-muted"><span>Round {round}/5 · {category}</span><span>{first}: {scores[0]} · {second}: {scores[1]}</span></div>{phase === 'first' && <AnswerForm player={first} answer={firstAnswer} setAnswer={setFirstAnswer} onSubmit={submitFirst} />}{phase === 'second' && <AnswerForm player={second} answer={secondAnswer} setAnswer={setSecondAnswer} onSubmit={submitSecond} />}{phase === 'result' && <div className="text-center space-y-3"><p className="text-3xl">{firstAnswer.trim().toLowerCase() === secondAnswer.trim().toLowerCase() ? '✨ Same thought!' : 'Almost!'}</p><p className="text-sm text-muted">{first} chose <strong className="text-ink">{firstAnswer}</strong>; {second} chose <strong className="text-ink">{secondAnswer}</strong>.</p>{round < 5 ? <button type="button" onClick={nextRound} className="btn-primary">Next round</button> : <ResultBar text={`${scores[0] === scores[1] ? 'Draw game' : `${scores[0] > scores[1] ? first : second} wins`} · ${scores[0]} matching thoughts`} saved={saved} onSave={finish} />}</div>}</div>}
    </section>
  )
}

function GameHeader({ eyebrow, title, description, onReset }) { return <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-heart-purple">{eyebrow}</p><h2 className="font-display text-2xl font-black text-ink mt-1">{title}</h2><p className="text-xs text-muted mt-1">{description}</p></div><button type="button" onClick={onReset} className="btn-secondary !px-4 !py-2 text-xs">New game</button></div> }
function PlayerNames({ first, second, setFirst, setSecond }) { return <div className="grid grid-cols-2 gap-2"><input value={first} onChange={(event) => setFirst(event.target.value)} aria-label="First player name" className="input-field bg-midnight text-xs" placeholder="Player 1" /><input value={second} onChange={(event) => setSecond(event.target.value)} aria-label="Second player name" className="input-field bg-midnight text-xs" placeholder="Player 2" /></div> }
function AnswerForm({ player, answer, setAnswer, onSubmit }) { return <form onSubmit={onSubmit} className="space-y-3"><p className="text-sm font-bold text-ink text-center">{player}, enter your word</p><input autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} className="input-field w-full bg-midnight text-center" placeholder="Type one word" /><button className="btn-primary w-full">Lock answer</button></form> }
function ResultBar({ text, saved, onSave }) { return <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-emerald-400/10 border border-emerald-400/20"><span className="text-sm font-bold text-emerald-300">{text}</span><button type="button" onClick={onSave} disabled={saved} className="btn-primary !py-2 !px-4 text-xs">{saved ? 'Saved' : 'Save score'}</button></div> }
function GameOption({ gameKey, title, icon, description, to, refreshToken, color = 'purple' }) {
  const colors = {
    purple: 'hover:border-heart-purple/40 hover:bg-heart-purple/5 text-heart-purple',
    red: 'hover:border-heart-red/40 hover:bg-heart-red/5 text-heart-red',
    blue: 'hover:border-sky-400/40 hover:bg-sky-400/5 text-sky-400',
  }

  return (
    <Link to={to} className={`group relative card p-6 border border-white/5 transition-all duration-300 hover:-translate-y-1 shadow-xl ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted/60">Popularity</p>
          <p className="text-[10px] font-bold text-ink">{getGamePlayCount(gameKey)} plays</p>
        </div>
      </div>
      <div className="mt-6 space-y-1">
        <h3 className="text-base font-black text-ink">{title}</h3>
        <p className="text-xs text-muted leading-relaxed">{description}</p>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest group-hover:underline">Play Arcade</span>
        <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
      </div>
      <span className="hidden">{refreshToken}</span>
    </Link>
  )
}

export function Leaderboard({ gameKey, title, refreshToken }) {
  const entries = getGameLeaderboard(gameKey)
  return (
    <div className="card p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shadow-xl rounded-[2rem]">
      <div className="flex items-center gap-2 mb-6">
         <div className="w-1.5 h-1.5 rounded-full bg-heart-purple shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
         <h3 className="text-sm font-black uppercase tracking-widest text-ink">{title}</h3>
      </div>
      {entries.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs text-muted italic">Awaiting first legends...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.slice(0, 5).map((entry, index) => (
            <div key={entry.id} className="group flex items-center justify-between gap-4 p-3 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                  index === 0 ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' :
                  index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                  index === 2 ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                  'bg-white/5 text-muted border border-white/10'
                }`}>
                  {index + 1}
                </span>
                <span className="text-xs font-bold text-ink truncate group-hover:text-heart-purple transition-colors">
                  {entry.playerName}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-xs font-black text-ink">{entry.score}{gameKey === 'heart_match' ? 's' : ''}</span>
                <span className="block text-[8px] font-bold text-muted uppercase tracking-tighter">
                  {getGameQualification(gameKey, entry.score)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <span className="hidden">{refreshToken}</span>
    </div>
  )
}