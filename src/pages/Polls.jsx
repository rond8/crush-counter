import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  getPollRows,
  groupPolls,
  createPoll,
  submitOption,
  closePoll,
  deletePoll,
  votePoll,
  uploadPollImage,
  joinContestPoll,
} from '../lib/polls'
import { timeAgo } from '../lib/time'

const PRESET_COLORS = ['#8B5CF6', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#D946EF']

export default function Polls() {
  const { profile } = useAuth()
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const [expandedPolls, setExpandedPolls] = useState({})
  const [question, setQuestion] = useState('')
  const [description, setDescription] = useState('')
  const [pollImage, setPollImage] = useState('')
  const [isUploadingPollImage, setIsUploadingPollImage] = useState(false)
  const [pollType, setPollType] = useState('A')
  const [options, setOptions] = useState([
    { label: '', color: PRESET_COLORS[0], image_url: '' },
    { label: '', color: PRESET_COLORS[1], image_url: '' },
  ])

  const [userOptionInput, setUserOptionInput] = useState({})
  const [showDescription, setShowDescription] = useState({})
  const [votingId, setVotingId] = useState(null)
  const [joiningContest, setJoiningContest] = useState(null)

  useEffect(() => {
    if (profile) {
      setIsAdmin(profile.is_admin === true)
    }
    fetchPolls()
  }, [profile])

  const togglePollExpand = (pollId) => {
    setExpandedPolls((prev) => ({
      ...prev,
      [pollId]: !prev[pollId],
    }))
  }

  const toggleDescription = (e, pollId) => {
    e.stopPropagation()
    setShowDescription((prev) => ({
      ...prev,
      [pollId]: !prev[pollId],
    }))
  }

  async function fetchPolls() {
    try {
      setLoading(true)
      const rows = await getPollRows()
      const grouped = groupPolls(rows)
      setPolls(grouped)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (index, field, value) => {
    const updated = [...options]
    updated[index][field] = value
    setOptions(updated)
  }

  const handleImageUpload = async (index, file) => {
    if (!file) return
    handleOptionChange(index, 'uploading', true)
    try {
      const publicUrl = await uploadPollImage(file)
      handleOptionChange(index, 'image_url', publicUrl)
    } catch (err) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      handleOptionChange(index, 'uploading', false)
    }
  }

  const addOptionField = () => {
    const nextColor = PRESET_COLORS[options.length % PRESET_COLORS.length]
    setOptions([...options, { label: '', color: nextColor, image_url: '' }])
  }

  const removeOptionField = (index) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleCreatePoll = async (e) => {
    e.preventDefault()
    if (!question.trim()) return alert('Please enter a question.')
    const validOptions = options.filter((o) => o.label.trim() !== '')
    if (validOptions.length < 2) return alert('Please provide at least 2 options.')

    try {
      await createPoll(question, validOptions, pollType, pollImage, description)
      setQuestion('')
      setDescription('')
      setPollImage('')
      setPollType('A')
      setOptions([
        { label: '', color: PRESET_COLORS[0], image_url: '' },
        { label: '', color: PRESET_COLORS[1], image_url: '' },
      ])
      fetchPolls()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handlePollImageUpload = async (file) => {
    if (!file) return
    setIsUploadingPollImage(true)
    try {
      const publicUrl = await uploadPollImage(file)
      setPollImage(publicUrl)
    } catch (err) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setIsUploadingPollImage(false)
    }
  }

  const handleSubmitUserOption = async (pollId) => {
    const label = userOptionInput[pollId]
    if (!label || !label.trim()) return
    try {
      await submitOption(pollId, label.trim())
      alert('Submitted for approval!')
      setUserOptionInput({ ...userOptionInput, [pollId]: '' })
      fetchPolls()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleVote = async (optionId, useCoin = false) => {
    setVotingId(optionId)
    try {
      await votePoll(optionId, useCoin)
      await fetchPolls()
    } catch (err) {
      alert(err.message)
    } finally {
      setVotingId(null)
    }
  }

  const handleJoinContest = async (pollId) => {
    if (!profile) return alert('Please log in first.')
    if (profile.coins < 10) return alert('You need 10 coins to join this contest.')
    if (!window.confirm('Join this weekly contest for 10 coins? You will be added as a candidate!')) return

    setJoiningContest(pollId)
    try {
      await joinContestPoll(pollId)
      alert('You have joined the contest!')
      fetchPolls()
    } catch (err) {
      alert(err.message)
    } finally {
      setJoiningContest(null)
    }
  }

  const handleClose = async (pollId) => {
    if (!window.confirm('Toggle close status for this poll?')) return
    try {
      await closePoll(pollId)
      fetchPolls()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (pollId) => {
    if (!window.confirm('Delete this poll and all its data? This cannot be undone.')) return
    try {
      await deletePoll(pollId)
      fetchPolls()
    } catch (err) {
      alert(err.message)
    }
  }

  const filteredPolls = polls.filter((poll) =>
    poll.question.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && polls.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-heart-purple border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted font-mono text-xs uppercase tracking-widest">Loading ranking data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-32">
      {/* K-POP JUICE STYLE HEADER */}
      <section className="text-center space-y-1 relative">
        <div className="absolute right-0 top-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
              showSearch
                ? 'bg-heart-purple border-heart-purple text-white shadow-glow-purple'
                : 'border-white/10 text-muted hover:border-heart-purple/40 hover:text-ink'
            }`}
            title="Search Rankings"
          >
            <span className="text-sm">🔍</span>
          </button>
        </div>
        <div className="inline-block bg-heart-purple/10 px-3 py-1 rounded-full border border-heart-purple/20 mb-2">
           <span className="text-[10px] font-black text-heart-purple uppercase tracking-[0.2em]">Community Ranking</span>
        </div>
        <h1 className="text-4xl font-display font-black text-ink italic tracking-tight">VOTING LIST</h1>
        <div className="h-1 w-20 bg-heart-purple mx-auto rounded-full" />
      </section>

      {/* Admin Form - Compacted */}
      {isAdmin && (
        <section className="card p-5 border-heart-purple/30 bg-midnight-surface/50 shadow-xl space-y-4">
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-muted hover:text-ink transition-colors"
          >
            Hide Admin Tools
          </button>
          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="relative group shrink-0">
                <div className={`w-16 h-16 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-heart-purple/50 ${pollImage ? 'border-solid border-heart-purple' : ''}`}>
                  {isUploadingPollImage ? (
                    <div className="w-4 h-4 border-2 border-heart-purple border-t-transparent rounded-full animate-spin" />
                  ) : pollImage ? (
                    <img src={pollImage} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🖼️</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handlePollImageUpload(e.target.files?.[0])}
                />
                {pollImage && (
                  <button
                    type="button"
                    onClick={() => setPollImage('')}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-heart-red rounded-full text-[10px] flex items-center justify-center shadow-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Topic Title (e.g. Best Visual of the Month)"
                className="flex-1 input-field !py-3 font-bold text-sm h-[64px]"
                required
              />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description or rules (optional)..."
              className="w-full input-field !py-3 text-xs min-h-[80px] resize-none"
            />
            <div className="grid gap-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5">
                  <input type="color" value={opt.color} onChange={(e) => handleOptionChange(idx, 'color', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                    placeholder={`Name ${idx + 1}`}
                    className="flex-1 bg-transparent border-none p-0 text-xs font-bold text-ink focus:ring-0"
                    required
                  />
                  <label className="cursor-pointer text-[9px] font-black text-heart-purple">
                    📷
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(idx, e.target.files?.[0])} />
                  </label>
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOptionField(idx)} className="text-muted hover:text-heart-red">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOptionField} className="text-[10px] font-black text-muted py-2 border border-dashed border-white/10 rounded-xl">+ Add Row</button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPollType('A')}
                className={`flex-1 py-2 text-[10px] font-black rounded-xl border transition-all ${pollType === 'A' ? 'bg-heart-purple text-white border-heart-purple' : 'bg-white/5 text-muted border-white/5'}`}
              >
                ADMIN ONLY
              </button>
              <button
                type="button"
                onClick={() => setPollType('B')}
                className={`flex-1 py-2 text-[10px] font-black rounded-xl border transition-all ${pollType === 'B' ? 'bg-heart-purple text-white border-heart-purple' : 'bg-white/5 text-muted border-white/5'}`}
              >
                USER SUGGEST
              </button>
              <button
                type="button"
                onClick={() => setPollType('W')}
                className={`flex-1 py-2 text-[10px] font-black rounded-xl border transition-all ${pollType === 'W' ? 'bg-heart-purple text-white border-heart-purple' : 'bg-white/5 text-muted border-white/5'}`}
              >
                WEEKLY CONTEST
              </button>
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-xs font-black uppercase shadow-glow-purple">Publish Ranking</button>
          </form>
        </section>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="relative animate-in slide-in-from-top-2 fade-in duration-300">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            type="text"
            autoFocus
            placeholder="SEARCH RANKINGS..."
            className="w-full bg-midnight-surface border border-midnight-border rounded-2xl py-3 pl-12 pr-4 text-xs font-black text-ink outline-none focus:ring-2 ring-heart-purple/40 transition-all uppercase placeholder:opacity-20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-[10px] font-black"
            >
              CLEAR
            </button>
          )}
        </div>
      )}

      {/* Rankings List */}
      <div className="space-y-8">
        {filteredPolls.map((poll) => {
          const totalVotes = poll.options.reduce((acc, curr) => acc + (curr.vote_count || 0), 0)
          const isExpanded = !!expandedPolls[poll.id]
          const isClosed = !!poll.closed_at

          // Sorted options for ranking
          const sortedOptions = [...poll.options].sort((a, b) => b.vote_count - a.vote_count)

          return (
            <div key={poll.id} className="space-y-4">
              {/* Poll Header Card */}
              <div
                onClick={() => togglePollExpand(poll.id)}
                className={`card p-6 bg-gradient-to-r from-heart-purple/10 to-transparent border-heart-purple/20 cursor-pointer hover:border-heart-purple/40 transition-all ${isClosed ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start">
                   <div className="flex gap-4">
                      {poll.image_url && (
                        <img src={poll.image_url} alt="" className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg shrink-0" />
                      )}
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded tracking-tighter uppercase ${poll.type === 'W' ? 'bg-amber-500' : 'bg-heart-purple'}`}>
                              {poll.type === 'W' ? 'Weekly Contest' : 'Topic'}
                            </span>
                            {isClosed && <span className="text-[10px] font-black bg-heart-red text-white px-2 py-0.5 rounded tracking-tighter uppercase">Closed</span>}
                            {poll.type === 'W' && !isClosed && (
                              <span className="text-[10px] font-black text-amber-500 animate-pulse uppercase tracking-widest">Prize: 500 🪙</span>
                            )}
                         </div>
                         <h3 className="text-2xl font-display font-black text-ink leading-none">{poll.question.toUpperCase()}</h3>
                         {poll.description && (
                            <div className="flex flex-col items-start gap-1">
                               <button
                                 onClick={(e) => toggleDescription(e, poll.id)}
                                 className="text-[9px] font-black text-heart-purple uppercase tracking-widest hover:underline"
                               >
                                 {showDescription[poll.id] ? 'Hide Info [-]' : 'Show Info [+]'}
                               </button>
                               {showDescription[poll.id] && (
                                 <p className="text-[11px] font-medium text-ink/70 bg-white/5 p-2 rounded-lg border border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                                   {poll.description}
                                 </p>
                               )}
                            </div>
                         )}
                         <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                           Total {totalVotes.toLocaleString()} Votes • {timeAgo(poll.created_at)}
                         </p>
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-full border-2 border-heart-purple/20 flex items-center justify-center text-heart-purple shrink-0">
                      {isExpanded ? '▲' : '▼'}
                   </div>
                </div>
              </div>

              {/* Ranking Rows */}
              {isExpanded && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  {sortedOptions.map((option, index) => {
                    const pct = totalVotes > 0 ? ((option.vote_count / totalVotes) * 100).toFixed(1) : '0.0'
                    const isSelected = poll.my_option_id === option.id
                    const isVoting = votingId === option.id
                    const rank = index + 1

                    // Vote Gap calculation
                    const nextOption = sortedOptions[index + 1]
                    const prevOption = sortedOptions[index - 1]
                    const gapToNext = nextOption ? option.vote_count - nextOption.vote_count : null
                    const gapToLeader = index > 0 ? sortedOptions[0].vote_count - option.vote_count : null

                    return (
                      <div key={option.id} className={`card p-3 flex items-center gap-3 border-white/5 relative overflow-hidden transition-all ${isSelected ? 'ring-2 ring-heart-purple border-transparent bg-heart-purple/5' : 'bg-midnight-surface/30'}`}>

                        {/* RANK NUMBER */}
                        <div className="w-8 text-center shrink-0">
                           <span className={`text-xl font-display font-black italic ${rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-700' : 'text-muted'}`}>
                              {rank}
                           </span>
                        </div>

                        {/* SUBJECT IMAGE */}
                        <div className="relative shrink-0">
                           {option.image_url ? (
                             <img src={option.image_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg" />
                           ) : (
                             <div className="w-12 h-12 rounded-full bg-heart-purple/20 border-2 border-heart-purple/10 flex items-center justify-center text-xl">🌟</div>
                           )}
                           {isSelected && (
                             <div className="absolute -top-1 -right-1 w-5 h-5 bg-heart-purple rounded-full flex items-center justify-center border-2 border-midnight shadow-lg">
                                <span className="text-[8px]">✅</span>
                             </div>
                           )}
                        </div>

                        {/* DATA & PROGRESS */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                           <div className="flex justify-between items-start gap-1">
                              <div className="min-w-0 flex-1">
                                 <h4 className="text-[13px] font-black text-ink truncate leading-none mb-1">{option.label.toUpperCase()}</h4>
                                 <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="text-[10px] font-mono font-black text-heart-purple">{pct}%</span>
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">({option.vote_count.toLocaleString()})</span>
                                    {gapToLeader !== null && (
                                      <span className="text-[9px] font-black text-heart-red uppercase whitespace-nowrap">-{gapToLeader.toLocaleString()}</span>
                                    )}
                                    {rank === 1 && totalVotes > 0 && (
                                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter animate-pulse">👑</span>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* BAR */}
                           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2">
                              <div
                                className="h-full bg-heart-purple rounded-full transition-all duration-1000 origin-left"
                                style={{ width: `${pct}%`, backgroundColor: option.color || '#8B5CF6' }}
                              />
                           </div>
                        </div>

                        {/* VOTE BUTTONS AREA */}
                        {!isClosed && (
                                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                                    <button
                                      onClick={() => handleVote(option.id, false)}
                                      disabled={isVoting || isSelected}
                                      className={`h-9 px-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${isSelected ? 'bg-heart-purple text-white opacity-50' : 'bg-white/10 text-ink hover:bg-heart-purple hover:text-white active:scale-95'}`}
                                    >
                                      {isVoting ? '...' : isSelected ? 'VOTED' : 'VOTE'}
                                    </button>

                                  <button
                                    onClick={() => handleVote(option.id, true)}
                                    disabled={isVoting}
                                    className="w-9 h-9 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-xl hover:bg-amber-400 hover:text-midnight transition-all active:scale-95 flex items-center justify-center shrink-0"
                                    title="Extra Vote (1 Coin)"
                                  >
                                    <span className="text-[10px] font-black">🪙</span>
                                  </button>
                                </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Join Contest Button for Type W */}
                  {poll.type === 'W' && !isClosed && (
                    <div className="pt-2 px-2">
                       <button
                         onClick={() => handleJoinContest(poll.id)}
                         disabled={joiningContest === poll.id}
                         className="w-full py-4 border-2 border-dashed border-amber-500/30 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 transition-all flex flex-col items-center gap-1 group"
                       >
                         <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
                         <span className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Join Weekly Contest</span>
                         <span className="text-[9px] font-bold text-muted uppercase">Entry Fee: 10 Coins • Winner gets 500 Coins</span>
                       </button>
                    </div>
                  )}

                  {/* Suggest Input for Type B */}
                  {poll.type === 'B' && !isClosed && (
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex gap-2">
                       <input
                         type="text"
                         value={userOptionInput[poll.id] || ''}
                         onChange={e => setUserOptionInput({...userOptionInput, [poll.id]: e.target.value})}
                         placeholder="SUGGEST CANDIDATE..."
                         className="flex-1 bg-transparent border-none text-xs font-black text-ink focus:ring-0 uppercase placeholder:opacity-20"
                       />
                       <button onClick={() => handleSubmitUserOption(poll.id)} className="text-[10px] font-black text-heart-purple uppercase tracking-widest hover:underline">Submit</button>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex justify-center gap-6 pt-4 border-t border-white/5">
                      <button onClick={() => handleClose(poll.id)} className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Toggle Close</button>
                      <button onClick={() => handleDelete(poll.id)} className="text-[10px] font-black text-heart-red uppercase tracking-widest">Delete Poll</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
