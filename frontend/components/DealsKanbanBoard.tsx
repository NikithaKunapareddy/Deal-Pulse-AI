'use client'

import { PredictionResponse } from '@/lib/api'
import { TrendingUp, DollarSign, Briefcase, Award, AlertCircle, RefreshCw } from 'lucide-react'

interface DealsKanbanBoardProps {
  predictions: PredictionResponse[]
  loading?: boolean
}

export default function DealsKanbanBoard({ predictions, loading }: DealsKanbanBoardProps) {
  const STAGES = ['Prospecting', 'Engaging', 'Won', 'Lost']

  const stageConfigs = {
    Prospecting: {
      emoji: '🔍',
      title: 'Prospecting',
      gradient: 'from-blue-600 to-cyan-500',
      bgClass: 'bg-blue-950/20 border-blue-900/30',
      accentColor: 'border-blue-500/40 hover:border-blue-500/80',
      glow: 'shadow-blue-500/5',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    Engaging: {
      emoji: '💬',
      title: 'Engaging',
      gradient: 'from-yellow-500 to-orange-500',
      bgClass: 'bg-yellow-950/10 border-yellow-900/20',
      accentColor: 'border-yellow-500/40 hover:border-yellow-500/80',
      glow: 'shadow-yellow-500/5',
      badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    },
    Won: {
      emoji: '🎉',
      title: 'Won',
      gradient: 'from-green-500 to-emerald-500',
      bgClass: 'bg-emerald-950/20 border-emerald-900/30',
      accentColor: 'border-green-500/40 hover:border-green-500/80',
      glow: 'shadow-green-500/5',
      badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    },
    Lost: {
      emoji: '❌',
      title: 'Lost',
      gradient: 'from-red-500 to-pink-500',
      bgClass: 'bg-red-950/20 border-red-900/30',
      accentColor: 'border-red-500/40 hover:border-red-500/80',
      glow: 'shadow-red-500/5',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
  }

  // Group latest prediction for each unique deal_id
  const getUniqueDeals = () => {
    if (!predictions) return []
    const seen = new Set<string>()
    const unique: PredictionResponse[] = []
    
    // Predictions are usually chronological (latest first)
    predictions.forEach(pred => {
      if (pred.deal_id && !seen.has(pred.deal_id)) {
        seen.add(pred.deal_id)
        unique.push(pred)
      }
    })
    return unique
  }

  const uniqueDeals = getUniqueDeals()

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '$0'
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
    return `$${val}`
  }

  const getStageDeals = (stageName: string) => {
    return uniqueDeals.filter(d => d.predicted_stage === stageName)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 animate-pulse">
            <div className="h-6 w-24 bg-slate-800 rounded-lg"></div>
            <div className="h-28 bg-slate-800/40 rounded-xl"></div>
            <div className="h-28 bg-slate-800/40 rounded-xl"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
      {STAGES.map(stage => {
        const config = stageConfigs[stage as keyof typeof stageConfigs]
        const stageDeals = getStageDeals(stage)
        const totalValue = stageDeals.reduce((sum, d) => sum + (d.dealInfo?.dealValue || d.deal_value || 0), 0)

        return (
          <div
            key={stage}
            className={`flex flex-col rounded-2xl border backdrop-blur-md p-4 min-h-[500px] ${config.bgClass}`}
          >
            {/* Stage Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.emoji}</span>
                <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">{config.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-black border ${config.badge}`}>
                  {stageDeals.length}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Value</span>
                <p className="text-xs font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>

            {/* Deal Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-800">
              {stageDeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800/60 rounded-xl text-slate-600">
                  <span className="text-2xl mb-1 opacity-40">{config.emoji}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-60">No deals</span>
                </div>
              ) : (
                stageDeals.map((deal, idx) => {
                  const dealVal = deal.dealInfo?.dealValue || deal.deal_value || 0
                  const client = deal.dealInfo?.clientName || deal.client_name || 'Unknown Client'
                  const industry = deal.dealInfo?.industry || deal.industry
                  const confidence = Math.round(deal.confidence * 100)

                  return (
                    <div
                      key={deal.id || `${deal.deal_id}-${idx}`}
                      className={`group relative overflow-hidden rounded-xl border bg-slate-900/60 p-4 transition-all duration-300 hover:shadow-lg ${config.glow} ${config.accentColor}`}
                    >
                      {/* Glow Highlight Bar */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient}`}></div>

                      {/* Header info */}
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div>
                          <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">DEAL ID</p>
                          <h5 className="text-xs font-mono font-bold text-slate-300">{deal.deal_id}</h5>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">CONFIDENCE</span>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-xs font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                              {confidence}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Client / Deal value info */}
                      <div className="pl-2 space-y-1.5 mt-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">{client}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1 font-semibold text-purple-300">
                            <span>💰</span>
                            <span>{dealVal ? `$${dealVal.toLocaleString()}` : '$0'}</span>
                          </div>
                          {industry && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-400 border border-slate-700/50">
                              {industry}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Keywords / Top contributing words */}
                      {deal.top_words && deal.top_words.length > 0 && (
                        <div className="pl-2 mt-3 pt-2.5 border-t border-slate-800/80">
                          <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mb-1.5">Top Keywords</p>
                          <div className="flex flex-wrap gap-1">
                            {deal.top_words.slice(0, 3).map((w, wIdx) => (
                              <span
                                key={wIdx}
                                className="px-1.5 py-0.5 rounded bg-purple-950/20 text-[9px] font-medium text-purple-300 border border-purple-900/30"
                              >
                                {w.word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Creator badge */}
                      {deal.creator && (
                        <div className="pl-2 mt-3 pt-2 border-t border-slate-850 flex items-center justify-between text-[9px] text-slate-500 font-semibold">
                          <span>OWNER</span>
                          <span className="text-slate-400 uppercase">{deal.creator.name}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
