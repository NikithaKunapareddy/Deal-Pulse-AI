'use client'

import { Mail, PhoneCall, Calendar, MessageSquare, Clock } from 'lucide-react'
import { Interaction } from '@/lib/api'

interface InteractionTimelineProps {
  interactions: Interaction[]
}

export default function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'call':
        return <PhoneCall className="w-5 h-5" />
      case 'meeting':
        return <Calendar className="w-5 h-5" />
      case 'note':
        return <MessageSquare className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getColorForType = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
      case 'call':
        return 'bg-purple-500/20 border-purple-500/50 text-purple-400'
      case 'meeting':
        return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'note':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
    }
  }

  if (!interactions || interactions.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400">No interactions yet</p>
      </div>
    )
  }

  const sortedInteractions = [...interactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-4">
      {sortedInteractions.map((interaction, idx) => (
        <div key={idx} className="flex gap-4 pb-4 border-b border-gray-700/50 last:border-b-0">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${getColorForType(interaction.type)}`}>
            {getIconForType(interaction.type)}
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-grow">
                <h4 className="font-semibold text-white capitalize">
                  {interaction.type === 'call' && interaction.duration
                    ? `${interaction.subject} (${interaction.duration}m)`
                    : interaction.subject}
                </h4>
                {interaction.participant && (
                  <p className="text-sm text-gray-400">with {interaction.participant}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">{interaction.notes}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-gray-500">
                  {new Date(interaction.date).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(interaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
