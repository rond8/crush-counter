import { useState, useEffect, useRef } from 'react'

/**
 * A simple "Catch the Heart" mini-game to play with the pet.
 */
export default function PetMiniGame({ onWin, onClose }) {
  const [score, setScore] = useState(0)
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameOver, setPhase] = useState(false)
  const containerRef = useRef(null)

  const WIN_SCORE = 5

  useEffect(() => {
    if (timeLeft <= 0) {
      setPhase(true)
      return
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  useEffect(() => {
    if (score >= WIN_SCORE) {
      onWin()
    }
  }, [score, onWin])

  const moveTarget = () => {
    const x = Math.random() * 80 + 10
    const y = Math.random() * 80 + 10
    setPos({ x, y })
  }

  const handleClick = (e) => {
    e.stopPropagation()
    setScore(s => s + 1)
    moveTarget()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
      <div className="relative max-w-sm w-full card p-8 text-center space-y-6 border-heart-purple/40 bg-midnight shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-display font-black text-white italic">Play Time! 🎾</h2>
          <button onClick={onClose} className="text-muted text-2xl">&times;</button>
        </div>

        <p className="text-xs text-muted">Catch 5 hearts to make your pet happy!</p>

        <div
          ref={containerRef}
          className="relative w-full h-64 bg-midnight-surface rounded-2xl border border-white/5 overflow-hidden cursor-crosshair"
        >
          {score < WIN_SCORE && timeLeft > 0 ? (
            <button
              onClick={handleClick}
              className="absolute w-10 h-10 flex items-center justify-center text-2xl transition-all duration-200 hover:scale-125 active:scale-90"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              ❤️
            </button>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
               <p className="text-2xl font-black text-white">{score >= WIN_SCORE ? 'SUCCESS! 🎉' : 'TIME UP! ⏰'}</p>
               <p className="text-xs text-muted">{score >= WIN_SCORE ? 'Your pet is exhausted but happy.' : 'Try to be faster next time!'}</p>
               {score < WIN_SCORE && (
                 <button onClick={() => {setScore(0); setTimeLeft(15); setPhase(false)}} className="btn-primary !py-1.5 !px-4 text-[10px]">Retry</button>
               )}
            </div>
          )}
        </div>

        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted">
           <span>Score: {score}/{WIN_SCORE}</span>
           <span>Time: {timeLeft}s</span>
        </div>
      </div>
    </div>
  )
}
