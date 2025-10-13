// Utility functions for generating unique IDs and other common operations

/**
 * Generate a unique ID using timestamp and random string
 * Format: timestamp-randomString (e.g., "1640995200000-a1b2c3")
 */
export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 8)
  return prefix ? `${prefix}-${timestamp}-${randomPart}` : `${timestamp}-${randomPart}`
}

/**
 * Generate a course ID
 */
export function generateCourseId(): string {
  return generateUniqueId('course')
}

/**
 * Generate a module ID with course reference
 */
export function generateModuleId(courseId?: string): string {
  const baseId = generateUniqueId('module')
  return courseId ? `${courseId}-${baseId}` : baseId
}

/**
 * Generate a schedule item ID
 */
export function generateScheduleId(): string {
  return generateUniqueId('schedule')
}

/**
 * Validate and sanitize text input for safety
 */
export function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000) 
}

/**
 * Format duration from minutes 
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Calculate total course duration from modules
 */
export function calculateCourseDuration(modules: Array<{ estimatedMinutes: number }>): number {
  return modules.reduce((total, module) => total + module.estimatedMinutes, 0)
}

/**
 * Safe localStorage operations with error handling
 */
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Failed to get localStorage item ${key}:`, error)
      return defaultValue
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Failed to set localStorage item ${key}:`, error)
      return false
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Failed to remove localStorage item ${key}:`, error)
      return false
    }
  }
}

