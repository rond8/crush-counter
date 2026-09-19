import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export default function StreakRewardModal() {
  const { profile, refreshProfile } = useAuth()
  const [reward, setReward] = useState(null)
  const [claiming, setUnlocking] = useState(false)

  // Check for claimable reward on mount
  useEffect(() => {
    if (profile?.id) {
       checkStreak()
    }
  }, [profile?.id])

  async function checkStreak() {
    try {
      const { data, error } = await supabase.rpc('check_and_claim_streak')
      if (error) throw error
      if (data && data[0]?.awarded) {
        setReward(data[0])
      }
    } catch (err) {
      console.error('Streak check failed:', err)
    }
  }

  const handleClose = async () => {
    setUnlocking(true)
    await refreshProfile()
    setReward(null)
    setUnlocking(false)
  }

  if (!reward) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative max-w-sm w-full card p-8 text-center space-y-6 border-heart-purple/40 bg-gradient-to-b from-indigo-900/20 to-midnight shadow-[0_0_50px_rgba(181,123,255,0.2)] scale-in-center">

        {/* Animated Background Glow */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
           <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(181,123,255,0.1)_0%,transparent_70%)] animate-pulse" />
        </div>

        <div className="relative space-y-4">
          <div className="text-6xl animate-bounce">🔥</div>
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-black text-white italic">
              {reward.streak_days} DAY STREAK!
            </h2>
            <p className="text-heart-purple text-xs font-bold uppercase tracking-widest">Daily Reward Unlocked</p>
          </div>

          <div className="py-6 flex flex-col items-center gap-2">
            <div className="text-4xl">🪙</div>
            <div className="text-3xl font-black text-white">+{reward.amount} Coins</div>
            <p className="text-muted text-[10px]">Your consistency is paying off!</p>
          </div>

          <button
            onClick={handleClose}
            disabled={claiming}
            className="btn-primary w-full py-4 rounded-2xl shadow-glow-purple font-black text-sm uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all"
          >
            {claiming ? 'Updating...' : 'Claim & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
