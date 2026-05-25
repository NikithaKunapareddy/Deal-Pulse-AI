import { PredictionResponse } from '@/lib/api'
import { TrendingUp, Package } from 'lucide-react'

interface RecentPredictionsProps {
  predictions: PredictionResponse[]
  loading?: boolean
}

export default function RecentPredictions({
  predictions,
  loading,
}: RecentPredictionsProps) {
  const stageEmojis = {
    Prospecting: '🔍',
    Engaging: '💬',
    Won: '🎉',
    Lost: '❌',
  }

  const stageColors = {
    Prospecting: 'text-blue-300 bg-blue-500/15 border-blue-500/40',
    Engaging: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/40',
    Won: 'text-green-300 bg-green-500/15 border-green-500/40',
    Lost: 'text-red-300 bg-red-500/15 border-red-500/40',
  }

  const confidenceStatusColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500/30 text-green-300 border-green-500/50'
    if (percent >= 60) return 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50'
    return 'bg-red-500/30 text-red-300 border-red-500/50'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 text-gray-500">
          <div className="inline-block w-8 h-8 border-3 border-gray-700 border-t-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">Loading predictions...</p>
        </div>
      </div>
    )
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">No predictions yet</p>
        <p className="text-xs mt-1">Your predictions will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {predictions.map((prediction, idx) => {
        const emoji =
          stageEmojis[prediction.predicted_stage as keyof typeof stageEmojis] ||
          '📊'
        const stageColor =
          stageColors[prediction.predicted_stage as keyof typeof stageColors] ||
          'text-gray-300 bg-gray-500/15 border-gray-500/40'
        const confidencePercent = Math.round(prediction.confidence * 100)
        const statusColor = confidenceStatusColor(confidencePercent)

        return (
          <div
            key={idx}
            className="group relative overflow-hidden rounded-xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
          >
            {/* Hover Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Content */}
            <div className="relative bg-gradient-to-br from-[#1a0a2e]/50 to-[#16213e]/50 backdrop-blur-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Deal ID */}
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500 mb-1 font-medium">DEAL ID</p>
                  <p className="text-sm font-mono text-gray-300 font-semibold">{prediction.deal_id}</p>
                </div>

                {/* Stage Badge */}
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">STAGE</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${stageColor}`}>
                    <span className="text-base">{emoji}</span>
                    {prediction.predicted_stage}
                  </span>
                </div>
              </div>

              {/* Confidence & Status */}
              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1 font-medium">CONFIDENCE</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                      {confidencePercent}
                    </span>
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1 font-medium">STATUS</p>
                  <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 whitespace-nowrap ${statusColor}`}>
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor:
                          confidencePercent >= 80
                            ? '#4ade80'
                            : confidencePercent >= 60
                            ? '#fbbf24'
                            : '#f87171',
                      }}
                    ></div>
                    {confidencePercent >= 80
                      ? '✅ Confident'
                      : confidencePercent >= 60
                      ? '⚠️ Moderate'
                      : '❓ Low'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-500">
        <div>Showing <span className="font-bold text-gray-400">{predictions.length}</span> recent {predictions.length === 1 ? 'prediction' : 'predictions'}</div>
        <div>
          <span className="text-purple-400 font-semibold">{predictions.filter(p => p.confidence >= 0.8).length}</span> High Confidence
        </div>
      </div>
    </div>
  )
}
