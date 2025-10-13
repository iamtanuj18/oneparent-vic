/**
 * Comprehensive text formatting utilities for OneParent VIC
 * Handles all underscore replacements, proper casing, and text normalization
 */

// Comprehensive mapping of all known underscore terms to proper display names
const DISPLAY_NAME_MAP: { [key: string]: string } = {
  // Challenges
  'childcare_costs': 'Childcare Costs',
  'mental_health': 'Mental Health', 
  'time_management': 'Time Management',
  'child_wellbeing': 'Child Wellbeing',
  'financial_stress': 'Financial Stress',
  'social_isolation': 'Social Isolation',
  'accessing_services': 'Accessing Services',
  'employment_stability': 'Employment Stability',
  'education_training': 'Education & Training',
  'housing_stress': 'Housing Stress',
  'work_life_balance': 'Work-Life Balance',
  'single_parenting': 'Single Parenting',
  'emotional_wellbeing': 'Emotional Wellbeing',
  'support_networks': 'Support Networks',
  'legal_issues': 'Legal Issues',
  'health_concerns': 'Health Concerns',
  
  // Goals
  'reduce_stress': 'Reduce Stress',
  'better_housing': 'Better Housing',
  'improve_finances': 'Improve Finances',
  'career_development': 'Career Development',
  'personal_growth': 'Personal Growth',
  'child_development': 'Child Development',
  'social_connections': 'Social Connections',
  'health_fitness': 'Health & Fitness',
  'education_goals': 'Education Goals',
  'family_stability': 'Family Stability',
  'emotional_healing': 'Emotional Healing',
  'life_balance': 'Life Balance',
  
  // Employment
  'full_time': 'Full Time',
  'part_time': 'Part Time',
  'casual_work': 'Casual Work',
  'self_employed': 'Self Employed',
  'job_seeking': 'Job Seeking',
  'stay_at_home': 'Stay at Home',
  'student_parent': 'Student Parent',
  
  // Income brackets
  'under_30k': 'Under $30,000',
  '30k_50k': '$30,000 - $50,000',
  '50k_70k': '$50,000 - $70,000', 
  '70k_100k': '$70,000 - $100,000',
  'over_100k': 'Over $100,000',
  'prefer_not_say': 'Prefer not to say',
  'very_low': 'Very Low Income',
  'low_income': 'Low Income',
  'moderate_income': 'Moderate Income',
  'good_income': 'Good Income',
  'high_income': 'High Income',
  
  // Housing
  'rental_private': 'Private Rental',
  'rental_social': 'Social Housing',
  'home_owner': 'Home Owner',
  'living_with_family': 'Living with Family',
  'temporary_accommodation': 'Temporary Accommodation',
  
  // Childcare
  'no_childcare': 'No Childcare',
  'family_friends': 'Family & Friends',
  'formal_childcare': 'Formal Childcare',
  'mixed_arrangements': 'Mixed Arrangements',
  
  // Timeframes
  'immediate': 'Immediate (1-2 weeks)',
  'short_term': 'Short Term (1-3 months)',
  'medium_term': 'Medium Term (3-12 months)', 
  'long_term': 'Long Term (1+ years)',
  
  // Strength levels
  'very_high': 'Very High',
  'high': 'High', 
  'medium': 'Medium',
  'low': 'Low',

  // Categories and types
  'risk_factor': 'Risk Factor',
  'protective_factor': 'Protective Factor',
  'action_item': 'Action Item',
  'support_service': 'Support Service',
  'financial_support': 'Financial Support',
  'community_resource': 'Community Resource',
  'government_service': 'Government Service',
  'health_service': 'Health Service',
  'legal_service': 'Legal Service',
  'education_service': 'Education Service',
  
  // Common words that appear with underscores
  'single_parent': 'Single Parent',
  'family_type': 'Family Type',
  'child_age': 'Child Age',
  'age_group': 'Age Group',
  'stress_level': 'Stress Level',
  'support_network': 'Support Network',
  'wellbeing_score': 'Wellbeing Score',
  'journey_stage': 'Journey Stage',
  'life_stage': 'Life Stage',
  'parenting_style': 'Parenting Style',
  'coping_strategy': 'Coping Strategy',
  'success_factor': 'Success Factor'
};

/**
 * Main function to format any text with underscores into proper display format
 */
export function formatText(text: string | undefined | null): string {
  if (!text || typeof text !== 'string') return '';
  
  // Trim whitespace
  const trimmed = text.trim();
  if (!trimmed) return '';
  
  // Check exact match in our comprehensive mapping first
  const lowerText = trimmed.toLowerCase();
  if (DISPLAY_NAME_MAP[lowerText]) {
    return DISPLAY_NAME_MAP[lowerText];
  }
  
  // If not in mapping, apply general formatting rules
  return formatGeneralText(trimmed);
}

/**
 * General formatting for text not in the specific mapping
 */
function formatGeneralText(text: string): string {
  return text
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Capitalize each word (title case)
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    // Handle special cases like "& " 
    .replace(/\s+&\s+/g, ' & ')
    // Clean up any extra spaces
    .trim();
}

/**
 * Format timeframe text specifically 
 */
export function formatTimeframe(timeframe: string | undefined): string {
  if (!timeframe) return '';
  
  const formatted = formatText(timeframe);
  
  // Add specific timeframe context if it's a basic timeframe
  const timeframeMap: { [key: string]: string } = {
    'Immediate': 'Immediate (Next 1-2 weeks)',
    'Short Term': 'Short Term (1-3 months)',  
    'Medium Term': 'Medium Term (3-12 months)',
    'Long Term': 'Long Term (1+ years)',
    'Ongoing': 'Ongoing Support',
    'As Needed': 'As Needed Basis'
  };
  
  return timeframeMap[formatted] || formatted;
}

/**
 * Format challenge/goal names 
 */
export function formatChallengeGoalName(name: string | undefined): string {
  return formatText(name);
}

/**
 * Format arrays of text items
 */
export function formatTextArray(items: (string | undefined)[]): string[] {
  return items
    .filter((item): item is string => Boolean(item))
    .map(item => formatText(item));
}

/**
 * Format category names consistently
 */
export function formatCategory(category: string | undefined): string {
  if (!category) return '';
  
  const categoryMap: { [key: string]: string } = {
    'financial': 'Financial',
    'housing': 'Housing', 
    'employment': 'Employment',
    'social': 'Social',
    'wellbeing': 'Wellbeing',
    'health': 'Health',
    'education': 'Education',
    'legal': 'Legal',
    'childcare': 'Childcare',
    'parenting': 'Parenting',
    'relationships': 'Relationships',
    'personal': 'Personal Development',
    'community': 'Community Support',
    'government': 'Government Services'
  };
  
  const lowerCategory = category.toLowerCase();
  return categoryMap[lowerCategory] || formatText(category);
}

/**
 * Format severity/strength levels
 */
export function formatLevel(level: string | undefined): string {
  if (!level) return '';
  
  const levelMap: { [key: string]: string } = {
    'very_low': 'Very Low',
    'low': 'Low',
    'medium': 'Medium', 
    'moderate': 'Moderate',
    'high': 'High',
    'very_high': 'Very High',
    'critical': 'Critical'
  };
  
  const lowerLevel = level.toLowerCase();
  return levelMap[lowerLevel] || formatText(level);
}

/**
 * Safely format any object property that might contain underscored text
 */
export function formatObjectText(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => formatObjectText(item));
  }
  
  const formatted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      formatted[key] = formatText(value);
    } else if (typeof value === 'object') {
      formatted[key] = formatObjectText(value);
    } else {
      formatted[key] = value;
    }
  }
  
  return formatted;
}