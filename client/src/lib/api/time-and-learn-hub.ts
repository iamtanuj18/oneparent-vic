import { apiFetch } from './client';

export interface ScheduleValidationResponse {
  valid: boolean;
  message: string;
  flaggedDays: Array<{
    day: string;
    issues: string[];
    type: 'inappropriate' | 'missing_times' | 'nonsensical' | 'harmful';
  }>;
}

export interface ScheduleData {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

/**
 * validate weekly schedule data for safety and completeness
 * checks for inappropriate content, missing times, and logical sense
 */
export function validateScheduleInputs(scheduleData: ScheduleData): Promise<ScheduleValidationResponse> {
  return apiFetch('/time-and-learn-hub/validate-schedule', { 
    method: 'POST', 
    body: { scheduleData } 
  });
}

export interface ScheduleAnalysisResponse {
  success: boolean;
  message?: string;
  analysis?: {
    categoryBreakdown: {
      [category: string]: {
        hours: number;
        percentage: number;
      };
    };
    metrics: {
      overallEfficiency: number;
      weeklyFreeTime: number;
      balanceScore: number;
      activeDays: number;
      peakActivity: string;
    };
    freeTimePockets: Array<{
      day: string;
      startTime: string;
      endTime: string;
      duration: string;
      suggestedActivities: string[];
    }>;
    dailyPatterns: {
      [day: string]: Array<{
        hour: string;
        activity: string;
        category: string;
      }>;
    };
    suggestions: string[];
    timeOptimizationTips: string[];
  };
}

export function analyzeSchedule(scheduleData: ScheduleData): Promise<ScheduleAnalysisResponse> {
  return apiFetch('/time-and-learn-hub/analyze-schedule', { 
    method: 'POST', 
    body: { scheduleData } 
  });
}

// New sequential analysis functions for better reliability
export interface CategoryAnalysisResponse {
  success: boolean;
  message?: string;
  categoryBreakdown?: {
    [category: string]: {
      hours: number;
      percentage: number;
    };
  };
}

export interface MetricsAnalysisResponse {
  success: boolean;
  message?: string;
  metrics?: {
    overallEfficiency: number;
    weeklyFreeTime: number;
    balanceScore: number;
    activeDays: number;
    peakActivity: string;
  };
}

export interface FreeTimeAnalysisResponse {
  success: boolean;
  message?: string;
  freeTimePockets?: Array<{
    day: string;
    startTime: string;
    endTime: string;
    duration: string;
    suggestedActivities: string[];
  }>;
  suggestions?: string[];
  timeOptimizationTips?: string[];
}

export interface PatternAnalysisResponse {
  success: boolean;
  message?: string;
  dailyPatterns?: {
    [day: string]: Array<{
      hour: string;
      activity: string;
      category: string;
    }>;
  };
}

export function analyzeCategoriesSequential(scheduleData: ScheduleData): Promise<CategoryAnalysisResponse> {
  return apiFetch('/time-and-learn-hub/analyze-categories', { 
    method: 'POST', 
    body: { scheduleData } 
  });
}

export function analyzeMetricsSequential(scheduleData: ScheduleData, categoryBreakdown: any): Promise<MetricsAnalysisResponse> {
  return apiFetch('/time-and-learn-hub/analyze-metrics', { 
    method: 'POST', 
    body: { scheduleData, categoryBreakdown } 
  });
}

export function analyzeFreeTimeSequential(scheduleData: ScheduleData): Promise<FreeTimeAnalysisResponse> {
  return apiFetch('/time-and-learn-hub/analyze-free-time', { 
    method: 'POST', 
    body: { scheduleData } 
  });
}

export function analyzePatternsSequential(scheduleData: ScheduleData, categoryBreakdown: any): Promise<PatternAnalysisResponse> {
  return apiFetch('/time-and-learn-hub/analyze-patterns', { 
    method: 'POST', 
    body: { scheduleData, categoryBreakdown } 
  });
}

export interface LearningPlanSafetyResponse {
  safe: boolean;
  flaggedItems: string[];
  issues?: Array<{
    field: 'category' | 'specificInterests';
    value: string;
    type: 'inappropriate' | 'harmful' | 'illegal' | 'adult_only';
    reason: string;
  }>;
}

/**
 * validate learning plan inputs for safety and appropriateness
 * checks category and specific interests for harmful or inappropriate content
 */
export function validateLearningPlan(data: {
  category: string;
  interestLevel: string;
  learningStyle: string;
  specificInterests: string[];
}): Promise<LearningPlanSafetyResponse> {
  return apiFetch('/time-and-learn-hub/validate-learning-plan', { 
    method: 'POST', 
    body: data 
  });
}

export interface GeneratedModule {
  id: string;
  title: string;
  description: string;
  content: string;
  examples: string[];
  estimatedMinutes: number;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export interface GeneratedCourse {
  title: string;
  description: string;
  category: string;
  totalModules: number;
  estimatedHours: number;
  modules: GeneratedModule[];
}

export function generateLearningPlan(data: {
  category: string;
  interestLevel: string;
  learningStyle: string;
  specificInterests: string[];
  freeTimePockets: any[];
}): Promise<GeneratedCourse> {
  return apiFetch('/time-and-learn-hub/generate-course', { 
    method: 'POST', 
    body: data 
  });
}

