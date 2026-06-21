'use client'

import { useEffect, useState, useRef } from 'react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { fetchAnalytics, Analytics } from '@/lib/api'
import { TrendingUp, Users, Target, DollarSign } from 'lucide-react'

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadAnalytics()

    // Poll every 30 seconds
    pollIntervalRef.current = setInterval(loadAnalytics, 30000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const loadAnalytics = async () => {
    try {
      const data = await fetchAnalytics()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // Prepare chart data
  const stageData = Object.entries(analytics.stage_breakdown).map(([stage, count]) => ({
    name: stage,
    value: count,
    color:
      stage === 'Prospecting'
        ? '#6366f1'
        : stage === 'Engaging'
          ? '#f59e0b'
          : stage === 'Won'
            ? '#10b981'
            : '#ef4444',
  }))

  // KPI Cards
  const kpis = [
    {
      title: 'Total Predictions',
      value: analytics.total_predictions,
      icon: <Target className="w-5 h-5" />,
      color: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Win Rate',
      value: `${analytics.win_rate}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      title: 'Pipeline Value',
      value: `$${(analytics.total_pipeline_value / 1000).toFixed(1)}K`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      title: 'Avg Deal Value',
      value: `$${(analytics.average_deal_value / 1000).toFixed(1)}K`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${kpi.borderColor} bg-gradient-to-br ${kpi.color} backdrop-blur-sm group hover:border-opacity-50 transition-all`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-1">{kpi.title}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
              </div>
              <div className="text-slate-400 group-hover:text-slate-300 transition-colors">
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predictions by Day */}
        <div className="p-4 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-900/20 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Predictions Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.predictions_by_day}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="p-4 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-900/20 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {stageData.map((stage, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-slate-300">{stage.name}</span>
                </div>
                <span className="text-slate-400 font-medium">{stage.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performer */}
      <div className="p-4 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-900/20 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-4">Top Performer</h3>
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
              🏆
            </div>
            <div>
              <p className="text-white font-medium">{analytics.top_performer.name}</p>
              <p className="text-xs text-slate-400">
                {analytics.top_performer.deals} deals
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-amber-400">
              {analytics.top_performer.deals}
            </p>
            <p className="text-xs text-slate-500">Total Deals</p>
          </div>
        </div>
      </div>
    </div>
  )
}
