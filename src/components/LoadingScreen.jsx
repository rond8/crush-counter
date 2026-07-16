export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-midnight">
      <div className="text-5xl animate-pulseGlow" aria-hidden="true">
        💜
      </div>
      <p className="font-display text-xl tracking-tight">
        crush<span className="text-heart-purple">counter</span>
      </p>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="w-1.5 h-1.5 rounded-full bg-heart-purple animate-pulseGlow" style={{ animationDelay: '0s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-heart-purple animate-pulseGlow" style={{ animationDelay: '0.2s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-heart-purple animate-pulseGlow" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}
