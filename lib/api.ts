import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface PredictionRequest {
  deal_id: string
  crm_notes: string
}

export interface PredictionResponse {
  deal_id: string
  predicted_stage: string
  confidence: number
  all_scores: Record<string, number>
  top_words: Array<{ word: string; score: number }>
  timestamp?: string
}

export interface HealthResponse {
  status: string
}

export interface Stage {
  name: string
  color: string
}

export interface Interaction {
  type: 'email' | 'meeting' | 'call' | 'note'
  date: string
  subject: string
  duration?: number // minutes, for calls and meetings
  notes: string
  participant?: string
}

export interface DealDetail {
  deal_id: string
  client_name: string
  deal_value: number
  industry: string
  interactions: Interaction[]
  last_interaction: string
  interaction_count: Record<string, number>
  days_since_last_interaction: number
}

export const predict = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await api.post('/predict', data)
  return response.data
}

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await api.get('/health')
  return response.data
}

export const fetchRecentPredictions = async () => {
  try {
    const response = await api.get('/recent')
    return response.data
  } catch (error) {
    console.error('Failed to fetch recent predictions:', error)
    return null
  }
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
