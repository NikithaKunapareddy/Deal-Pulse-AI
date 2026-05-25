import { PredictionResponse } from '@/lib/api'
import { TrendingUp } from 'lucide-react'

interface PipelineOverviewProps {
  predictions: PredictionResponse[]
}

export default function PipelineOverview({ predictions }: PipelineOverviewProps) {
  const stages = ['Prospecting', 'Engaging', 'Won', 'Lost']
  const stageEmojis = {
    Prospecting: '🔍',
    Engaging: '💬',
    Won: '🎉',
    Lost: '❌',
  }
  const stageColors = {
    Prospecting: 'from-blue-500 to-cyan-500',
    Engaging: 'from-yellow-500 to-orange-500',
    Won: 'from-green-500 to-emerald-500',
    Lost: 'from-red-500 to-pink-500',
  }

  const stageCounts = stages.reduce(
    (acc, stage) => ({
      ...acc,
      [stage]: predictions.filter((p) => p.predicted_stage === stage).length,
    }),
    {} as Record<string, number>
  )

  const total = predictions.length || 1
  const totalWon = stageCounts['Won']
  const winRate = total > 0 ? ((totalWon / total) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {stages.map((stage) => {
          const count = stageCounts[stage]
          const percent = (count / total) * 100
          const gradient = stageColors[stage as keyof typeof stageColors]
          const emoji = stageEmojis[stage as keyof typeof stageEmojis]

          return (
            <div key={stage} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">{stage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{count}</span>
                  <span className="text-xs text-gray-500">({percent.toFixed(0)}%)</span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30 group-hover:border-gray-500/50 transition-all">
                <div
                  className={`h-full bg-gradient-to-r ${gradient} transition-all duration-700 shadow-lg shadow-current`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-700/50">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 text-center hover:border-green-500/40 transition-all">
          <p className="text-xs text-gray-400 mb-1">Win Rate</p>
          <p className="text-xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{winRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3 text-center hover:border-purple-500/40 transition-all">
          <p className="text-xs text-gray-400 mb-1">Total Deals</p>
          <p className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{total}</p>
        </div>
      </div>

      {predictions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No predictions yet</p>
          <p className="text-xs mt-1">Make your first prediction to see pipeline data</p>
        </div>
      )}
    </div>
  )
}
