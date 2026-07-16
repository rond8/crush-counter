import { Link } from 'react-router-dom'

const LEGEND = [
  { emoji: '💜', label: 'Mutual match', detail: 'You like them, and they like you back.' },
  { emoji: '💚', label: 'Competition', detail: 'Someone else has also sent a heart to your crush.' },
  { emoji: '❤️', label: 'Secret admirer', detail: 'Someone has sent a heart to you.' },
  { emoji: '💛', label: 'Invite needed', detail: "That username isn't on Crush Counter yet." },
]

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14 space-y-14">
      <section className="text-center space-y-4">
        <div className="text-5xl animate-pulseGlow">💜</div>
        <h1 className="font-display text-4xl md:text-5xl">
          crush<span className="text-heart-purple">counter</span>
        </h1>
        <p className="text-muted text-base max-w-md mx-auto">
          Send an anonymous heart to your crush. They'll never know it's you —
          unless they've sent one to you too.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/register" className="btn-primary !px-6 !py-3">
            Get started
          </Link>
          <Link to="/login" className="btn-ghost !px-6 !py-3">
            Sign in
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-center mb-4">How it works</h2>
        <div className="space-y-3">
          {LEGEND.map((item) => (
            <div key={item.label} className="card p-4 flex items-center gap-4">
              <span className="text-3xl">{item.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-sm text-muted">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 text-center">
        <Link to="/featured" className="card p-5 hover:ring-1 hover:ring-heart-purple/40 transition-shadow">
          <p className="text-2xl mb-1">🏆</p>
          <p className="text-sm font-semibold text-ink">Featured</p>
          <p className="text-xs text-muted mt-1">See the most famous profiles</p>
        </Link>
        <Link to="/announcements" className="card p-5 hover:ring-1 hover:ring-heart-purple/40 transition-shadow">
          <p className="text-2xl mb-1">📣</p>
          <p className="text-sm font-semibold text-ink">Announcements</p>
          <p className="text-xs text-muted mt-1">What's new</p>
        </Link>
      </section>

      <p className="text-center text-xs text-muted">You must be 18 or older to join.</p>
    </div>
  )
}
