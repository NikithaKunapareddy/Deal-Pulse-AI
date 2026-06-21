'use client'

import { useState, useEffect } from 'react'
import { BarChart3, ActivitySquare } from 'lucide-react'
import DashboardCard from '@/components/DashboardCard'
import PredictionForm from '@/components/PredictionForm'
import PipelineOverview from '@/components/PipelineOverview'
import RecentPredictions from '@/components/RecentPredictions'
import RealtimeActivityFeed from '@/components/RealtimeActivityFeed'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'
import DealsKanbanBoard from '@/components/DealsKanbanBoard'
import { fetchRecentPredictions, fetchPipelineStats, fetchUsers, User, createUser } from '@/lib/api'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard')
  const [stats, setStats] = useState({
    totalPredictions: 0,
    avgConfidence: 0,
    topStage: 'Prospecting',
    wonDeals: 0,
  })
  
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIntro, setShowIntro] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all')

  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [regForm, setRegForm] = useState({ username: '', role: 'representative', full_name: '' })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 3000)

    const initUsers = async () => {
      try {
        const uList = await fetchUsers()
        setUsers(uList)
        if (uList.length > 0) {
          const defaultUser = uList.find(u => u.role === 'representative') || uList[0]
          setCurrentUser(defaultUser)
        }
      } catch (error) {
        console.error('Failed to load users:', error)
      }
    }

    initUsers()
    return () => clearTimeout(introTimer)
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadDashboardData()
    }
  }, [currentUser, selectedAgentId])

  const loadDashboardData = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const params: any = {}
      
      if (currentUser.role === 'representative') {
        params.user_id = currentUser.id
      } else {
        if (selectedAgentId !== 'all') {
          params.agent_id = Number(selectedAgentId)
        }
      }

      const [recentData, pipelineData] = await Promise.all([
        fetchRecentPredictions(params),
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

        const stageCounts = (recentData.predictions || []).reduce((acc: any, p: any) => {
          acc[p.predicted_stage] = (acc[p.predicted_stage] || 0) + 1
          return acc
        }, {})
        
        let topStage = 'Prospecting'
        let maxCount = 0
        Object.entries(stageCounts).forEach(([stage, count]: [string, any]) => {
          if (count > maxCount) {
            maxCount = count
            topStage = stage
          }
        })

        setStats({
          totalPredictions: recentData.predictions?.length || 0,
          avgConfidence: avgConf,
          topStage: topStage,
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

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regForm.username.trim() || !regForm.full_name.trim()) return
    setRegLoading(true)
    setRegError('')
    
    try {
      const newUser = await createUser(regForm)
      setUsers([...users, newUser])
      setCurrentUser(newUser)
      setShowRegisterModal(false)
      setRegForm({ username: '', role: 'representative', full_name: '' })
    } catch (err: any) {
      setRegError(err.response?.data?.detail || err.message || 'Registration failed')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Animated Intro Screen */}
      {showIntro && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-purple-950/50 to-slate-950 flex items-center justify-center overflow-hidden transition-all duration-1000">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent"></div>
          </div>

          <div className="relative z-10 text-center space-y-6 px-6">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl blur-3xl opacity-75 animate-pulse" style={{ animationDuration: '2s' }}></div>
                <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-7xl shadow-2xl animate-bounce" style={{ animationDuration: '2s' }}>
                  📊
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-7xl font-black mb-4 tracking-tighter">
                <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                  DealPulse
                </span>
              </h1>
              <p className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  AI
                </span>
              </p>
            </div>

            <p className="text-xl text-gray-300 mt-8 max-w-2xl mx-auto">
              Real-time AI Sales Pipeline Analysis
            </p>

            <p className="text-sm text-gray-400 mt-6 tracking-widest">Initializing AI Engine...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-md">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
              DealPulse AI
            </span>
            {/* LIVE indicator badge */}
            <div className="ml-4 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-green-400">LIVE</span>
            </div>
          </div>
          
          {users.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Profile:</span>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const u = users.find(usr => usr.id === Number(e.target.value))
                  if (u) setCurrentUser(u)
                }}
                className="bg-slate-800 border border-slate-600/50 text-white rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:border-purple-400 transition"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role === 'manager' ? 'Manager' : 'Rep'})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold transition shadow-lg shadow-purple-500/20"
              >
                ➕ Register
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6 flex items-center gap-6 border-t border-slate-700/30">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'dashboard'
                ? 'text-purple-400 border-purple-500'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Main Dashboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'analytics'
                ? 'text-purple-400 border-purple-500'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ActivitySquare className="w-4 h-4" />
              Analytics
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {activeTab === 'dashboard' ? (
          <>
            {/* Main Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Prediction Form */}
              <div className="lg:col-span-2 space-y-6">
                <PredictionForm onPredictionComplete={handlePredictionComplete} currentUser={currentUser} />
                
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DashboardCard 
                    title="Total Predictions"
                    value={stats.totalPredictions.toString()}
                    icon="📊"
                    color="from-blue-500/10 to-cyan-500/10"
                  />
                  <DashboardCard 
                    title="Avg. Confidence"
                    value={`${stats.avgConfidence.toFixed(1)}%`}
                    icon="🎯"
                    color="from-green-500/10 to-emerald-500/10"
                  />
                  <DashboardCard 
                    title="Top Stage"
                    value={stats.topStage}
                    icon="🚀"
                    color="from-purple-500/10 to-pink-500/10"
                  />
                  <DashboardCard 
                    title="Won Deals"
                    value={stats.wonDeals.toString()}
                    icon="🏆"
                    color="from-orange-500/10 to-red-500/10"
                  />
                </div>

                {/* Pipeline Overview */}
                <PipelineOverview />
              </div>

              {/* Right Column - Real-time Activity Feed */}
              <div className="lg:col-span-1">
                <RealtimeActivityFeed />
              </div>
            </div>

            {/* Pipeline Stage Kanban vs List View */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>⚡</span> Pipeline Stage Visualizer
                  </h3>
                  <p className="text-xs text-slate-400">See your active deals and their predicted stages in real-time</p>
                </div>
                <div className="flex bg-slate-900 border border-slate-700/50 rounded-xl p-1 self-start sm:self-auto">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'kanban'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Kanban Board
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'list'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Recent Predictions
                  </button>
                </div>
              </div>

              {viewMode === 'kanban' ? (
                <DealsKanbanBoard predictions={predictions} loading={loading} />
              ) : (
                <RecentPredictions predictions={predictions} loading={loading} />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Analytics Dashboard */}
            <AnalyticsDashboard />
          </>
        )}
      </div>

      {/* User Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-500/35 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Register Profile</h3>
            
            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({...regForm, full_name: e.target.value})}
                  placeholder="e.g., Alice Agent"
                  className="w-full bg-slate-800 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={regForm.username}
                  onChange={(e) => setRegForm({...regForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                  placeholder="e.g., alice_rep"
                  className="w-full bg-slate-800 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 outline-none focus:border-purple-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Role</label>
                <select
                  value={regForm.role}
                  onChange={(e) => setRegForm({...regForm, role: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-600/50 text-white rounded-lg px-4 py-2.5 outline-none focus:border-purple-400 transition"
                >
                  <option value="representative">Representative</option>
                  <option value="manager">Sales Manager</option>
                </select>
              </div>

              {regError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">{regError}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 shadow-lg shadow-purple-500/20"
                >
                  {regLoading ? 'Registering...' : 'Register'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
