import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

import {
  getPollRows,
  groupPolls,
  createPoll,
  submitOption,
  closePoll,
  deletePoll,
  votePoll,
} from '../lib/polls'

// Preset colors to auto-assign as users add options
const PRESET_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export default function Polls({ isAdmin: isAdminProp = false }) {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(isAdminProp)

  const [expandedPolls, setExpandedPolls] = useState({})

  // Form State with Custom Option Colors
  const [question, setQuestion] = useState('')
  const [pollType, setPollType] = useState('A')
  const [options, setOptions] = useState([
    { label: '', color: PRESET_COLORS[0], image_url: '' },
    { label: '', color: PRESET_COLORS[1], image_url: '' },
  ])

  const [userOptionInput, setUserOptionInput] = useState({})

  useEffect(() => {
    checkAdminRole()
    fetchPolls()
  }, [isAdminProp])

  const togglePollExpand = (pollId) => {
    setExpandedPolls((prev) => ({
      ...prev,
      [pollId]: !prev[pollId],
    }))
  }

  async function checkAdminRole() {
    if (isAdminProp) {
      setIsAdmin(true)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ADMIN_EMAILS = ['admin@example.com', 'your-email@gmail.com']
      if (ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true)
        return
      }

      if (
        user?.app_metadata?.role === 'admin' ||
        user?.user_metadata?.role === 'admin' ||
        user?.app_metadata?.is_admin === true
      ) {
        setIsAdmin(true)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role === 'admin' || profile?.is_admin === true) {
        setIsAdmin(true)
      }
    } catch (err) {
      console.error('Error checking admin status:', err)
    }
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
    if (validOptions.length < 2) {
      return alert('Please provide at least 2 options.')
    }

    try {
      await createPoll(question, validOptions, pollType)
      setQuestion('')
      setPollType('A')
      setOptions([
        { label: '', color: PRESET_COLORS[0], image_url: '' },
        { label: '', color: PRESET_COLORS[1], image_url: '' },
      ])
      fetchPolls()
    } catch (err) {
      alert(`Error creating poll: ${err.message}`)
    }
  }

  const handleSubmitUserOption = async (pollId) => {
    const label = userOptionInput[pollId]
    if (!label || !label.trim()) return

    try {
      await submitOption(pollId, label.trim())
      alert('Option submitted! Waiting for admin approval.')
      setUserOptionInput({ ...userOptionInput, [pollId]: '' })
      fetchPolls()
    } catch (err) {
      alert(`Error submitting option: ${err.message}`)
    }
  }

  const handleVote = async (optionId, useCoin = false) => {
    try {
      await votePoll(optionId, useCoin)
      fetchPolls()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleClose = async (pollId) => {
    try {
      await closePoll(pollId)
      fetchPolls()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (pollId) => {
    if (!confirm('Are you sure you want to delete this poll?')) return
    try {
      await deletePoll(pollId)
      fetchPolls()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-4 text-center text-slate-400">Loading polls...</div>
  if (error) return <div className="p-4 text-center text-red-400">Error loading polls: {error}</div>

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      {/* ADMIN: CREATE POLL FORM WITH COLOR SELECTION */}
      {isAdmin && (
        <form onSubmit={handleCreatePoll} className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white space-y-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h2 className="text-xl font-bold">Create New Poll</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 font-medium">Admin Mode</span>
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium text-slate-300">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-semibold text-slate-300">Poll Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="pollType"
                  value="A"
                  checked={pollType === 'A'}
                  onChange={(e) => setPollType(e.target.value)}
                />
                <span><strong>Type A:</strong> Admin options only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="pollType"
                  value="B"
                  checked={pollType === 'B'}
                  onChange={(e) => setPollType(e.target.value)}
                />
                <span><strong>Type B:</strong> Users can suggest options</span>
              </label>
            </div>
          </div>

          {/* OPTIONS BUILDER WITH COLOR PICKER */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Initial Options & Colors</label>
            {options.map((opt, idx) => (
              <div key={idx} className="space-y-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/50">
                <div className="flex gap-2 items-center">
                  {/* COLOR PICKER INPUT */}
                  <input
                    type="color"
                    value={opt.color}
                    onChange={(e) => handleOptionChange(idx, 'color', e.target.value)}
                    className="w-9 h-9 p-0.5 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                    title="Choose Option Color"
                  />
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => handleOptionChange(idx, 'label', e.target.value)}
                    placeholder={`Option ${idx + 1} Label`}
                    className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOptionField(idx)}
                      className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={opt.image_url || ''}
                  onChange={(e) => handleOptionChange(idx, 'image_url', e.target.value)}
                  placeholder="Image URL (optional)"
                  className="w-full p-2 bg-slate-800/80 border border-slate-700/60 rounded-lg focus:outline-none focus:border-purple-500 text-xs text-slate-300"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addOptionField}
              className="text-sm text-purple-400 hover:underline mt-1 inline-block"
            >
              + Add another option
            </button>
          </div>

          <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-white transition-colors">
            Publish Poll
          </button>
        </form>
      )}

      {/* POLLS DISPLAY LIST */}
      <div className="space-y-4">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((acc, curr) => acc + (curr.vote_count || 0), 0)
          const isExpanded = !!expandedPolls[poll.id]

          return (
            <div key={poll.id} className="border border-slate-800 rounded-xl bg-slate-900 text-white shadow-md overflow-hidden transition-all">
              
              {/* QUESTION HEADER */}
              <div 
                onClick={() => togglePollExpand(poll.id)}
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-100">{poll.question}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {poll.type === 'B' ? 'Type B: Community Options Allowed' : 'Type A: Official Options Only'}
                    </span>
                    <span className="text-xs text-slate-400">{totalVotes} total votes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium">
                    {isExpanded ? 'Hide Options ▲' : 'View Options ▼'}
                  </button>
                </div>
              </div>

              {/* COLLAPSIBLE CONTENT */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-slate-800/60 space-y-4 mt-2">
                  {/* Options List */}
                  <div className="space-y-2 mt-4">
                    {poll.options.map((option, index) => {
                      const percentage = totalVotes > 0 
                        ? Math.round((option.vote_count / totalVotes) * 100) 
                        : 0
                      const isSelected = poll.my_option_id === option.id
                      const imageUrl = option.image_url || option.avatar_url || option.img_url
                      
                      // Fallback color if none saved in database
                      const optionColor = option.color || PRESET_COLORS[index % PRESET_COLORS.length]

                      return (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border relative overflow-hidden flex justify-between items-center transition-all ${
                            isSelected ? 'border-purple-500 bg-slate-800/80' : 'border-slate-800 bg-slate-800/40'
                          }`}
                        >
                          {/* VISUAL CUSTOM OPTION COLOR PROGRESS BAR */}
                          <div
                            className="absolute top-0 left-0 bottom-0 transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: optionColor,
                              opacity: 0.35, // Ensures text on top remains fully legible
                            }}
                          />

                          {/* OPTION LABEL & IMAGE */}
                          <div className="z-10 flex items-center gap-3">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={option.label}
                                className="w-10 h-10 rounded-md object-cover border border-slate-700 shadow-sm"
                              />
                            )}
                            <div className="flex items-center gap-2">
                              {/* Option Color Indicator Dot */}
                              <span
                                className="w-3 h-3 rounded-full inline-block shadow-sm"
                                style={{ backgroundColor: optionColor }}
                              />
                              <span className="font-medium text-sm text-slate-100">{option.label}</span>
                              {isSelected && <span className="text-purple-400 text-sm font-bold">✓</span>}
                            </div>
                          </div>

                          {/* VOTING BUTTONS & PERCENTAGE */}
                          <div className="z-10 flex items-center gap-3">
                            <span className="text-xs text-slate-300 font-mono">
                              {percentage}% · {option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'}
                            </span>

                            <button
                              onClick={() => handleVote(option.id, false)}
                              className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-md font-medium transition-colors shadow-sm"
                            >
                              {isSelected ? 'Change' : 'Vote'}
                            </button>

                            <button
                              onClick={() => handleVote(option.id, true)}
                              className="px-2.5 py-1 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-md font-medium flex items-center gap-1 transition-colors shadow-sm"
                            >
                              🪙 +1
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* USER INPUT FOR TYPE B POLLS */}
                  {poll.type === 'B' && !poll.closed_at && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <label className="block text-xs text-slate-400 mb-1">Suggest an option:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userOptionInput[poll.id] || ''}
                          onChange={(e) =>
                            setUserOptionInput({ ...userOptionInput, [poll.id]: e.target.value })
                          }
                          placeholder="Add your option..."
                          className="flex-1 px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-purple-500"
                        />
                        <button
                          onClick={() => handleSubmitUserOption(poll.id)}
                          className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ADMIN CONTROLS */}
                  {isAdmin && (
                    <div className="flex justify-end items-center text-xs text-slate-400 pt-3 border-t border-slate-800 gap-4">
                      <button onClick={() => handleClose(poll.id)} className="text-amber-400 hover:underline font-medium">
                        Close poll
                      </button>
                      <button onClick={() => handleDelete(poll.id)} className="text-red-400 hover:underline font-medium">
                        Delete
                      </button>
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