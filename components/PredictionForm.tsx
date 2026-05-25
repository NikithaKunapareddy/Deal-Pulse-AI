'use client'

import { useState } from 'react'
import { Mail, PhoneCall, Calendar, MessageSquare, Plus, Loader2 } from 'lucide-react'
import { predict } from '@/lib/api'
import PredictionResult from './PredictionResult'
import InteractionTimeline from './InteractionTimeline'

interface Interaction {
  type: 'email' | 'meeting' | 'call' | 'note'
  date: string
  subject: string
  duration?: number
  notes: string
  participant?: string
}

interface DealInfo {
  dealId: string
  clientName: string
  dealValue: number
  industry: string
}

interface PredictionFormProps {
  onPredictionComplete?: () => void
}

export default function PredictionForm({ onPredictionComplete }: PredictionFormProps) {
  const [dealInfo, setDealInfo] = useState<DealInfo>({
    dealId: '',
    clientName: '',
    dealValue: 0,
    industry: '',
  })

  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [newInteraction, setNewInteraction] = useState<Interaction>({
    type: 'email',
    date: new Date().toISOString().split('T')[0],
    subject: '',
    notes: '',
  })

  const addInteraction = () => {
    if (newInteraction.subject.trim()) {
      setInteractions([...interactions, { ...newInteraction }])
      setNewInteraction({
        type: 'email',
        date: new Date().toISOString().split('T')[0],
        subject: '',
        notes: '',
      })
      setShowInteractionForm(false)
    }
  }

  const removeInteraction = (idx: number) => {
    setInteractions(interactions.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealInfo.dealId.trim()) {
      setError('Please enter a Deal ID')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Build comprehensive CRM notes from all data
      let crmNotes = `Client: ${dealInfo.clientName || 'Unknown'}\n`
      crmNotes += `Deal Value: $${dealInfo.dealValue || 0}\n`
      crmNotes += `Industry: ${dealInfo.industry || 'Unknown'}\n\n`
      crmNotes += `Interaction History:\n`

      interactions.forEach((int) => {
        crmNotes += `- ${int.date} [${int.type.toUpperCase()}] ${int.subject}`
        if (int.participant) crmNotes += ` with ${int.participant}`
        if (int.duration) crmNotes += ` (${int.duration}m)`
        crmNotes += `\n  ${int.notes}\n`
      })

      const response = await predict({
        deal_id: dealInfo.dealId,
        crm_notes: crmNotes,
      })

      setResult({
        ...response,
        dealInfo,
        interactions,
      })

      onPredictionComplete?.()
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to get prediction. Is the backend running?'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setDealInfo({ dealId: '', clientName: '', dealValue: 0, industry: '' })
    setInteractions([])
    setResult(null)
    setError('')
  }

  if (result) {
    return <PredictionResult result={result} onNewPrediction={handleReset} />
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal Information */}
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-8">
          <h2 className="text-2xl font-bold mb-6 text-white">💼 Deal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Deal ID *</label>
              <input
                type="text"
                value={dealInfo.dealId}
                onChange={(e) => setDealInfo({ ...dealInfo, dealId: e.target.value })}
                placeholder="e.g., DEAL-2024-001"
                className="w-full bg-[#0a0015] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Client Name</label>
              <input
                type="text"
                value={dealInfo.clientName}
                onChange={(e) => setDealInfo({ ...dealInfo, clientName: e.target.value })}
                placeholder="e.g., Acme Corporation"
                className="w-full bg-[#0a0015] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Deal Value ($)</label>
              <input
                type="number"
                value={dealInfo.dealValue}
                onChange={(e) => setDealInfo({ ...dealInfo, dealValue: Number(e.target.value) })}
                placeholder="e.g., 50000"
                className="w-full bg-[#0a0015] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
              <input
                type="text"
                value={dealInfo.industry}
                onChange={(e) => setDealInfo({ ...dealInfo, industry: e.target.value })}
                placeholder="e.g., Technology"
                className="w-full bg-[#0a0015] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Interactions Section */}
        <div className="rounded-xl border border-pink-500/30 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">📧 Interactions & Activities</h2>
            <button
              type="button"
              onClick={() => setShowInteractionForm(!showInteractionForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {showInteractionForm && (
            <div className="bg-[#0a0015] rounded-lg border border-gray-700 p-4 mb-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={newInteraction.type}
                    onChange={(e) =>
                      setNewInteraction({
                        ...newInteraction,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full bg-[#16213e] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none"
                  >
                    <option value="email">📧 Email</option>
                    <option value="meeting">📅 Meeting</option>
                    <option value="call">☎️ Call</option>
                    <option value="note">📝 Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={newInteraction.date}
                    onChange={(e) => setNewInteraction({ ...newInteraction, date: e.target.value })}
                    className="w-full bg-[#16213e] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject / Title *</label>
                <input
                  type="text"
                  value={newInteraction.subject}
                  onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                  placeholder="e.g., Initial discovery call with procurement team"
                  className="w-full bg-[#16213e] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Participant/Contact</label>
                  <input
                    type="text"
                    value={newInteraction.participant || ''}
                    onChange={(e) => setNewInteraction({ ...newInteraction, participant: e.target.value })}
                    placeholder="e.g., John Smith, CTO"
                    className="w-full bg-[#16213e] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none"
                  />
                </div>
                {(newInteraction.type === 'call' || newInteraction.type === 'meeting') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newInteraction.duration || ''}
                      onChange={(e) => setNewInteraction({ ...newInteraction, duration: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g., 30"
                      className="w-full bg-[#16213e] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes / Summary</label>
                <textarea
                  value={newInteraction.notes}
                  onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                  placeholder="Key points discussed, next steps, outcomes, etc."
                  rows={3}
                  className="w-full bg-[#16213e] rounded border border-purple/30 text-white px-4 py-2 focus:border-purple-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addInteraction}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Add Interaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowInteractionForm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {interactions.length > 0 && <InteractionTimeline interactions={interactions} />}

          {interactions.length === 0 && !showInteractionForm && (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Add meetings, emails, calls, and notes to track deal progress</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Deal...
            </>
          ) : (
            '🚀 Get Stage Prediction'
          )}
        </button>
      </form>
    </div>
  )
}
