import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function AdminAdmirers() {
  const { profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      navigate('/')
      return
    }

    const fetchList = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_admirer_list')
        if (error) throw error
        setList(data || [])
      } catch (err) {
        console.error('Error fetching admin admirer list:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (profile?.is_admin) {
      fetchList()
    }
  }, [profile, authLoading, navigate])

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-heart-purple"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-ink italic">Admirer Insights</h1>
          <p className="text-muted text-sm mt-1">Admin view: Users receiving the most hearts.</p>
        </div>
        <Link to="/settings" className="btn-secondary py-2 px-4 text-xs font-bold uppercase tracking-widest">
          Back
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-heart-red/10 border border-heart-red/20 rounded-2xl text-heart-red text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {list.length === 0 ? (
          <div className="card p-10 text-center text-muted italic">
            No active admirers found yet.
          </div>
        ) : (
          list.map((item) => (
            <Link
              key={item.username}
              to={`/u/${item.username}`}
              className="card p-4 flex items-center justify-between hover:scale-[1.01] transition-transform active:scale-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-midnight-border flex-shrink-0">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-black text-muted uppercase">
                      {item.username[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-ink leading-tight">
                    {item.display_name || item.username}
                  </h3>
                  <p className="text-muted text-xs font-mono">@{item.username}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-heart-purple leading-none">
                  {item.admirer_count}
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted mt-1">
                  Admirers
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
