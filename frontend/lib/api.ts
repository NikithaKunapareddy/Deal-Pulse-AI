import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface User {
  id: number
  username: string
  role: 'representative' | 'manager'
  full_name: string
}

export interface Interaction {
  type: 'email' | 'meeting' | 'call' | 'note'
  date: string
  subject: string
  duration?: number
  notes: string
  participant?: string
}

export interface PredictionRequest {
  deal_id: string
  crm_notes: string
  user_id: number
  client_name?: string
  deal_value?: number
  industry?: string
  interactions?: Interaction[]
}

export interface PredictionResponse {
  id?: number
  deal_id: string
  predicted_stage: string
  confidence: number
  all_scores: Record<string, number>
  top_words: Array<{ word: string; score: number }>
  timestamp?: string
  creator?: {
    id: number
    name: string
    role: string
  }
  dealInfo?: {
    dealId: string
    clientName: string
    dealValue: number
    industry: string
  }
  interactions?: Interaction[]
}

export interface HealthResponse {
  status: string
}

export interface Stage {
  id: number
  name: string
  color: string
}

export interface Analytics {
  total_predictions: number
  stage_breakdown: Record<string, number>
  win_rate: number
  top_performer: { name: string; deals: number }
  average_deal_value: number
  total_pipeline_value: number
  predictions_by_day: Array<{ date: string; count: number }>
}

export interface ActivityItem {
  id: number
  deal_id: string
  client_name: string
  stage: string
  stage_color: string
  confidence: number
  timestamp: string
  creator_name: string
  creator_username: string
  deal_value: number
}

// ============================================================
// Basic endpoints
// ============================================================
export const predict = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await api.post('/predict', data)
  return response.data
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await api.get('/health')
  return response.data
}

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get('/users')
  return response.data
}

export const fetchRecentPredictions = async (params?: { user_id?: number; agent_id?: number }) => {
  try {
    const response = await api.get('/recent', { params })
    return response.data
  } catch (error) {
    console.error('Failed to fetch recent predictions:', error)
    return null
  }
}

export const createUser = async (data: { username: string; role: string; full_name: string }): Promise<User> => {
  const response = await api.post('/users', data)
  return response.data
}

export const fetchPipelineStats = async () => {
  try {
    const response = await api.get('/stages')
    return response.data
  } catch (error) {
    console.error('Failed to fetch pipeline stats:', error)
    return null
  }
}

// ============================================================
// Analytics endpoints
// ============================================================
export const fetchAnalytics = async (): Promise<Analytics> => {
  try {
    const response = await api.get('/analytics')
    return response.data
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    throw error
  }
}

export const fetchActivityFeed = async (limit: number = 20): Promise<{ activities: ActivityItem[] }> => {
  try {
    const response = await api.get(`/activity-feed?limit=${limit}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch activity feed:', error)
    throw error
  }
}

// ============================================================
// Real-time streaming (SSE)
// ============================================================
export const subscribeToStream = (
  onEvent: (event: any) => void,
  onError?: (error: Error) => void
): EventSource | null => {
  try {
    const eventSource = new EventSource(`${API_URL}/stream`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onEvent(data)
      } catch (e) {
        console.error('Failed to parse SSE message', e)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE error', error)
      if (onError) {
        onError(new Error('Stream connection error'))
      }
      eventSource.close()
    }
    
    return eventSource
  } catch (error) {
    console.error('Failed to subscribe to stream:', error)
    return null
  }
}

export default api

