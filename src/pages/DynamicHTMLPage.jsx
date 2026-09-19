import { useEffect, useState } from 'react'
import LoadingScreen from '../components/LoadingScreen'
import { supabase } from '../supabaseClient'

export default function DynamicHTMLPage() {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        // 1. Try to download Index.html (Case Sensitive)
        let { data, error: downloadError } = await supabase
          .storage
          .from('files')
          .download('Index.html')

        // 2. If that fails, try index.html (lowercase)
        if (downloadError) {
          const { data: dataLower, error: downloadErrorLower } = await supabase
            .storage
            .from('files')
            .download('index.html')

          if (downloadErrorLower) throw downloadErrorLower
          data = dataLower
        }

        const text = await data.text()
        setHtml(text)
      } catch (err) {
        console.error('Storage Error:', err)
        setError(err.message || 'The Index.html file was not found in the "files" bucket.')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [])

  if (loading) return <LoadingScreen />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-ink italic font-display">Oops!</h1>
        <div className="card p-4 bg-heart-red/5 border border-heart-red/20 max-w-sm">
           <p className="text-heart-red text-xs font-bold leading-relaxed">{error}</p>
        </div>
        <p className="text-muted text-[10px] max-w-xs leading-relaxed uppercase tracking-widest font-black">
          Check your Supabase Storage for a bucket named "files" containing "Index.html"
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary !px-8 !py-3 text-xs font-black uppercase tracking-widest shadow-glow-purple active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">
      <div
        className="dynamic-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
