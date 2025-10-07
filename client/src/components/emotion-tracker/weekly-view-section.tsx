'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  TrendingUp, 
  Brain, 
  Clock,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ANIMATION_CONFIG, FADE_UP_VARIANT } from '@/lib/animation'
import { 
  EmotionLog,
  MOOD_LABELS,
  MOOD_EMOJIS,
  EMOTION_OPTIONS
} from '@/lib/api/emotion-tracker'

interface WeekSummary {
  week: number
  logs: EmotionLog[]
  averageMood: number
  averageEnergy: number
  averageOverwhelm: number
  topEmotions: string[]
  startDate: string
  endDate: string
}

export function WeeklyViewSection() {
  const [weekSummaries, setWeekSummaries] = useState<WeekSummary[]>([])
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())
  const [selectedDayLog, setSelectedDayLog] = useState<EmotionLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // load week summaries on component mount
  useEffect(() => {
    loadWeekSummaries()
  }, [])

  // Listen for localStorage changes to refresh summaries
  useEffect(() => {
    const handleStorageChange = () => {
      loadWeekSummaries()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('emotion-data-changed', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('emotion-data-changed', handleStorageChange)
    }
  }, [])

  const loadWeekSummaries = () => {
    setIsLoading(true)
    try {
      const storedLogs = localStorage.getItem('emotion-logs')
      const logs: EmotionLog[] = storedLogs ? JSON.parse(storedLogs) : []
      
      // Get user start date for consistent week calculation
      const userStartDate = localStorage.getItem('user-emotion-start-date')
      if (!userStartDate && logs.length === 0) {
        setWeekSummaries([])
        setIsLoading(false)
        return
      }
      
      // Recalculate week numbers for all logs to ensure consistency
      const logsWithCorrectWeeks = logs.map(log => {
        // Use timestamp for consistent date parsing (log.date string parsing can be inconsistent)
        const logDate = new Date(log.timestamp)
        const startDate = userStartDate ? new Date(userStartDate) : new Date(logs[0].timestamp)
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
      const storedUserStartDate = localStorage.getItem('user-emotion-start-date')
      let maxWeekToShow = 1
      if (storedUserStartDate) {
        const startDate = new Date(storedUserStartDate)
        const currentDate = new Date()
        maxWeekToShow = getWeekNumber(currentDate, startDate)
      }

      // Create a comprehensive list including empty weeks
      const allWeekSummaries: WeekSummary[] = []
      
      for (let weekNum = 1; weekNum <= maxWeekToShow; weekNum++) {
        const weekLogs = weekGroups[weekNum] || []
        
        // Calculate date range for this week
        let weekStartDateStr: string
        let weekEndDateStr: string
        
        if (storedUserStartDate) {
          const firstWeekMonday = new Date(storedUserStartDate)
          
          const weekStartMonday = new Date(firstWeekMonday)
          weekStartMonday.setDate(firstWeekMonday.getDate() + (weekNum - 1) * 7)
          
          const weekEndSunday = new Date(weekStartMonday)
          weekEndSunday.setDate(weekStartMonday.getDate() + 6)
          
          weekStartDateStr = weekStartMonday.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
          weekEndDateStr = weekEndSunday.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        } else {
          weekStartDateStr = 'Week ' + weekNum
          weekEndDateStr = ''
        }

        if (weekLogs.length > 0) {
          // Week with data
          const avgMood = weekLogs.reduce((sum, log) => sum + log.mood, 0) / weekLogs.length
          const avgEnergy = weekLogs.reduce((sum, log) => sum + log.energy, 0) / weekLogs.length
          const avgOverwhelm = weekLogs.reduce((sum, log) => sum + log.overwhelm, 0) / weekLogs.length

          // Count emotion frequency
          const emotionCounts: Record<string, number> = {}
          weekLogs.forEach(log => {
            log.emotions.forEach(emotion => {
              emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
            })
          })

          // Get top emotions
          const topEmotions = Object.entries(emotionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([emotion]) => emotion)

          allWeekSummaries.push({
            week: weekNum,
            logs: weekLogs,
            averageMood: avgMood,
            averageEnergy: avgEnergy,
            averageOverwhelm: avgOverwhelm,
            topEmotions,
            startDate: weekStartDateStr,
            endDate: weekEndDateStr
          })
        } else {
          // Empty week placeholder
          allWeekSummaries.push({
            week: weekNum,
            logs: [],
            averageMood: 0,
            averageEnergy: 0,
            averageOverwhelm: 0,
            topEmotions: [],
            startDate: weekStartDateStr,
            endDate: weekEndDateStr
          })
        }
      }

      const summaries = allWeekSummaries.sort((a, b) => b.week - a.week) // Sort by week descending

      setWeekSummaries(summaries)
      
      // Expand current week by default
      if (summaries.length > 0) {
        const currentWeek = summaries[0].week // Highest week number (most recent)
        setExpandedWeeks(new Set([currentWeek]))
      }
    } catch (error) {
      console.error('Failed to load week summaries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // toggle week expansion
  const toggleWeekExpansion = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks)
    
    if (expandedWeeks.has(weekNumber)) {
      newExpanded.delete(weekNumber)
    } else {
      newExpanded.add(weekNumber)
    }
    
    setExpandedWeeks(newExpanded)
  }

  // get emoji for mood value
  const getMoodEmoji = (avgMood: number): string => {
    const index = Math.round(avgMood) - 1
    return MOOD_EMOJIS[Math.max(0, Math.min(5, index))]
  }

  // get mood label for mood value
  const getMoodLabel = (avgMood: number): string => {
    const index = Math.round(avgMood) - 1
    return MOOD_LABELS[Math.max(0, Math.min(5, index))]
  }

  // get emotion color based on category
  const getEmotionColor = (emotion: string): string => {
    const positiveEmotions = ['excited', 'amazed', 'joyful', 'grateful', 'loved', 'accomplished', 'appreciated', 'thankful', 'worthy', 'hopeful', 'confident', 'proud']
    const productiveEmotions = ['productive', 'motivated', 'active', 'relaxed', 'refreshed', 'calm', 'focused', 'energized', 'satisfied', 'peaceful']
    const challengingEmotions = ['angry', 'anxious', 'disgusted', 'frustrated', 'annoyed', 'grumpy', 'overwhelmed', 'stressed', 'worried', 'sad', 'lonely', 'confused', 'disappointed', 'exhausted', 'impatient']
    
    if (positiveEmotions.includes(emotion)) {
      return 'bg-green-100 text-green-800 border-green-200'
    } else if (productiveEmotions.includes(emotion)) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    } else if (challengingEmotions.includes(emotion)) {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // get emotion emoji based on emotion type
  const getEmotionEmoji = (emotion: string): string => {
    // Simple emoji mapping for common emotions
    const emojiMap: Record<string, string> = {
      'excited': '🤩', 'amazed': '😲', 'joyful': '😊', 'grateful': '🙏', 'loved': '🥰',
      'accomplished': '🎉', 'appreciated': '😌', 'thankful': '🙏', 'worthy': '✨',
      'hopeful': '🌟', 'confident': '😎', 'proud': '💪', 'productive': '⚡',
      'motivated': '🔥', 'active': '🏃', 'relaxed': '😌', 'refreshed': '😊',
      'calm': '🧘', 'focused': '🎯', 'energized': '⚡', 'satisfied': '😌',
      'peaceful': '🕊️', 'tired': '😴', 'busy': '🏃', 'routine': '⏰',
      'okay': '😐', 'normal': '😐', 'steady': '📈', 'angry': '😠',
      'anxious': '😰', 'disgusted': '🤢', 'frustrated': '😤', 'annoyed': '😑',
      'grumpy': '😾', 'overwhelmed': '😵', 'stressed': '😫', 'worried': '😟',
      'sad': '😢', 'lonely': '😔', 'confused': '🤔', 'disappointed': '😞',
      'exhausted': '😴', 'impatient': '😤'
    }
    return emojiMap[emotion.toLowerCase()] || '😐'
  }

  // format date range for week display
  const formatDateRange = (startDate: string, endDate: string): string => {
    if (startDate === endDate) {
      return startDate
    }
    return `${startDate} - ${endDate}`
  }

  // Get proper week number from date - consistent with other components
  const getWeekNumber = (date: Date, startDate: Date): number => {
    // Align both dates to Monday of their respective weeks
    const startOfFirstWeek = new Date(startDate)
    startOfFirstWeek.setDate(startDate.getDate() - startDate.getDay() + 1) // Monday of first week
    
    const startOfCurrentWeek = new Date(date)
    startOfCurrentWeek.setDate(date.getDate() - date.getDay() + 1) // Monday of current week
    
    const diffTime = startOfCurrentWeek.getTime() - startOfFirstWeek.getTime()
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000))
    
    return Math.max(1, diffWeeks + 1)
  }

  // handle day click to show details
  const handleDayClick = (log: EmotionLog) => {
    setSelectedDayLog(log)
  }

  // close day details modal
  const closeDayDetails = () => {
    setSelectedDayLog(null)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (weekSummaries.length === 0) {
    return (
      <motion.div
        {...FADE_UP_VARIANT}
        transition={{ duration: ANIMATION_CONFIG.duration }}
      >
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Data Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
              Start logging your daily emotions to see weekly summaries and insights.
            </p>
            <Button 
              onClick={() => window.dispatchEvent(new CustomEvent('switch-to-today-tab'))}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Start Logging Emotions
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">

      {/* week summaries list */}
      <div className="space-y-6">
        {weekSummaries.map((week, index) => {
          // Check if this is an empty week
          const isEmpty = week.logs.length === 0
          
          return (
            <motion.div
              key={week.week}
              className={`bg-white rounded-xl shadow-lg border overflow-hidden ${
                isEmpty ? 'border-gray-300 border-dashed' : 'border-gray-200'
              }`}
              {...FADE_UP_VARIANT}
              transition={{ duration: ANIMATION_CONFIG.duration, delay: index * 0.1 }}
            >
              
              {/* week header */}
              <div className={`p-6 border-b border-gray-200 ${
                isEmpty 
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100' 
                  : 'bg-gradient-to-r from-blue-50 to-purple-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {isEmpty ? (
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full opacity-50"></div>
                        </div>
                      ) : (
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      )}
                      <h3 className={`text-xl font-semibold ${
                        isEmpty ? 'text-gray-500' : 'text-gray-900'
                      }`}>Week {week.week}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatDateRange(week.startDate, week.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 ${
                      isEmpty ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">
                        {isEmpty ? 'No entries' : `${week.logs.length} Entries`}
                      </span>
                    </div>
                    {/* Only show collapse button for weeks with data and non-current weeks */}
                    {!isEmpty && !(weekSummaries.length > 0 && week.week === weekSummaries[0].week) && (
                      <button
                        onClick={() => toggleWeekExpansion(week.week)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {expandedWeeks.has(week.week) ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                  )}
                </div>
              </div>
            </div>

            {/* week summary content */}
            {isEmpty ? (
              /* Empty week placeholder */
              <div className="p-6">
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Emotion Logs This Week</h4>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                      You didn't log any emotions during this week. Regular logging helps build better insights about your emotional patterns.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                
                {/* summary metrics grid */}
                <div className="grid md:grid-cols-3 gap-6">
                
                {/* average mood */}
                <div className="text-center space-y-3">
                  <div className="text-5xl">{getMoodEmoji(week.averageMood)}</div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Average Mood</p>
                    <p className="font-semibold text-gray-900">{getMoodLabel(week.averageMood)}</p>
                    <p className="text-sm text-gray-500">({week.averageMood.toFixed(1)}/6)</p>
                  </div>
                </div>

                {/* energy and overwhelm levels */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Energy Level</span>
                      <span className="font-semibold text-blue-600">{Math.round(week.averageEnergy)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${week.averageEnergy}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">Overwhelm Level</span>
                      <span className="font-semibold text-orange-600">{Math.round(week.averageOverwhelm)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${week.averageOverwhelm}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* top emotions */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-900 font-semibold">Top Emotions</p>
                  <div className="flex flex-wrap gap-2">
                    {week.topEmotions.map((emotion) => (
                      <span
                        key={emotion}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getEmotionColor(emotion)}`}
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ai insights */}
              {/* AI insights will be added later */}

              {/* daily breakdown - always show for current week, collapsible for others */}
              {((weekSummaries.length > 0 && week.week === weekSummaries[0].week) || expandedWeeks.has(week.week)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: ANIMATION_CONFIG.duration }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                    <h4 className="text-lg font-semibold text-gray-900">Daily Breakdown</h4>
                    {weekSummaries.length > 0 && week.week === weekSummaries[0].week && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Current Week</span>
                    )}
                  </div>
                  
                  <div className="grid gap-3">
                    {week.logs
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((log) => (
                        <div 
                          key={log.id} 
                          onClick={() => handleDayClick(log)}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{getMoodEmoji(log.mood)}</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {(() => {
                                  // Use log.date as primary source, fallback to timestamp
                                  const logDate = log.date ? new Date(log.date) : new Date(log.timestamp)
                                  return logDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })
                                })()}
                              </div>
                              <div className="text-sm text-gray-600">
                                energy: {log.energy}% • overwhelm: {log.overwhelm}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-wrap gap-2 max-w-xs">
                              {log.emotions.slice(0, 3).map((emotion) => (
                                <span
                                  key={emotion}
                                  className={`px-2 py-1 rounded-md text-xs font-medium border ${getEmotionColor(emotion)}`}
                                >
                                  {emotion}
                                </span>
                              ))}
                              {log.emotions.length > 3 && (
                                <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                  +{log.emotions.length - 3}
                                </span>
                              )}
                            </div>
                            <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              </div>
            )}
          </motion.div>
          )
        })}
      </div>

      {/* Day Details Modal */}
      {selectedDayLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getMoodEmoji(selectedDayLog.mood)}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {(() => {
                        // Use selectedDayLog.date as primary source, fallback to timestamp
                        const logDate = selectedDayLog.date ? new Date(selectedDayLog.date) : new Date(selectedDayLog.timestamp)
                        return logDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })
                      })()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Logged at {new Date(selectedDayLog.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDayDetails}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Mood */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Overall Mood</h4>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMoodEmoji(selectedDayLog.mood)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{getMoodLabel(selectedDayLog.mood)}</p>
                    <p className="text-sm text-gray-600">({selectedDayLog.mood}/6)</p>
                  </div>
                </div>
              </div>

              {/* Energy and Overwhelm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Energy Level</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Energy</span>
                      <span className="font-semibold text-blue-600">{selectedDayLog.energy}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" 
                        style={{ width: `${selectedDayLog.energy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Overwhelm Level</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overwhelm</span>
                      <span className="font-semibold text-orange-600">{selectedDayLog.overwhelm}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full" 
                        style={{ width: `${selectedDayLog.overwhelm}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Emotions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Emotions Felt</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDayLog.emotions.map((emotion) => (
                    <span
                      key={emotion}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border ${getEmotionColor(emotion)}`}
                    >
                      {getEmotionEmoji(emotion)} {emotion}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}