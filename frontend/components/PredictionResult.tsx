'use client'

import { useState, useEffect } from 'react'
import { PredictionResponse } from '@/lib/api'
import { HelpCircle, Bell, CheckCircle2, ChevronRight } from 'lucide-react'
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

// ─── Stage Config ─────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, {
  gradient: string
  bg: string
  border: string
  emoji: string
  accentText: string
  recommendation: string
  actions: { label: string; icon: string; priority: 'high' | 'medium' | 'low' }[]
  workflowStep: number
  notifyManager: boolean
}> = {
  Prospecting: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-950/30',
    border: 'border-blue-500/25',
    emoji: '🔍',
    accentText: 'text-blue-300',
    recommendation: 'Prospecting detected. Follow up within 3 days to significantly increase conversion probability.',
    actions: [
      { label: 'Send follow-up email with product collateral', icon: '✉️', priority: 'high' },
      { label: 'Schedule discovery call to understand pain points', icon: '📞', priority: 'high' },
      { label: 'Identify decision makers & key stakeholders', icon: '👥', priority: 'medium' },
    ],
    workflowStep: 1,
    notifyManager: false,
  },
  Engaging: {
    gradient: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-950/20',
    border: 'border-yellow-500/25',
    emoji: '💬',
    accentText: 'text-yellow-300',
    recommendation: 'Client is actively evaluating. Send your proposal and arrange a stakeholder meeting this week.',
    actions: [
      { label: 'Schedule detailed product demo', icon: '💻', priority: 'high' },
      { label: 'Send tailored pricing proposal', icon: '📄', priority: 'high' },
      { label: 'Share technical documents & case studies', icon: '📂', priority: 'medium' },
    ],
    workflowStep: 2,
    notifyManager: false,
  },
  Won: {
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-950/20',
    border: 'border-green-500/25',
    emoji: '🎉',
    accentText: 'text-green-300',
    recommendation: 'Deal successfully won! Begin onboarding and initiate project. Manager has been notified.',
    actions: [
      { label: 'Send final contract & billing details', icon: '✍️', priority: 'high' },
      { label: 'Notify implementation & customer success teams', icon: '📢', priority: 'high' },
      { label: 'Schedule onboarding kickoff meeting', icon: '🤝', priority: 'high' },
      { label: 'Mark revenue forecast as secured in CRM', icon: '📊', priority: 'medium' },
    ],
    workflowStep: 4,
    notifyManager: true,
  },
  Lost: {
    gradient: 'from-red-500 to-pink-600',
    bg: 'bg-red-950/20',
    border: 'border-red-500/25',
    emoji: '❌',
    accentText: 'text-red-300',
    recommendation: 'Deal marked as lost. Capture insights for post-mortem. Schedule a re-engagement reminder in 90 days.',
    actions: [
      { label: 'Capture detailed loss reason (competitor / budget / features)', icon: '🔍', priority: 'high' },
      { label: 'Notify sales manager for post-mortem review', icon: '📢', priority: 'high' },
      { label: 'Create re-engagement calendar reminder (90 days)', icon: '⏰', priority: 'medium' },
    ],
    workflowStep: 3,
    notifyManager: true,
  },
}

const WORKFLOW_STEPS = [
  { label: 'CRM Notes', icon: '📝' },
  { label: 'AI Predicts Stage', icon: '🤖' },
  { label: 'Confidence Score', icon: '🎯' },
  { label: 'Recommendations', icon: '🧠' },
  { label: 'Tasks Created', icon: '✅' },
  { label: 'Dashboard Updated', icon: '📊' },
  { label: 'Manager Notified', icon: '🔔' },
]

const PRIORITY_STYLES = {
  high: 'border-red-500/30 bg-red-950/10',
  medium: 'border-yellow-500/30 bg-yellow-950/10',
  low: 'border-slate-700 bg-slate-900/20',
}

export default function PredictionResult({ result, onNewPrediction }: PredictionResultProps) {
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({})
  const [showNotification, setShowNotification] = useState(false)
  const [workflowProgress, setWorkflowProgress] = useState(0)

  const config = STAGE_CONFIG[result.predicted_stage] || STAGE_CONFIG['Prospecting']
  const confidencePercent = Math.round(result.confidence * 100)

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

  // Animate the workflow pipeline steps on mount
  useEffect(() => {
    let step = 0
    const maxSteps = config.notifyManager ? WORKFLOW_STEPS.length : WORKFLOW_STEPS.length - 1
    const interval = setInterval(() => {
      step++
      setWorkflowProgress(step)
      if (step >= maxSteps) clearInterval(interval)
    }, 350)
    return () => clearInterval(interval)
  }, [result.deal_id, config.notifyManager])

  // Show manager notification popup for Won / Lost
  useEffect(() => {
    if (config.notifyManager) {
      const t = setTimeout(() => setShowNotification(true), 1800)
      return () => clearTimeout(t)
    }
  }, [result.deal_id, config.notifyManager])

  const toggleAction = (key: string) => {
    setCheckedActions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const totalActions = config.actions.length
  const completedActions = config.actions.filter((_, i) => checkedActions[`${result.deal_id}-${i}`]).length

  return (
    <div className="space-y-6">
      {/* Manager Notification Toast */}
      {showNotification && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 animate-pulse-once">
          <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-300">
              {result.predicted_stage === 'Won' ? '🎉 Manager Notified — Deal Won!' : '⚠️ Manager Notified — Deal Lost'}
            </p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              {result.predicted_stage === 'Won'
                ? `${result.dealInfo?.clientName || result.deal_id} has been flagged for revenue recognition and onboarding.`
                : `${result.dealInfo?.clientName || result.deal_id} has been flagged for post-mortem and re-engagement planning.`}
            </p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-amber-500 hover:text-amber-300 text-lg leading-none">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🎯 Prediction Result</h2>
        <button
          onClick={onNewPrediction}
          className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-all text-sm font-semibold"
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

      {/* ── Predicted Stage Card ─────────────────────────────── */}
      <div className={`rounded-xl p-7 ${config.bg} border ${config.border}`}>
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-3xl shadow-lg`}>
            {config.emoji}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Predicted Pipeline Stage</p>
            <h3 className={`text-3xl font-black ${config.accentText}`}>{result.predicted_stage}</h3>
          </div>
        </div>

        {/* Confidence Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Confidence</span>
            <span className="text-sm font-black text-white">{confidencePercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-700 rounded-full`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {confidencePercent >= 80 ? '✅ High confidence prediction' : confidencePercent >= 60 ? '⚠️ Moderate confidence' : '❓ Low confidence — review manually'}
          </p>
        </div>
      </div>

      {/* ── Enterprise CRM Workflow Pipeline ─────────────────── */}
      <div className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-950 p-6">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
          <span>⚡</span> Enterprise CRM Workflow
        </h4>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = workflowProgress > idx
            const isCurrent = workflowProgress === idx + 1
            return (
              <div key={idx} className="flex items-center">
                <div className={`flex flex-col items-center text-center transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-25'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                    isActive
                      ? isCurrent
                        ? `border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30 scale-110`
                        : 'border-green-500/50 bg-green-500/10'
                      : 'border-slate-700 bg-slate-900'
                  }`}>
                    {isActive && !isCurrent ? '✅' : step.icon}
                  </div>
                  <p className={`text-[9px] font-semibold mt-2 max-w-[60px] leading-tight ${isActive ? 'text-slate-300' : 'text-slate-600'}`}>
                    {step.label}
                  </p>
                </div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 -mt-5 transition-all duration-500 ${workflowProgress > idx + 1 ? 'bg-green-500/40' : 'bg-slate-800'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── AI Next Best Action ───────────────────────────────── */}
      <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-[#130a24] to-[#0f1629] p-7">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              🧠 AI Next Best Action
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">AI-generated tasks based on predicted deal stage</p>
          </div>
          {/* Task progress ring */}
          <div className="flex-shrink-0 relative w-12 h-12">
            <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e1b3a" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#a855f7"
                strokeWidth="3"
                strokeDasharray={`${totalActions > 0 ? (completedActions / totalActions) * 100 : 0} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-purple-300">{completedActions}/{totalActions}</span>
            </div>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        <div className={`flex gap-3 p-4 rounded-xl mb-5 ${config.bg} border ${config.border}`}>
          <span className="text-2xl flex-shrink-0">{config.emoji}</span>
          <p className={`text-sm font-semibold ${config.accentText} leading-relaxed`}>
            {config.recommendation}
          </p>
        </div>

        {/* Action Checklist */}
        <div className="space-y-2.5">
          {config.actions.map((action, index) => {
            const key = `${result.deal_id}-${index}`
            const isChecked = !!checkedActions[key]
            return (
              <label
                key={index}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group ${
                  isChecked
                    ? 'border-green-500/30 bg-green-950/15'
                    : `${PRIORITY_STYLES[action.priority]} hover:border-purple-500/40 hover:bg-purple-950/10`
                }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  isChecked ? 'bg-green-500 border-green-500' : 'border-slate-600 group-hover:border-purple-500'
                }`}>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAction(key)}
                  className="sr-only"
                />
                <span className="text-xl flex-shrink-0">{action.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold transition-colors ${isChecked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {action.label}
                  </span>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                  action.priority === 'high' ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                  : action.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                  : 'bg-slate-700/30 text-slate-500 border border-slate-700'
                }`}>
                  {action.priority}
                </span>
              </label>
            )
          })}
        </div>

        {/* Completed message */}
        {completedActions === totalActions && totalActions > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-center">
            <span className="text-green-400 text-sm font-bold">🎉 All actions completed! Great work.</span>
          </div>
        )}
      </div>

      {/* ── Stage Probability Scores ──────────────────────────── */}
      <div className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-7">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">📊 Stage Probability Scores</h4>
        <div className="space-y-3">
          {Object.entries(result.all_scores).map(([stage, score]) => {
            const pct = Math.round(score * 100)
            const isWinner = stage === result.predicted_stage
            const cfg = STAGE_CONFIG[stage]
            return (
              <div key={stage} className={`p-3 rounded-lg border transition-all ${isWinner ? 'border-purple-500/40 bg-purple-500/8' : 'border-slate-800 bg-slate-900/20'}`}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                    {cfg?.emoji} {stage}
                    {isWinner && <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">predicted</span>}
                  </span>
                  <span className="text-sm font-black text-purple-300">{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${cfg?.gradient || 'from-purple-500 to-pink-500'} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Key Factors ───────────────────────────────────────── */}
      {result.top_words && result.top_words.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-7">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            Key Factors Influencing Prediction
          </h4>
          <p className="text-xs text-slate-500 mb-4">Top keywords from your CRM notes that drove this prediction:</p>
          <div className="flex flex-wrap gap-2">
            {result.top_words.slice(0, 15).map((item, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors cursor-help"
                title={`Impact score: ${(item.score * 100).toFixed(1)}%`}
              >
                {item.word}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Interaction Timeline ──────────────────────────────── */}
      {result.interactions && result.interactions.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-[#1a0a2e] to-[#16213e] p-7">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">📅 Interaction Timeline</h4>
          <InteractionTimeline interactions={result.interactions} />
        </div>
      )}

      {/* ── Deal Summary Footer ───────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Deal ID</span>
            <p className="text-purple-300 font-mono font-bold">{result.deal_id}</p>
          </div>
          {result.dealInfo && (
            <>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Client</span>
                <p className="text-white font-semibold">{result.dealInfo.clientName}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Value</span>
                <p className="text-green-400 font-black">${(result.dealInfo.dealValue / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Industry</span>
                <p className="text-slate-300 font-semibold">{result.dealInfo.industry}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
