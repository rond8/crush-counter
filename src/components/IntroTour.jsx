import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const TOUR_STEPS = [
  {
    icon: '👋',
    title: 'Welcome to Crush Counter',
    content: 'The only app where your secrets are safe until they are shared. Ready to find your match?',
    accent: 'from-heart-purple to-indigo-600'
  },
  {
    icon: '💌',
    title: 'Send a Secret Heart',
    content: 'Enter someone\'s username to send a heart. They won\'t know it\'s you—it\'s 100% anonymous.',
    accent: 'from-heart-red to-rose-600'
  },
  {
    icon: '',
    title: 'Watch the Colors',
    content: '💜 Purple means a Mutual Match! 💚 Green means someone else likes them too. ❤️ Red means you have a secret admirer!',
    accent: 'from-heart-green to-teal-600'
  },
  {
    icon: '🎰',
    title: 'Spin & Win',
    content: 'Feeling lucky? Spin the Daily Wheel to win rare game items like Fire, Swords, and Lighters!',
    accent: 'from-heart-yellow to-amber-500'
  },
  {
    icon: '🚀',
    title: 'Missions & Fame',
    content: 'Complete daily missions to earn Coins and build your Fame. The higher your fame, the more features you unlock!',
    accent: 'from-blue-400 to-indigo-500'
  },
  {
    icon: '🗳️',
    title: 'Community Polls',
    content: 'Vote on daily questions or create your own! See what everyone else is thinking in real-time.',
    accent: 'from-emerald-400 to-teal-500'
  },
  {
    icon: '🤫',
    title: 'The Whisper Wall',
    content: 'Share your deepest secrets or read others\' anonymous confessions on the social Whisper Wall.',
    accent: 'from-violet-500 to-purple-700'
  },
  {
    icon: '🛡️',
    title: 'Privacy First',
    content: 'Your identity is NEVER revealed unless both of you send a heart to each other. Secure and encrypted.',
    accent: 'from-slate-600 to-slate-800'
  }
]

export default function IntroTour() {
  const { session } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('cc_tour_seen')
    if (session && !hasSeen) {
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [session])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem('cc_tour_seen', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  const step = TOUR_STEPS[currentStep]

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-midnight/95 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-full max-w-sm relative">
        <div className={`absolute -inset-4 bg-gradient-to-br ${step.accent} opacity-20 blur-3xl rounded-full transition-all duration-700`} />

        <div className="card p-8 text-center space-y-6 relative overflow-hidden border-white/10 shadow-2xl">
          <div className="flex justify-center gap-1 mb-2">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-heart-purple' : 'w-1 bg-midnight-border'}`}
              />
            ))}
          </div>

          <div className="space-y-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="text-6xl mb-4 drop-shadow-glow-purple">{step.icon}</div>
            <h2 className="text-2xl font-display font-black text-ink italic uppercase tracking-tight leading-tight">
              {step.title}
            </h2>
            <p className="text-xs text-muted leading-relaxed font-bold px-2">
              {step.content}
            </p>
          </div>

          <div className="pt-6 flex flex-col gap-3">
            <button
              onClick={handleNext}
              className="btn-primary w-full py-4 font-black uppercase tracking-widest text-xs shadow-glow-purple active:scale-95 transition-all"
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Start Matching 🚀' : 'Next Step'}
            </button>

            <button
              onClick={handleComplete}
              className="text-[10px] text-muted font-bold uppercase tracking-widest hover:text-ink transition-colors"
            >
              Skip Intro
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
