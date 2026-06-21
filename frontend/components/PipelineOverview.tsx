'use client'

import { useEffect, useState, useRef } from 'react'
import { fetchRecentPredictions } from '@/lib/api'
import { TrendingUp } from 'lucide-react'

const STAGE_CONFIG = [
  { name: 'Prospecting', emoji: '🔍', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { name: 'Engaging',    emoji: '💬', gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { name: 'Won',         emoji: '🎉', gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { name: 'Lost',        emoji: '❌', gradient: 'from-red-500 to-pink-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
]

export default function PipelineOverview() {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
    // Auto refresh every 30 seconds
    intervalRef.current = setInterval(loadData, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const loadData = async () => {
    try {
      const data = await fetchRecentPredictions()
      if (data?.predictions) setPredictions(data.predictions)
    } catch (e) {
      console.error('Pipeline overview fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  const stageCounts = STAGE_CONFIG.reduce((acc, s) => ({
    ...acc,
    [s.name]: predictions.filter(p => p.predicted_stage === s.name).length,
  }), {} as Record<string, number>)

  const total = predictions.length || 1
  const wonCount = stageCounts['Won'] || 0
  const lostCount = stageCounts['Lost'] || 0
  const finished = wonCount + lostCount
  const winRate = finished > 0 ? ((wonCount / finished) * 100).toFixed(1) : '0.0'

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 bg-slate-800/50 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {STAGE_CONFIG.map(({ name, emoji, gradient, bg, border }) => {
        const count = stageCounts[name] || 0
        const percent = (count / total) * 100

        return (
          <div key={name} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{emoji}</span>
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{count}</span>
                <span className="text-xs text-slate-500">({percent.toFixed(0)}%)</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/30">
              <div
                className={`h-full bg-gradient-to-r ${gradient} transition-all duration-700 rounded-full`}
                style={{ width: `${Math.max(percent, count > 0 ? 5 : 0)}%` }}
              />
            </div>
          </div>
        )
      })}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/50 mt-4">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3 text-center hover:border-green-500/40 transition-all">
          <p className="text-xs text-slate-400 mb-1">Win Rate</p>
          <p className="text-xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{winRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-3 text-center hover:border-purple-500/40 transition-all">
          <p className="text-xs text-slate-400 mb-1">Total Deals</p>
          <p className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{predictions.length}</p>
        </div>
      </div>

      {predictions.length === 0 && (
        <div className="text-center py-6 text-slate-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No predictions yet</p>
          <p className="text-xs mt-1">Make your first prediction to see pipeline data</p>
        </div>
      )}
    </div>
  )
}
