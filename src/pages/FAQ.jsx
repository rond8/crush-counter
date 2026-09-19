import { useState } from 'react'
import { Link } from 'react-router-dom'

const FAQ_CATEGORIES = [
  {
    category: 'Account & Safety',
    items: [
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings (tap your username in the menu, then Settings) and use the "Delete my account" option in the Danger Zone. This permanently removes your profile, crush, messages, matches, and photo — it cannot be undone.',
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
        a: 'Email us at rondosio8@gmail.com — we read every message.',
      },
    ],
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10 pb-32">
      <section className="text-center space-y-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-heart-purple/10 text-heart-purple border border-heart-purple/20">
          Frequently Asked Questions
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Need Help?
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-md mx-auto">
          Quick answers to the most common questions about Crush Counter.
        </p>
      </section>

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

      <div className="text-center pt-8 border-t border-white/5">
        <p className="text-sm text-muted">
          Still have questions? <Link to="/support" className="text-heart-purple hover:underline font-bold">Contact Support</Link>
        </p>
      </div>
    </div>
  )
}
