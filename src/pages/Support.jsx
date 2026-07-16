const CONTACT_EMAIL = 'rondosio8@gmail.com'

const FAQS = [
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings (tap your username in the menu, then Settings) and use the "Delete my account" option in the Danger Zone. This permanently removes your profile, crush, messages, matches, and photo — it cannot be undone.',
  },
  {
    q: 'Can I have more than one crush at a time?',
    a: 'No — you can only have one active crush, but you can change it whenever you like from the dashboard.',
  },
  {
    q: 'Will my crush know I sent them a heart?',
    a: "No. It stays anonymous unless it's mutual — meaning they've also set you as their crush.",
  },
  {
    q: 'Someone is harassing me. What can I do?',
    a: 'Use the "Report" button on their profile or on a specific message. Reports go straight to the developer for review.',
  },
  {
    q: 'I found a bug or have a feature idea.',
    a: 'Email us at the address below — we read every message.',
  },
]

export default function Support() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <section className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-4xl">Support</h1>
        <p className="text-muted text-sm">Need help? Start here.</p>
      </section>

      <section className="card p-6 text-center space-y-2">
        <p className="text-sm text-muted">Reach us directly at</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple font-semibold hover:underline">
          {CONTACT_EMAIL}
        </a>
        <p className="text-xs text-muted">We aim to respond within a few days.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-center">Frequently asked questions</h2>
        {FAQS.map((item) => (
          <div key={item.q} className="card p-5">
            <p className="text-sm font-semibold text-ink">{item.q}</p>
            <p className="text-sm text-muted mt-1.5">{item.a}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
