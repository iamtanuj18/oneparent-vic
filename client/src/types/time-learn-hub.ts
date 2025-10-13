// Shared types for the Time & Learn Hub feature

export interface ScheduleItem {
  id: string
  title: string
  day: string
  startTime: string
  endTime: string
  category: string
  description?: string
}

export interface Course {
  id: string
  title: string
  description: string
  category: string
  totalModules: number
  estimatedHours: number
  modules: CourseModule[]
  createdAt: string
  progress?: number
  completedModules?: string[]
  completedQuizzes?: {[moduleId: string]: {score: number, answers: number[], timestamp: string}}
  totalTimeSpent?: number
  lastAccessed?: string
}

export interface CourseModule {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  resources?: string[]
  learningObjectives?: string[]
  content?: {
    introduction?: string
    coreContent?: string
    keyTakeaways?: string[]
    troubleshooting?: string
  } | string 
  example?: {
    title: string
    description: string
    steps: string[]
    materials: string[]
  }
  examples?: Array<{
    title: string
    level: 'beginner' | 'intermediate' | 'advanced'
    description: string
    steps: string[]
    tips: string[]
    timeRequired: string
    materials: string[]
  }> | string[] 
  quiz?: {
    question: string
    options: string[]
    correctAnswer: number
    explanation?: string
    type?: 'knowledge' | 'application' | 'safety'
  }[]
  completed?: boolean
  completedAt?: string
}



export interface FreeTimeSlot {
  day: string
  startTime: string
  endTime: string
  duration: string
  suggestedActivities: string[]
}

export interface AnalysisData {
  categoryBreakdown: {
    [category: string]: {
      hours: number
      percentage: number
    }
  }
  metrics: {
    overallEfficiency: number
    weeklyFreeTime: number
    balanceScore: number
    activeDays: number
    peakActivity: string
  }
  freeTimePockets: FreeTimeSlot[]
  dailyPatterns: {
    [day: string]: Array<{
      hour: string
      activity: string
      category: string
    }>
  }
  suggestions: string[]
  timeOptimizationTips: string[]
}

export interface DaySchedule {
  day: string
  schedule: string
}

// View types for navigation
export type ViewType = 
  | 'overview'
  | 'schedule-input'
  | 'visualization'
  | 'free-time'
  | 'courses'
  | 'progress'

// Validation types
export interface ValidationState {
  type: 'success' | 'error' | 'empty' | null
  message: string
  flaggedDays?: Array<{
    day: string
    issues: string[]
    type: 'inappropriate' | 'missing_times' | 'nonsensical' | 'harmful'
  }>
}

// Component prop types
export interface TimeLearnHubProps {}

export interface OverviewProps {
  scheduleData: ScheduleItem[]
  courses: Course[]
  onViewChange?: (view: ViewType) => void
}

export interface ScheduleInputProps {
  scheduleData: ScheduleItem[]
  onScheduleUpdate: (data: ScheduleItem[]) => void
  onViewChange?: (view: ViewType) => void
}

export interface ScheduleVisualizationProps {
  scheduleData: ScheduleItem[]
}



export interface FreeTimePocketsProps {
  scheduleData: ScheduleItem[]
}

export interface SidebarProps {
  activeView: string
  onViewChange: (view: ViewType) => void
}

export interface CourseCreationProps {
  courses: Course[]
  onCourseUpdate: (courses: Course[]) => void
}

export interface CourseProgressProps {
  courses: Course[]
  onCourseUpdate: (courses: Course[]) => void
}