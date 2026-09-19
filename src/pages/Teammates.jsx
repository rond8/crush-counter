import { Link } from 'react-router-dom'
import GameTeammateFinder from '../components/GameTeammateFinder'

export default function Teammates() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link to="/games" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-heart-purple bg-heart-purple/10 px-3 py-1.5 rounded-full border border-heart-purple/20 hover:bg-heart-purple/20 transition-all">
          <span>←</span> Games
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 border-r border-white/10 pr-4 mr-1">
            <StatSmall label="Live" value="120+" />
            <StatSmall label="Wait" value="<2m" />
          </div>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-heart-green animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-heart-green">Lobby Live</span>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F1115] shadow-xl p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight text-ink">
              Find Your <span className="text-heart-green">Duo.</span>
            </h1>
            <p className="text-xs text-muted max-w-sm">
              Real-time matchmaking for legends. Connect and play now.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border border-[#0F1115] bg-white/10 flex items-center justify-center text-[8px]">👤</div>
                ))}
             </div>
             <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">
                Players Online
             </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 text-7xl opacity-[0.02] select-none translate-x-1/4 -translate-y-1/4">🎮</div>
      </section>

      <GameTeammateFinder />

      <section className="grid grid-cols-3 gap-3">
        <TipSmall icon="🎯" title="Filters" text="Rank & Role" />
        <TipSmall icon="💬" title="Comms" text="Mic/Ping" />
        <TipSmall icon="🛡️" title="Secure" text="Verified" />
      </section>
    </div>
  )
}

function StatSmall({ label, value }) {
  return (
    <div className="text-right">
      <p className="text-xs font-black text-ink leading-none">{value}</p>
      <p className="text-[8px] font-bold uppercase tracking-widest text-muted mt-0.5">{label}</p>
    </div>
  )
}

function TipSmall({ icon, title, text }) {
  return (
    <div className="card border border-white/5 bg-white/[0.02] p-3 rounded-2xl flex items-center gap-2.5">
      <span className="text-lg">{icon}</span>
      <div>
        <h3 className="text-[10px] font-black text-ink uppercase tracking-tight leading-none">{title}</h3>
        <p className="text-[9px] text-muted mt-0.5 truncate">{text}</p>
      </div>
    </div>
  )
}