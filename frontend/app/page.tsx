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

  const [introPhase, setIntroPhase] = useState(0)

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #060010 0%, #0d0024 50%, #060010 100%)' }}>

      {/* ── Animated Intro Splash ────────────────────────────── */}
      {showIntro && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a0840 0%, #0a0020 50%, #060010 100%)' }}
        >
          {/* Starfield dots */}
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 2 + 1.5}s`,
              }}
            />
          ))}

          {/* Big ambient glows */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-800/8 rounded-full blur-[80px]" />

          {/* Floating deal cards — left */}
          <div className="absolute left-[6%] top-[20%] float-card-1 hidden lg:block">
            <div className="w-52 glass rounded-2xl border border-purple-500/20 p-4 shadow-2xl" style={{ transform: 'rotate(-8deg)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs">🔍</div>
                <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Prospecting</span>
              </div>
              <p className="text-white font-bold text-sm">Tesla Corp</p>
              <p className="text-slate-400 text-xs mt-0.5">DEAL-2024-001</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-green-400 font-black text-sm">$95K</span>
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">88%</span>
              </div>
            </div>
          </div>

          {/* Floating deal cards — right */}
          <div className="absolute right-[6%] top-[15%] float-card-2 hidden lg:block">
            <div className="w-52 glass rounded-2xl border border-green-500/20 p-4 shadow-2xl" style={{ transform: 'rotate(7deg)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xs">🎉</div>
                <span className="text-green-300 text-xs font-bold uppercase tracking-wider">Won</span>
              </div>
              <p className="text-white font-bold text-sm">Apple Inc</p>
              <p className="text-slate-400 text-xs mt-0.5">DEAL-2024-048</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-green-400 font-black text-sm">$220K</span>
                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">99%</span>
              </div>
            </div>
          </div>

          {/* Floating deal cards — bottom left */}
          <div className="absolute left-[12%] bottom-[18%] float-card-3 hidden lg:block">
            <div className="w-44 glass rounded-2xl border border-yellow-500/20 p-4 shadow-2xl" style={{ transform: 'rotate(-4deg)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xs">💬</div>
                <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Engaging</span>
              </div>
              <p className="text-white font-bold text-sm">Microsoft</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-green-400 font-black text-sm">$150K</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/30">92%</span>
              </div>
            </div>
          </div>

          {/* Floating deal cards — bottom right */}
          <div className="absolute right-[10%] bottom-[20%] float-card-1 hidden lg:block" style={{ animationDelay: '2s' }}>
            <div className="w-44 glass rounded-2xl border border-red-500/20 p-4 shadow-2xl" style={{ transform: 'rotate(5deg)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-xs">❌</div>
                <span className="text-red-300 text-xs font-bold uppercase tracking-wider">Lost</span>
              </div>
              <p className="text-white font-bold text-sm">Uber</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-green-400 font-black text-sm">$45K</span>
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">95%</span>
              </div>
            </div>
          </div>

          {/* Center content */}
          <div className="relative z-10 text-center px-6 space-y-8 animate-fade-in">

            {/* Logo orb with orbiting badges */}
            <div className="relative flex justify-center mb-6">
              <div className="relative">
                {/* Pulse rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border border-purple-500/25 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border border-purple-500/12 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '0.4s' }} />
                </div>

                {/* Main logo */}
                <div className="relative w-24 h-24 rounded-3xl shadow-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%)' }}>
                  <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%)', filter: 'blur(20px)', opacity: 0.6 }} />
                  <span className="relative text-5xl">📊</span>
                </div>

                {/* Orbiting stage pills */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="orbit-1">
                    <div className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300 text-[9px] font-bold whitespace-nowrap">🔍 Prospecting</div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="orbit-2">
                    <div className="px-2 py-0.5 rounded-full bg-green-950 border border-green-500/40 text-green-300 text-[9px] font-bold whitespace-nowrap">🎉 Won</div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="orbit-3">
                    <div className="px-2 py-0.5 rounded-full bg-yellow-950 border border-yellow-500/40 text-yellow-300 text-[9px] font-bold whitespace-nowrap">💬 Engaging</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-6xl sm:text-7xl font-black tracking-tight">
                <span className="text-shimmer">DealPulse</span>
                <span className="ml-4 text-white">AI</span>
              </h1>
              <p className="text-slate-300 text-lg font-medium tracking-wide">
                Smart CRM Sales Pipeline Intelligence
              </p>
            </div>

            {/* Live stats row */}
            <div className="flex justify-center gap-8 text-center">
              {[
                { label: 'Deals Tracked', value: '2,400+' },
                { label: 'Accuracy', value: '94%' },
                { label: 'Stages', value: '4' },
              ].map((s) => (
                <div key={s.label} className="animate-slide-up">
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Loading bar */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-full animate-shimmer" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-slate-500 tracking-widest uppercase font-semibold animate-pulse">Initializing AI Engine...</p>
            </div>
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
