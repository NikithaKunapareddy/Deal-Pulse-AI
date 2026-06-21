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

  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({})

  const toggleAction = (actionKey: string) => {
    setCheckedActions(prev => ({
      ...prev,
      [actionKey]: !prev[actionKey]
    }))
  }

  const recommendationConfigs: Record<string, { summary: string; actions: string[] }> = {
    'Prospecting': {
      summary: 'AI Recommendation: Prospecting detected. Follow up within 3 days to increase engagement.',
      actions: [
        '✉️ Send follow-up email with collateral',
        '📞 Schedule discovery call to understand pain points',
        '👥 Identify decision makers & key stakeholders',
      ],
    },
    'Engaging': {
      summary: 'AI Recommendation: Client is actively evaluating. Send proposal and arrange stakeholder meeting.',
      actions: [
        '💻 Schedule detailed product demo',
        '📄 Send tailored pricing proposal',
        '📂 Share technical documents & customer case studies',
      ],
    },
    'Won': {
      summary: 'AI Recommendation: Deal successfully won! Begin onboarding and project initiation.',
      actions: [
        '✍️ Send final contract & billing details',
        '📢 Notify implementation & customer success teams',
        '🤝 Schedule onboarding kickoff meeting',
        '📊 Mark revenue forecast as secured in CRM',
      ],
    },
    'Lost': {
      summary: 'AI Recommendation: Deal marked as lost. Capture insights and schedule future re-engagement.',
      actions: [
        '🔍 Capture detailed loss reason (competitor, budget, features)',
        '📢 Notify sales manager for post-mortem review',
        '⏰ Create re-engagement reminder in calendar for 90 days',
      ],
    },
  }

  const rec = recommendationConfigs[result.predicted_stage] || {
    summary: 'AI Recommendation: Review deal progress and establish next steps.',
    actions: ['✉️ Follow up with client', '📅 Update CRM timeline'],
  }

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

      {/* AI Next Best Action Card */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-8">
        <h4 className="text-lg font-semibold text-gray-300 mb-2 flex items-center gap-2">
          <span>🧠</span> AI Next Best Action
        </h4>
        <p className="text-sm font-semibold text-purple-300 mb-4 bg-purple-950/20 border border-purple-900/30 p-3 rounded-lg">
          {rec.summary}
        </p>
        <div className="space-y-3">
          {rec.actions.map((action, index) => {
            const actionKey = `${result.deal_id}-${result.predicted_stage}-${index}`
            const isChecked = !!checkedActions[actionKey]
            return (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  isChecked
                    ? 'border-green-500/30 bg-green-500/5 text-slate-500 line-through'
                    : 'border-slate-800 bg-slate-900/30 text-slate-300 hover:border-purple-500/30 hover:bg-slate-900/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAction(actionKey)}
                  className="rounded border-slate-700 bg-slate-850 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 w-4 h-4"
                />
                <span className="text-sm font-medium">{action}</span>
              </label>
            )
          })}
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
