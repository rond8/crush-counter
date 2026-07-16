const COLORS = ['#B57BFF', '#5FD68A', '#FF5C7A', '#FFCB57']

// Deterministic-looking but varied particle field. Purely decorative,
// kept subtle and behind content (aria-hidden, pointer-events none).
function makeParticles(count) {
  return Array.from({ length: count }, (_, i) => {
    const left = (i * 37) % 100
    const delay = (i * 2.3) % 14
    const duration = 12 + ((i * 5) % 10)
    const size = 6 + ((i * 3) % 10)
    const color = COLORS[i % COLORS.length]
    return { id: i, left, delay, duration, size, color }
  })
}

const particles = makeParticles(16)

export default function FloatingHearts() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 rounded-full blur-[1px] animate-floatUp"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.35,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
