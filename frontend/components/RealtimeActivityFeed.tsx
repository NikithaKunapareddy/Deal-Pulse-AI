'use client'

import { useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { subscribeToStream, fetchActivityFeed, ActivityItem } from '@/lib/api'
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface StreamEvent {
  type: string
  prediction_id?: number
  deal_id?: string
  client_name?: string
  predicted_stage?: string
  confidence?: number
  user_id?: number
  timestamp?: string
}

const stageIcons = {
  Prospecting: <Clock className="w-4 h-4" />,
  Engaging: <TrendingUp className="w-4 h-4" />,
  Won: <CheckCircle2 className="w-4 h-4" />,
  Lost: <AlertCircle className="w-4 h-4" />,
}

export default function RealtimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initial load
    loadActivities()

    // Subscribe to real-time updates via SSE
    const eventSource = subscribeToStream(
      (event: StreamEvent) => {
        if (event.type === 'connected') {
          setIsConnected(true)
          console.log('✅ Connected to live stream')
        } else if (event.type === 'prediction_created') {
          // Show toast notification
          const confidence = Math.round((event.confidence || 0) * 100)
          toast.success(
            `🔔 New prediction: ${event.client_name} → ${event.predicted_stage} (${confidence}% confidence)`,
            { duration: 5000 }
          )
          // Reload activities to show new one
          loadActivities()
        }
      },
      (error) => {
        console.error('Stream error:', error)
        setIsConnected(false)
        // Fallback to polling every 10 seconds
        startPolling()
      }
    )

    if (eventSource) {
      eventSourceRef.current = eventSource
    } else {
      // If SSE is not available, use polling
      startPolling()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const loadActivities = async () => {
    try {
      const data = await fetchActivityFeed(30)
      setActivities(data.activities)
      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 0)
    } catch (error) {
      console.error('Failed to load activities:', error)
    }
  }

  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }
    pollIntervalRef.current = setInterval(() => {
      loadActivities()
    }, 10000) // Poll every 10 seconds
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (username: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
    ]
    const hash = username.charCodeAt(0) + username.charCodeAt(username.length - 1)
    return colors[hash % colors.length]
  }

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="flex flex-col h-full bg-gradient-to-b from-slate-900/50 to-slate-900/20 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Live Activity</h3>
            {/* Live indicator */}
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-slate-400">
                {isConnected ? 'LIVE' : 'POLLING'}
              </span>
            </div>
          </div>
          <button
            onClick={loadActivities}
            className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Activity List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto space-y-2 p-4"
        >
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p className="text-sm">No activities yet</p>
            </div>
          ) : (
            activities.map((activity, idx) => (
              <div
                key={activity.id}
                className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-slate-700/30 group"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full ${getAvatarColor(
                      activity.creator_username
                    )} flex items-center justify-center flex-shrink-0 text-xs font-bold text-white`}
                  >
                    {getInitials(activity.creator_name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Content */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium truncate">
                          {activity.creator_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          predicted{' '}
                          <span
                            className="px-2 py-0.5 rounded-full text-white font-medium text-xs"
                            style={{ backgroundColor: activity.stage_color }}
                          >
                            {activity.stage}
                          </span>
                          {' '}for <span className="text-slate-300 font-medium">{activity.client_name}</span>
                        </p>
                      </div>

                      {/* Confidence */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-emerald-400">
                          {Math.round(activity.confidence * 100)}%
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Deal info */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                        {activity.deal_id}
                      </span>
                      <span className="text-xs text-slate-400">
                        ${Number(activity.deal_value).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
