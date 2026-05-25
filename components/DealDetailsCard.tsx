'use client'

import { Mail, PhoneCall, Calendar, TrendingUp, Building2, DollarSign, Clock } from 'lucide-react'

interface DealDetailsCardProps {
  dealId: string
  clientName: string
  dealValue: number
  industry: string
  interactionCounts: Record<string, number>
  daysSinceLastInteraction: number
  lastInteraction: string
}

export default function DealDetailsCard({
  dealId,
  clientName,
  dealValue,
  industry,
  interactionCounts,
  daysSinceLastInteraction,
  lastInteraction,
}: DealDetailsCardProps) {
  const totalInteractions = Object.values(interactionCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Deal Info */}
      <div className="bg-dark-secondary/50 rounded-lg border border-purple-500/30 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Deal Information</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Deal ID</p>
              <p className="text-white font-mono">{dealId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Client</p>
              <p className="text-white">{clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Deal Value</p>
              <p className="text-white font-semibold">${(dealValue / 1000).toFixed(0)}K</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Industry</p>
              <p className="text-white">{industry}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-dark-secondary/50 rounded-lg border border-pink-500/30 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Engagement</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400">Emails</span>
            </div>
            <span className="text-white font-semibold">{interactionCounts.email || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-400" />
              <span className="text-gray-400">Meetings</span>
            </div>
            <span className="text-white font-semibold">{interactionCounts.meeting || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400">Calls</span>
            </div>
            <span className="text-white font-semibold">{interactionCounts.call || 0}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-gray-400">Days inactive</span>
            </div>
            <span className={`font-semibold ${daysSinceLastInteraction > 7 ? 'text-red-400' : daysSinceLastInteraction > 3 ? 'text-yellow-400' : 'text-green-400'}`}>
              {daysSinceLastInteraction}d
            </span>
          </div>
          <p className="text-xs text-gray-500 text-right mt-2">Last: {new Date(lastInteraction).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Total Interactions */}
      <div className="md:col-span-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Interactions</p>
            <p className="text-3xl font-bold text-white">{totalInteractions}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Engagement Score</p>
            <p className={`text-3xl font-bold ${totalInteractions > 10 ? 'text-green-400' : totalInteractions > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
              {Math.min(100, totalInteractions * 10)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
