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