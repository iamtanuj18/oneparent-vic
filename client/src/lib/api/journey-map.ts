// journey map api functions for assessment and data processing
import { apiFetch } from './client'

// types for journey map assessment data
export interface AssessmentRequest {
  // family situation
  separationDate: string
  childAge: number
  numberOfChildren: number
  
  // living & financial situation
  housingType: string
  employmentStatus: string
  incomeBracket: string
  childcareUsage: string
  
  // wellbeing & support
  stressLevel: number
  supportNetworkStrength: number
  biggestChallenges: string[]
  improvementGoals: string[]
  
  // optional previous journey mapping for progress comparison
  previousAssessment?: {
    timestamp: string
    stressLevel: number
    supportNetworkStrength: number
    employmentStatus: string
    housingType: string
    biggestChallenges: string[]
    improvementGoals: string[]
  }
}

export interface UserPosition {
  timeSince: {
    years: number
    months: number
    totalMonths: number
  }
  childAge: number
  numberOfChildren: number
  housingType: string
  employmentStatus: string
  incomeBracket: string
  childcareUsage: string
  stressLevel: number
  supportNetworkStrength: number
  biggestChallenges: string[]
  improvementGoals: string[]
  assessmentDate: string
}

export interface MentalHealthData {
  singleParentChallengesPct: number
  populationChallengesPct: number
  userBetterThan: number
  isExactYearMatch: boolean
}

export interface ChildcareData {
  ageSpecificCost: number | null
  singleParentAvgCost: number | null
  coupleParentAvgCost: number | null
  singleParentSavings: number | null
  isOlderThanFour?: boolean
  note?: string | null
}

export interface HousingStressData {
  singleParentStressPct: number | null
  allPeopleStressPct: number | null
  riskMultiplier: number | null
}

export interface RiskFactor {
  category: string
  factor: string
  severity: 'low' | 'medium' | 'high'
  actionable?: string
  hildaEvidence?: string
}

export interface ProtectiveFactor {
  category: string
  factor: string
  impact: 'positive'
  hildaEvidence?: string
}

export interface FinancialStress {
  level: 'low' | 'medium' | 'high' | 'very_high'
  factors: string[]
  recommendations: string[]
  hildaContext?: string
}

// Enhanced comprehensive analysis interface matching backend response structure
export interface ComprehensiveAnalysis {
  riskFactors: RiskFactor[]
  protectiveFactors: ProtectiveFactor[]
  financialStress: FinancialStress
  overallRiskScore: number
  
  // Enhanced intelligence features from backend
  contextualInsights: {
    situationContext: string
    uniqueFactors: string[]
    dataBasedHope: string
    realisticExpectations: string
    keyOpportunities: string[]
  }
  
  journeyStage: 'crisis_adjustment' | 'stabilization' | 'rebuilding' | 'established'
  
  trajectoryPrediction: {
    stageDescription: string
    sixMonthOutlook: string
    oneYearOutlook: string
    twoYearOutlook: string
    keyMilestones: string[]
    typicalChallenges: string[]
    opportunityWindows: string[]
  }
  
  personalizedTimeline: {
    [key: string]: string 
  }
  
  successProbabilities: {
    [key: string]: {
      probability: string
      timeframe: string
      conditions: string
    }
  }
  
  personalizedActions: Array<{
    action: string
    description: string
    priority: 'high' | 'medium' | 'low'
    timeframe: 'immediate' | 'short-term' | 'long-term'
    successRate?: string
    dependencies?: string[]
    expectedOutcome?: string
  }>
  
  nextSteps: {
    week1?: string
    month1?: string
    month3?: string
    month6?: string
  }
  
  milestones: Array<{
    milestone: string
    timeframe: string
    indicators: string
  }>
  
  challengeSpecificActions: Array<{
    challenge: string
    action: string
  }>
  
  goalSpecificActions: Array<{
    goal: string
    action: string
  }>
  
  // Textual summaries for Journey History
  situationSummary?: string
  progressSummary?: string
}

export interface AssessmentResponse {
  success: boolean
  userPosition: UserPosition
  mentalHealth: MentalHealthData
  childcare: ChildcareData
  housingStress: HousingStressData
  comprehensiveAnalysis: ComprehensiveAnalysis
  dataSource: string
}

export function submitAssessment(data: AssessmentRequest): Promise<AssessmentResponse> {
  return apiFetch('/journey-map/journey', { 
    method: 'POST', 
    body: data 
  })
}

export function saveJourneyData(key: string, data: any) {
  try {
    localStorage.setItem(`oneParentVIC_journey_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save journey data to localStorage:', error);
  }
}

export function loadJourneyData(key: string): any | null {
  try {
    const data = localStorage.getItem(`oneParentVIC_journey_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Failed to load journey data from localStorage:', error);
    return null;
  }
}

export function clearJourneyData(key?: string) {
  if (key) {
    localStorage.removeItem(`oneParentVIC_journey_${key}`);
  } else {
    Object.keys(localStorage)
      .filter(k => k.startsWith('oneParentVIC_journey_'))
      .forEach(k => localStorage.removeItem(k));
  }
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function calculateTimeSinceDisplay(separationDate: string): string {
  const separation = new Date(separationDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - separation.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) {
    return `${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
  }
}