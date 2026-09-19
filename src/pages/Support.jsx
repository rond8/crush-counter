import { useState } from 'react'

const CONTACT_EMAIL = 'rondosio8@gmail.com'

const FAQ_CATEGORIES = [
  {
    category: 'Account & Safety',
    items: [
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings (tap your username in the menu, then Settings) and use the "Delete my account" option in the Danger Zone. This permanently removes your profile, crush, messages, matches, and photo — it cannot be undone.',
      },
       {
        q: 'How to earn Fame points?',
        a: 'through likes,gift and items',
      },
      {
        q: 'Someone is harassing me. What can I do?',
        a: 'Use the "Report" button on their profile or on a specific message. Reports go straight to the developer for review.',
      },
    ],
  },
  {
    category: 'Features & Privacy',
    items: [
      {
        q: 'Can I have more than one crush at a time?',
        a: 'No — you can only have one active crush, but you can change it whenever you like from the dashboard.',
      },
      {
        q: 'Will my crush know I sent them a heart?',
        a: "No. It stays anonymous unless it's mutual — meaning they've also set you as their crush.",
      },
      {
        q: 'I found a bug or have a feature idea.',
        a: 'Email us at the address below — we read every message.',
      },
    ],
  },
]

export default function Support() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-heart-purple/10 text-heart-purple border border-heart-purple/20">
          Help Center & FAQs
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          How can we help?
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-md mx-auto">
          Find answers to common questions or reach out to our team directly.
        </p>
      </section>

      {/* Direct Contact Card */}
      <section className="card p-6 border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-lg rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-heart-purple/15 text-heart-purple flex items-center justify-center shrink-0 mx-auto sm:mx-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">Need personal assistance?</h3>
            <p className="text-xs text-muted mt-0.5">We typically respond within 24–48 hours.</p>
          </div>
        </div>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="btn-primary inline-flex items-center gap-2 !px-5 !py-2.5 text-sm whitespace-nowrap shadow-md hover:scale-[1.02] transition-transform"
        >
          <span>Email Support</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </section>

      {/* Categorized Accordion Section */}
      <section className="space-y-8">
        {FAQ_CATEGORIES.map((cat, catIdx) => (
          <div key={cat.category} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted px-1">
              {cat.category}
            </h2>

            <div className="space-y-2.5">
              {cat.items.map((item, itemIdx) => {
                const uniqueId = `${catIdx}-${itemIdx}`
                const isOpen = openIndex === uniqueId

                return (
                  <div
                    key={item.q}
                    className={`card transition-all duration-200 overflow-hidden border ${
                      isOpen ? 'border-heart-purple/40 bg-white/[0.04]' : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(uniqueId)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-semibold text-ink pr-2">
                        {item.q}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180 bg-heart-purple/20 text-heart-purple' : 'text-muted'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-sm text-muted leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Footer Email Reminder */}
      <div className="text-center pt-4 border-t border-white/5">
        <p className="text-xs text-muted">
          Direct email: {' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-heart-purple hover:underline font-mono">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </div>
  )
}