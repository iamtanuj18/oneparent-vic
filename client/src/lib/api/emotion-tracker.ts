import { apiFetch } from './client'

export interface EmotionLog {
  id: string
  user_id?: string
  date: string
  timestamp: number
  mood: number
  energy: number
  overwhelm: number
  emotions: string[]
  week: number
  week_number?: number
  created_at?: string
  updated_at?: string
}

export interface AIInsights {
  weeklyOverview: string
  emotionalPatterns: string[]
  keyInsights: string[]
  progressComparison: string
  personalizedTips: string[]
  concernAreas: string[]
  positiveHighlights: string[]
  nextWeekFocus: string
}

export interface WeeklyInsightsResponse {
  success: boolean
  insights: AIInsights
  generated_at: string
}

export async function generateWeeklyInsights(
  weekData: any, 
  emotionLogs: EmotionLog[], 
  previousWeekData?: any
): Promise<WeeklyInsightsResponse> {
  return apiFetch('/emotion-tracker/weekly-insights', {
    method: 'POST',
    body: {
      weekData,
      emotionLogs,
      previousWeekData
    }
  })
}

export const EMOTION_OPTIONS = [
  'excited', 'amazed', 'joyful', 'grateful', 'loved', 'accomplished', 
  'appreciated', 'thankful', 'worthy', 'hopeful', 'confident', 'proud',
  'productive', 'motivated', 'active', 'relaxed', 'refreshed', 'calm',
  'focused', 'energized', 'satisfied', 'peaceful',
  'tired', 'busy', 'routine', 'okay', 'normal', 'steady',
  'angry', 'anxious', 'disgusted', 'frustrated', 'annoyed', 'grumpy',
  'overwhelmed', 'stressed', 'worried', 'sad', 'lonely', 'confused',
  'disappointed', 'exhausted', 'impatient'
]

export const MOOD_LABELS = [
  'Very Sad', 'Sad', 'Neutral', 'Good', 'Happy', 'Very Happy'
]

export const MOOD_EMOJIS = ['😢', '😟', '😐', '🙂', '😊', '😄']