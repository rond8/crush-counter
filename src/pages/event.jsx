import { useEffect, useState } from 'react'
import LoadingScreen from '../components/LoadingScreen'

const STORAGE_URL = 'https://ifhtaieggnvoaeuecuxd.supabase.co/storage/v1/object/public/files/Index.html'

export default function Event() {
  const [loading, setLoading] = useState(true)
  const [htmlContent, setHtmlContent] = useState(null)

  useEffect(() => {
    // We fetch the text directly to ensure it renders as HTML
    // even if the server headers are misconfigured.
    const fetchHtml = async () => {
      try {
        const res = await fetch(`${STORAGE_URL}?cb=${Date.now()}`)
        if (res.ok) {
          const text = await res.text()
          setHtmlContent(text)
        } else {
          setHtmlContent(null)
        }
      } catch (err) {
        setHtmlContent(null)
      } finally {
        setLoading(false)
      }
    }
    fetchHtml()
  }, [])

  if (loading) return <LoadingScreen />

  // If file is found, render it using srcDoc to force HTML parsing and hide scrollbars
  if (htmlContent) {
    return (
      <div className="fixed inset-0 z-0 bg-midnight overflow-hidden">
        <style>{`
          /* Double-check body hide */
          body { overflow: hidden !important; }
        `}</style>
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full border-none overflow-hidden"
          title="Event Content"
          scrolling="no"
          style={{ overflow: 'hidden' }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    )
  }

  // FALLBACK DESIGN: "Page Not Available"
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6 text-center overflow-hidden"
      style={{ background: 'radial-gradient(circle at top right, #3b0764, #0f172a)', fontFamily: 'sans-serif' }}
    >
      <main
        className="w-full max-w-[520px] p-10 rounded-[24px] border border-purple-400/20 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-500"
        style={{ background: 'rgba(147, 51, 234, 0.08)' }}
      >
        <span className="inline-block bg-purple-400/15 text-[#e9d5ff] text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider border border-purple-400/30">
          App Notice
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic leading-none">
          Page Not Available
        </h1>
        <p className="text-lg md:text-xl text-[#d8b4fe] font-bold mb-8 uppercase tracking-wide">
          We will update soon
        </p>
        <div className="w-11 h-11 mx-auto border-4 border-purple-400/15 border-t-purple-500 rounded-full animate-spin" />
      </main>
    </div>
  )
}
