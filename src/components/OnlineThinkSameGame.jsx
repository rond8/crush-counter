import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import { recordGamePlay, recordGameScore } from '../lib/gameLeaderboards'

const CATEGORIES = ['fruit', 'animals', 'colors', 'things at the beach', 'date ideas']

export default function OnlineThinkSameGame({ onScore = () => {} }) {
  const { profile } = useAuth()
  const channelRef = useRef(null)
  const roleRef = useRef(null)
  const [phase, setPhase] = useState('idle')
  const [opponent, setOpponent] = useState(null)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [round, setRound] = useState(1)
  const [myAnswer, setMyAnswer] = useState('')
  const [opponentAnswer, setOpponentAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => () => {
    channelRef.current?.untrack()
    channelRef.current?.unsubscribe()
  }, [])

  useEffect(() => {
    if (phase !== 'waiting-result' || !myAnswer || !opponentAnswer) return
    const matched = myAnswer.trim().toLowerCase() === opponentAnswer.trim().toLowerCase()
    setScore((value) => value + (matched ? 1 : 0))
    setPhase('result')
  }, [phase, myAnswer, opponentAnswer])

  async function findPlayer() {
    if (!profile?.id) return
    setError('')
    setPhase('searching')
    recordGamePlay('think_same')
    const channel = supabase.channel('think-same-online', { config: { presence: { key: profile.id } } })
      .on('presence', { event: 'sync' }, () => {
        const presence = channel.presenceState()
        const players = Object.values(presence).flat().filter((player) => player.user_id !== profile.id && player.status === 'searching')
        const otherPlayer = players[0]
        if (!otherPlayer || opponent) return

        const hostId = [profile.id, otherPlayer.user_id].sort()[0]
        const role = profile.id === hostId ? 'host' : 'guest'
        roleRef.current = role
        setOpponent(otherPlayer)
        setPhase('matched')
        if (role === 'host') {
          window.setTimeout(() => channel.send({ type: 'broadcast', event: 'game', payload: { type: 'match-start', category } }), 250)
        }
      })
      .on('broadcast', { event: 'game' }, ({ payload }) => {
        if (payload.type === 'match-start') {
          setCategory(payload.category)
          setRound(1)
          setPhase('answering')
        }
        if (payload.type === 'answer' && payload.round === round) {
          setOpponentAnswer(payload.answer)
          setPhase((current) => current === 'answering' ? 'waiting-result' : current)
        }
        if (payload.type === 'next-round') {
          setRound(payload.round)
          setMyAnswer('')
          setOpponentAnswer('')
          setPhase('answering')
        }
        if (payload.type === 'finished') {
          setScore(payload.score)
          setPhase('finished')
        }
      })

    channelRef.current = channel
    const status = await channel.subscribe(async (subscriptionStatus) => {
      if (subscriptionStatus === 'SUBSCRIBED') {
        await channel.track({ user_id: profile.id, username: profile.username, status: 'searching' })
      }
    })
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      setError('Could not connect to the online lobby.')
      setPhase('idle')
    }
  }

  async function cancelSearch() {
    await channelRef.current?.untrack()
    await channelRef.current?.unsubscribe()
    channelRef.current = null
    setOpponent(null)
    setPhase('idle')
  }

  async function submitAnswer(event) {
    event.preventDefault()
    if (!myAnswer.trim() || !channelRef.current) return
    await channelRef.current.send({ type: 'broadcast', event: 'game', payload: { type: 'answer', round, answer: myAnswer.trim() } })
    setPhase('waiting-result')
  }

  async function nextRound() {
    if (roleRef.current !== 'host') return
    if (round >= 5) {
      const winnerScore = score
      await channelRef.current?.send({ type: 'broadcast', event: 'game', payload: { type: 'finished', score: winnerScore } })
      setPhase('finished')
      return
    }
    const nextRoundNumber = round + 1
    await channelRef.current?.send({ type: 'broadcast', event: 'game', payload: { type: 'next-round', round: nextRoundNumber } })
    setRound(nextRoundNumber)
    setMyAnswer('')
    setOpponentAnswer('')
    setPhase('answering')
  }

  function saveScore() {
    if (saved || phase !== 'finished') return
    recordGameScore('think_same', profile?.username || 'Online player', score)
    setSaved(true)
    onScore()
  }

  return (
    <section className="card p-5 sm:p-7 border border-heart-red/20 bg-heart-red/5 space-y-5">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-heart-red">Online 1v1</p>
        <h2 className="font-display text-2xl font-black text-ink mt-1">Let's Think the Same Thing</h2>
        <p className="text-xs text-muted mt-1">Find another online player and choose the same word without seeing their answer.</p>
      </div>
      {error && <p className="text-xs text-heart-red">{error}</p>}
      {phase === 'idle' && <div className="space-y-3"><select value={category} onChange={(event) => setCategory(event.target.value)} className="input-field w-full bg-midnight text-sm">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={findPlayer} className="btn-primary w-full">Find online player</button></div>}
      {phase === 'searching' && <div className="text-center space-y-3"><p className="text-sm text-ink">Looking for another player...</p><p className="text-xs text-muted">Keep this page open while we pair you.</p><button type="button" onClick={cancelSearch} className="btn-secondary !py-2 text-xs">Cancel search</button></div>}
      {phase === 'matched' && <div className="text-center space-y-3"><p className="text-sm text-emerald-300 font-bold">Matched with @{opponent?.username}</p><p className="text-xs text-muted">Starting a 5-round game...</p></div>}
      {(phase === 'answering' || phase === 'waiting-result') && <form onSubmit={submitAnswer} className="space-y-3"><div className="flex justify-between text-xs text-muted"><span>Round {round}/5 · {category}</span><span>Score {score}</span></div><input autoFocus disabled={phase === 'waiting-result'} value={myAnswer} onChange={(event) => setMyAnswer(event.target.value)} className="input-field w-full bg-midnight text-center" placeholder="Type one word" /><button disabled={phase === 'waiting-result'} className="btn-primary w-full">{phase === 'waiting-result' ? 'Waiting for your opponent...' : 'Lock answer'}</button></form>}
      {phase === 'result' && <div className="text-center space-y-3"><p className="text-2xl font-bold text-ink">{myAnswer.trim().toLowerCase() === opponentAnswer.trim().toLowerCase() ? '✨ Same thought!' : 'Almost!'}</p><p className="text-xs text-muted">You: {myAnswer} · Opponent: {opponentAnswer}</p>{roleRef.current === 'host' ? <button type="button" onClick={nextRound} className="btn-primary">{round >= 5 ? 'Finish match' : 'Next round'}</button> : <p className="text-xs text-muted">Waiting for the host to start the next round.</p>}</div>}
      {phase === 'finished' && <ResultBar score={score} saved={saved} onSave={saveScore} onReset={cancelSearch} />}
    </section>
  )
}

function ResultBar({ score, saved, onSave, onReset }) {
  return <div className="text-center space-y-3"><p className="text-lg font-bold text-emerald-300">Match complete · {score}/5 matching thoughts</p><div className="flex justify-center gap-2"><button type="button" onClick={onSave} disabled={saved} className="btn-primary !py-2 text-xs">{saved ? 'Score saved' : 'Save score'}</button><button type="button" onClick={onReset} className="btn-secondary !py-2 text-xs">Find another player</button></div></div>
}