import { PredictionResponse } from '@/lib/api'
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'
import DealDetailsCard from './DealDetailsCard'
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

interface ExtendedPredictionResponse extends PredictionResponse {
  dealInfo?: DealInfo
  interactions?: Interaction[]
}

interface PredictionResultProps {
  result: ExtendedPredictionResponse
  onNewPrediction: () => void
}

export default function PredictionResult({
  result,
  onNewPrediction,
}: PredictionResultProps) {
  const stageColors: Record<string, string> = {
    'Prospecting': 'from-blue-500 to-blue-600',
    'Engaging': 'from-yellow-500 to-yellow-600',
    'Won': 'from-green-500 to-green-600',
    'Lost': 'from-red-500 to-red-600',
  }

  const stageEmojis: Record<string, string> = {
    'Prospecting': '🔍',
    'Engaging': '💬',
    'Won': '🎉',
    'Lost': '❌',
  }

  const gradient = stageColors[result.predicted_stage] || 'from-purple to-pink-500'
  const emoji = stageEmojis[result.predicted_stage] || '📊'
  const confidencePercent = Math.round(result.confidence * 100)

  // Calculate interaction counts
  const interactionCounts = {
    email: result.interactions?.filter(i => i.type === 'email').length || 0,
    meeting: result.interactions?.filter(i => i.type === 'meeting').length || 0,
    call: result.interactions?.filter(i => i.type === 'call').length || 0,
    note: result.interactions?.filter(i => i.type === 'note').length || 0,
  }

  const daysSinceLastInteraction = result.interactions?.length
    ? Math.floor((Date.now() - new Date(result.interactions[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const lastInteraction = result.interactions?.[0]?.date || new Date().toISOString()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🎯 Prediction Result</h2>
        <button
          onClick={onNewPrediction}
          className="px-4 py-2 rounded-lg border border-purple/30 text-purple-300 hover:bg-purple/10 transition-all text-sm font-medium"
        >
          ✨ New Prediction
        </button>
      </div>

      {/* Deal Details Card */}
      {result.dealInfo && (
        <DealDetailsCard
          dealId={result.dealInfo.dealId}
          clientName={result.dealInfo.clientName}
          dealValue={result.dealInfo.dealValue}
          industry={result.dealInfo.industry}
          interactionCounts={interactionCounts}
          daysSinceLastInteraction={daysSinceLastInteraction}
          lastInteraction={lastInteraction}
        />
      )}

      {/* Stage Prediction Card */}
      <div className={`rounded-xl p-8 bg-gradient-to-r ${gradient} bg-opacity-15 border border-current border-opacity-30`}>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{emoji}</span>
          <div>
            <p className="text-sm text-gray-400">Predicted Pipeline Stage</p>
            <h3 className="text-3xl font-bold text-white">{result.predicted_stage}</h3>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Model Confidence</span>
            <span className="text-lg font-bold text-white">{confidencePercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {confidencePercent >= 80 ? '✅ High confidence prediction' : confidencePercent >= 60 ? '⚠️ Moderate confidence' : '❓ Low confidence - review manually'}
          </p>
        </div>
      </div>

      {/* All Scores */}
      <div className="rounded-xl border border-purple/20 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-8">
        <h4 className="text-lg font-semibold text-gray-300 mb-4">📊 Stage Probability Scores</h4>
        <div className="space-y-3">
          {Object.entries(result.all_scores).map(([stage, score]) => {
            const percent = Math.round(score * 100)
            const isSelected = stage === result.predicted_stage
            return (
              <div
                key={stage}
                className={`p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-purple/50 bg-purple/10'
                    : 'border-gray-700 bg-gray-900/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">{stage}</span>
                  <span className="text-sm font-bold text-purple-300">{percent}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Factors */}
      {result.top_words && result.top_words.length > 0 && (
        <div className="rounded-xl border border-purple/20 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-8">
          <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            Key Factors Influencing Prediction
          </h4>
          <p className="text-sm text-gray-400 mb-4">These are the most important words from your CRM notes that influenced the stage prediction:</p>
          <div className="flex flex-wrap gap-2">
            {result.top_words.slice(0, 15).map((item, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-full bg-purple/20 border border-purple/40 text-purple-200 text-sm hover:bg-purple/30 transition-colors cursor-help"
                title={`Impact score: ${(item.score * 100).toFixed(1)}%`}
              >
                {item.word}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Timeline */}
      {result.interactions && result.interactions.length > 0 && (
        <div className="rounded-xl border border-pink/20 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-8">
          <h4 className="text-lg font-semibold text-gray-300 mb-4">📅 Interaction Timeline</h4>
          <InteractionTimeline interactions={result.interactions} />
        </div>
      )}

      {/* Deal Summary */}
      <div className="rounded-xl border border-gray-700 bg-gray-900/30 p-6">
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-white">Deal ID:</span> <span className="text-purple-300 font-mono">{result.deal_id}</span>
        </p>
        {result.dealInfo && (
          <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Client:</span> <span className="text-white ml-2">{result.dealInfo.clientName}</span>
            </div>
            <div>
              <span className="text-gray-400">Deal Value:</span> <span className="text-green-400 ml-2">${(result.dealInfo.dealValue / 1000).toFixed(0)}K</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
