import { EmotionLog } from '@/lib/api/emotion-tracker'

export interface WeekSummary {
  week: number
  logs: EmotionLog[]
  averageMood: number
  averageEnergy: number
  averageOverwhelm: number
  averageSleep: number
  topEmotions: string[]
  topActivities: string[]
  startDate: string
  endDate: string
}

// Get proper week number from date - consistent across all components
export const getWeekNumber = (date: Date, startDate: Date): number => {
  // Align both dates to Monday of their respective weeks
  const startOfFirstWeek = new Date(startDate)
  startOfFirstWeek.setDate(startDate.getDate() - startDate.getDay() + 1) // Monday of first week
  startOfFirstWeek.setUTCHours(0, 0, 0, 0) // Normalize to UTC midnight to handle DST
  
  const startOfCurrentWeek = new Date(date)
  startOfCurrentWeek.setDate(date.getDate() - date.getDay() + 1) // Monday of current week
  startOfCurrentWeek.setUTCHours(0, 0, 0, 0) // Normalize to UTC midnight to handle DST
  
  const diffTime = startOfCurrentWeek.getTime() - startOfFirstWeek.getTime()
  const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000)) // Use Math.round for DST safety
  
  return Math.max(1, diffWeeks + 1)
}

// Format date range for week display
export const formatDateRange = (startDate: string, endDate: string): string => {
  if (startDate === endDate) {
    return startDate
  }
  
  // Parse dates to maintain day names while optimizing year display
  const startParts = startDate.split(', ') // ["Mon", "Oct 6", "2025"]
  const endParts = endDate.split(', ')     // ["Sun", "Oct 12", "2025"]
  
  if (startParts.length >= 3 && endParts.length >= 3) {
    const startYear = startParts[2]
    const endYear = endParts[2]
    
    if (startYear === endYear) {
      // Same year - show full format with day names: "Mon, Oct 6 - Sun, Oct 12, 2025"
      const startDayMonth = `${startParts[0]}, ${startParts[1]}` // "Mon, Oct 6"
      const endDayMonth = `${endParts[0]}, ${endParts[1]}`       // "Sun, Oct 12"
      return `${startDayMonth} - ${endDayMonth}, ${startYear}`
    }
  }
  
  // Fallback to full format if years are different or parsing fails
  return `${startDate} - ${endDate}`
}

// Generate weekly summaries - shared logic between Weekly Summary and AI Analysis
export const generateWeeklySummaries = (logs: EmotionLog[]): WeekSummary[] => {
  if (logs.length === 0) {
    return []
  }

  // Get user start date (Monday of first log's week)
  const userStartDate = localStorage.getItem('user-emotion-start-date')
  if (!userStartDate) {
    return []
  }

  // Recalculate week numbers for all logs to ensure consistency
  const logsWithCorrectWeeks = logs.map(log => {
    // Use timestamp for consistent date parsing (log.date string parsing can be inconsistent)
    const logDate = new Date(log.timestamp)
    const startDate = new Date(userStartDate)
    const correctWeek = getWeekNumber(logDate, startDate)
    return {
      ...log,
      week: correctWeek
    }
  })
  
  // Group logs by recalculated week numbers
  const weekGroups: Record<number, EmotionLog[]> = {}
  logsWithCorrectWeeks.forEach(log => {
    const week = log.week
    if (!weekGroups[week]) {
      weekGroups[week] = []
    }
    weekGroups[week].push(log)
  })

  // Calculate the current week number to determine range
  const startDate = new Date(userStartDate)
  const currentDate = new Date()
  const maxWeekToShow = getWeekNumber(currentDate, startDate)

  // Create a comprehensive list including empty weeks
  const allWeekSummaries: WeekSummary[] = []
  
  for (let weekNum = 1; weekNum <= maxWeekToShow; weekNum++) {
    const weekLogs = weekGroups[weekNum] || []
    
    // Calculate date range for this week
    const firstWeekMonday = new Date(userStartDate)
    
    const weekStartMonday = new Date(firstWeekMonday)
    weekStartMonday.setDate(firstWeekMonday.getDate() + (weekNum - 1) * 7)
    
    const weekEndSunday = new Date(weekStartMonday)
    weekEndSunday.setDate(weekStartMonday.getDate() + 6)
    
    const weekStartDateStr = weekStartMonday.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
    const weekEndDateStr = weekEndSunday.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })

    if (weekLogs.length > 0) {
      // Week with data
      const avgMood = weekLogs.reduce((sum, log) => sum + log.mood, 0) / weekLogs.length
      const avgEnergy = weekLogs.reduce((sum, log) => sum + log.energy, 0) / weekLogs.length
      const avgOverwhelm = weekLogs.reduce((sum, log) => sum + log.overwhelm, 0) / weekLogs.length
      const avgSleep = weekLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / weekLogs.length

      // Count emotion frequency
      const emotionCounts: Record<string, number> = {}
      weekLogs.forEach(log => {
        log.emotions.forEach(emotion => {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
        })
      })

      // Count activity frequency
      const activityCounts: Record<string, number> = {}
      weekLogs.forEach(log => {
        (log.activities || []).forEach(activity => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1
        })
      })

      // Get top emotions
      const topEmotions = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([emotion]) => emotion)

      // Get top activities
      const topActivities = Object.entries(activityCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([activity]) => activity)

      allWeekSummaries.push({
        week: weekNum,
        logs: weekLogs,
        averageMood: avgMood,
        averageEnergy: avgEnergy,
        averageOverwhelm: avgOverwhelm,
        averageSleep: avgSleep,
        topEmotions,
        topActivities,
        startDate: weekStartDateStr,
        endDate: weekEndDateStr
      })
    } else {
      // Empty week
      allWeekSummaries.push({
        week: weekNum,
        logs: [],
        averageMood: 0,
        averageEnergy: 0,
        averageOverwhelm: 0,
        averageSleep: 0,
        topEmotions: [],
        topActivities: [],
        startDate: weekStartDateStr,
        endDate: weekEndDateStr
      })
    }
  }

  return allWeekSummaries.sort((a, b) => b.week - a.week) // Most recent first
}