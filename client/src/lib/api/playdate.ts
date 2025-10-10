import { apiFetch } from './client';
import { FormData } from '../../components/playdate/hooks/usePlayDateForm';

export interface SafetyCheckResponse {
  safe: boolean;
  message?: string;
  issues?: string[];
  flaggedItems?: string[];
}

/**
 * safety validation for playdate form data when planning for myself
 */
export function validatePlaydateMyself(formData: FormData): Promise<SafetyCheckResponse> {
  return apiFetch('/playdate/myself/safetychecks', { 
    method: 'POST', 
    body: formData 
  });
}

/**
 * safety validation for playdate form data when planning with kids
 */
export function validatePlaydateWithKids(formData: FormData): Promise<SafetyCheckResponse> {
  return apiFetch('/playdate/withkids/safetychecks', { 
    method: 'POST', 
    body: formData 
  });
}

/**
 * general playdate safety validation that routes based on planFor value
 */
export function validatePlaydateInput(formData: FormData): Promise<SafetyCheckResponse> {
  if (formData.planFor === 'myself') {
    return validatePlaydateMyself(formData);
  } else if (formData.planFor === 'withKids') {
    return validatePlaydateWithKids(formData);
  } else {
    throw new Error('Invalid planFor value. Must be "myself" or "withKids"');
  }
}

export interface ActivityResponse {
  title: string;
  description: string;
  location: string;
  duration: string;
  budget: string;
  isOutdoor: boolean;
  weatherInsight?: string | boolean;
  outcomes: string[];
  materials: string[];
  steps: Array<{
    title: string;
    description: string;
    duration: string;
  }>;
  safetyTips?: string[];
  bondingTips?: string[];
  budgetNotes?: string;
}

/**
 * generate activity suggestions for myself
 */
export function generateActivityForMyself(formData: FormData, currentActivity?: string): Promise<ActivityResponse> {
  return apiFetch('/playdate/myself/generate', { 
    method: 'POST', 
    body: { ...formData, currentActivity } 
  });
}

/**
 * generate activity suggestions for with kids
 */
export function generateActivityWithKids(formData: FormData, currentActivity?: string): Promise<ActivityResponse> {
  return apiFetch('/playdate/withkids/generate', { 
    method: 'POST', 
    body: { ...formData, currentActivity } 
  });
}