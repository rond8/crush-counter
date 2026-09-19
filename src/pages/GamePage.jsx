import { Link } from 'react-router-dom'
import { Leaderboard, MemoryGame } from './Games'
import OnlineThinkSameGame from '../components/OnlineThinkSameGame'

export default function GamePage({ type }) {
  const isThinkSame = type === 'think-same'
  const title = isThinkSame ? 'Let\'s Think the Same Thing' : 'Heart Match'
  const gameKey = isThinkSame ? 'think_same' : 'heart_match'

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-5">
      <Link to="/games" className="text-xs font-bold text-heart-purple hover:underline">← Back to Games</Link>
      <section>
        <p className="text-xs font-black uppercase tracking-widest text-muted">Standalone game page</p>
        <h1 className="font-display text-3xl font-black text-ink mt-1">{title}</h1>
      </section>
      {isThinkSame ? <OnlineThinkSameGame /> : <MemoryGame />}
      <Leaderboard gameKey={gameKey} title={`${title} leaderboard`} />
    </div>
  )
}