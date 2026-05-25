'use client'

import { useState, useEffect } from 'react'
import DashboardCard from '@/components/DashboardCard'
import PredictionForm from '@/components/PredictionForm'
import PipelineOverview from '@/components/PipelineOverview'
import RecentPredictions from '@/components/RecentPredictions'
import { fetchRecentPredictions, fetchPipelineStats } from '@/lib/api'

export default function Home() {
  const [stats, setStats] = useState({
    totalPredictions: 0,
    avgConfidence: 0,
    topStage: 'Prospecting',
    wonDeals: 0,
  })
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [recentData, pipelineData] = await Promise.all([
        fetchRecentPredictions(),
        fetchPipelineStats(),
      ])
      
      if (recentData) {
        setPredictions(recentData.predictions || [])
        
        const wonCount = recentData.predictions?.filter(
          (p: any) => p.predicted_stage === 'Won'
        ).length || 0
        
        const avgConf = recentData.predictions?.length
          ? (recentData.predictions.reduce((sum: number, p: any) => sum + p.confidence, 0) / 
             recentData.predictions.length * 100)
          : 0

        setStats({
          totalPredictions: recentData.predictions?.length || 0,
          avgConfidence: avgConf,
          topStage: 'Prospecting',
          wonDeals: wonCount,
        })
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePredictionComplete = () => {
    loadDashboardData()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0015] via-[#1a0a2e] to-[#0a0015]">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 lg:p-8">
        {/* Premium Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-lg opacity-75 animate-pulse"></div>
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
                  📊
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-purple-200 via-purple-100 to-pink-200 bg-clip-text text-transparent">
                  DealPulse AI
                </h1>
                <p className="text-sm text-gray-400 mt-1">✨ Intelligent Sales Pipeline Stage Prediction</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border border-green-500/50 shadow-lg shadow-green-500/20">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-300 font-semibold">API Connected</span>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <DashboardCard
                title="Total Predictions"
                value={stats.totalPredictions}
                icon="📈"
                subtitle="All sessions"
              />
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <DashboardCard
                title="Avg Confidence"
                value={`${stats.avgConfidence.toFixed(1)}%`}
                icon="🎯"
                subtitle="Model certainty"
              />
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <DashboardCard
                title="Top Stage"
                value={stats.topStage}
                icon="🏆"
                subtitle="Most predicted"
              />
            </div>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <DashboardCard
                title="Won Deals"
                value={stats.wonDeals}
                icon="💚"
                subtitle="Closed successfully"
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Side - Prediction Form & Pipeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prediction Form */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#1a0a2e] to-[#16213e] rounded-2xl border border-purple-500/30 overflow-hidden">
                <PredictionForm onPredictionComplete={handlePredictionComplete} />
              </div>
            </div>
          </div>

          {/* Right Side - Pipeline Overview */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-gradient-to-br from-[#1a0a2e] to-[#16213e] rounded-2xl border border-pink-500/30 overflow-hidden p-8 h-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📊</span>
                <span>Pipeline Overview</span>
              </h3>
              <PipelineOverview predictions={predictions} />
            </div>
          </div>
        </div>

        {/* Recent Predictions Section */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative bg-gradient-to-br from-[#1a0a2e] to-[#16213e] rounded-2xl border border-blue-500/30 overflow-hidden p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <span>Recent Predictions</span>
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold">
                {stats.totalPredictions} Total
              </span>
            </h2>
            <RecentPredictions predictions={predictions} loading={loading} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-700/50 text-center">
          <p className="text-gray-500 text-sm">
            🚀 <span className="text-purple-400 font-semibold">DealPulse AI</span> • Powered by DistilBERT ML Model • Real-time Deal Stage Prediction
          </p>
        </div>
      </div>
    </main>
  )
}
