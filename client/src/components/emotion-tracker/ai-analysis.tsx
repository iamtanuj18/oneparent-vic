'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ANIMATION_CONFIG } from '@/lib/animation'
import { 
  generateWeeklyInsights, 
  AIInsights, 
  EmotionLog
} from '@/lib/api/emotion-tracker'
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Heart, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Sparkles,
  Calendar,
  Loader2,
  Info
} from 'lucide-react'

interface AIAnalysisProps {
  isActive?: boolean
}

interface UserWeek {
  weekNumber: number
  startDate: string
  endDate: string
  logs: EmotionLog[]
  hasLogs: boolean
}

interface WeekAnalysis {
  weekNumber: number
  analysis: AIInsights
  generatedAt: string
}

export function AIAnalysis({ isActive = false }: AIAnalysisProps) {
  const [weekAnalyses, setWeekAnalyses] = useState<WeekAnalysis[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingWeek, setProcessingWeek] = useState<number | null>(null)
  const [processingProgress, setProcessingProgress] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [hasAnyLogs, setHasAnyLogs] = useState(false)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())
  const [userStartDate, setUserStartDate] = useState<string | null>(null)

  // Auto-trigger when tab becomes active
  useEffect(() => {
    if (isActive) {
      initializeAndCheckWeeks()
    }
  }, [isActive])

  // Listen for data changes
  useEffect(() => {
    const handleDataChange = () => {
      if (isActive) {
        initializeAndCheckWeeks()
      }
    }
    
    window.addEventListener('emotion-data-changed', handleDataChange)
    return () => window.removeEventListener('emotion-data-changed', handleDataChange)
  }, [isActive])

  const initializeAndCheckWeeks = async () => {
    try {
      // Get user start date and set up week numbering
      const startDate = getUserStartDate()
      setUserStartDate(startDate)
      
      // Get all emotion logs
      const allLogs = getAllEmotionLogs()
      setHasAnyLogs(allLogs.length > 0)
      
      if (allLogs.length === 0) return
      
      // Get completed weeks that have logs
      const completedWeeks = getCompletedWeeksWithLogs(allLogs, startDate)
      
      // Check which weeks need analysis
      const generatedWeeks = getGeneratedWeeks()
      const weeksNeedingAnalysis = completedWeeks.filter(week => 
        !generatedWeeks.includes(week.weekNumber) && week.hasLogs
      )
      
      // Load existing analyses
      loadExistingAnalyses(generatedWeeks)
      
      // Auto-expand latest completed week
      if (completedWeeks.length > 0) {
        const latestWeek = Math.max(...completedWeeks.map(w => w.weekNumber))
        setExpandedWeeks(new Set([latestWeek]))
      }
      
      // Process weeks needing analysis sequentially
      if (weeksNeedingAnalysis.length > 0 && !isProcessing) {
        await processWeeksSequentially(weeksNeedingAnalysis, startDate)
      }
      
    } catch (error) {
      console.error('Error initializing weeks:', error)
      setError('Failed to initialize weekly analysis')
    }
  }

  // Helper functions for week management
  const getUserStartDate = (): string => {
    let startDate = localStorage.getItem('user-emotion-start-date')
    if (!startDate) {
      // Set user start date to first emotion log date or today
      const logs = getAllEmotionLogs()
      if (logs.length > 0) {
        const firstLogDate = logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
        // Always use Monday of the week containing the first log
        const firstLog = new Date(firstLogDate)
        const mondayOfFirstWeek = new Date(firstLog)
        mondayOfFirstWeek.setDate(firstLog.getDate() - firstLog.getDay() + 1)
        startDate = mondayOfFirstWeek.toISOString().split('T')[0]
      } else {
        const today = new Date()
        const mondayOfThisWeek = new Date(today)
        mondayOfThisWeek.setDate(today.getDate() - today.getDay() + 1)
        startDate = mondayOfThisWeek.toISOString().split('T')[0]
      }
      localStorage.setItem('user-emotion-start-date', startDate)
    }
    return startDate
  }

  const getAllEmotionLogs = (): EmotionLog[] => {
    try {
      const storedLogs = localStorage.getItem('emotion-logs')
      return storedLogs ? JSON.parse(storedLogs) : []
    } catch (error) {
      console.error('Error getting emotion logs:', error)
      return []
    }
  }

  const getCompletedWeeksWithLogs = (logs: EmotionLog[], startDate: string): UserWeek[] => {
    const now = new Date()
    const userStartDate = new Date(startDate)
    const weeks: UserWeek[] = []
    
    // Calculate which week we're currently in
    const currentWeekNumber = getUserWeekNumber(now, userStartDate)
    
    // Only process completed weeks (not current week)
    for (let weekNum = 1; weekNum < currentWeekNumber; weekNum++) {
      const { startDate: weekStart, endDate: weekEnd } = getWeekDates(weekNum, userStartDate)
      const weekLogs = logs.filter(log => {
        const logDate = new Date(log.date)
        return logDate >= new Date(weekStart) && logDate <= new Date(weekEnd)
      })
      
      weeks.push({
        weekNumber: weekNum,
        startDate: weekStart,
        endDate: weekEnd,
        logs: weekLogs,
        hasLogs: weekLogs.length > 0
      })
    }
    
    return weeks // Return all weeks including empty ones
  }

  const getUserWeekNumber = (date: Date, startDate: Date): number => {
    // Align both dates to Monday of their respective weeks
    const startOfFirstWeek = new Date(startDate)
    startOfFirstWeek.setDate(startDate.getDate() - startDate.getDay() + 1) // Monday of first week
    
    const startOfCurrentWeek = new Date(date)
    startOfCurrentWeek.setDate(date.getDate() - date.getDay() + 1) // Monday of current week
    
    const diffTime = startOfCurrentWeek.getTime() - startOfFirstWeek.getTime()
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000))
    
    return Math.max(1, diffWeeks + 1)
  }

  const getWeekDates = (weekNumber: number, userStartDate: Date): { startDate: string, endDate: string } => {
    // Calculate week start based on Monday of user's first week
    const firstWeekMonday = new Date(userStartDate)
    firstWeekMonday.setDate(userStartDate.getDate() - userStartDate.getDay() + 1) // Monday of first week
    
    const weekStart = new Date(firstWeekMonday)
    weekStart.setDate(firstWeekMonday.getDate() + (weekNumber - 1) * 7)
    
    // Week end is 6 days after week start
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    return {
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0]
    }
  }

  const getGeneratedWeeks = (): number[] => {
    try {
      const generated = localStorage.getItem('emotion-insights-generated')
      return generated ? JSON.parse(generated) : []
    } catch (error) {
      return []
    }
  }

  const loadExistingAnalyses = (generatedWeeks: number[]) => {
    const analyses: WeekAnalysis[] = []
    
    generatedWeeks.forEach(weekNum => {
      try {
        const stored = localStorage.getItem(`emotion-insights-week-${weekNum}`)
        if (stored) {
          const data = JSON.parse(stored)
          analyses.push({
            weekNumber: weekNum,
            analysis: data.analysis,
            generatedAt: data.generatedAt
          })
        }
      } catch (error) {
        console.error(`Error loading analysis for week ${weekNum}:`, error)
      }
    })
    
    // Sort by week number (newest first for display)
    analyses.sort((a, b) => b.weekNumber - a.weekNumber)
    setWeekAnalyses(analyses)
  }

  const processWeeksSequentially = async (weeks: UserWeek[], startDate: string) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    setError(null)
    
    try {
      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i]
        setProcessingWeek(week.weekNumber)
        setProcessingProgress(`Analyzing Week ${week.weekNumber} (${i + 1} of ${weeks.length})`)
        
        await generateWeekAnalysis(week, startDate)
        
        // Small delay between weeks to show progress
        if (i < weeks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      // Refresh analyses display
      const updatedGenerated = getGeneratedWeeks()
      loadExistingAnalyses(updatedGenerated)
      
    } catch (error) {
      console.error('Error processing weeks:', error)
      setError('Failed to generate weekly analyses. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingWeek(null)
      setProcessingProgress('')
    }
  }

  const generateWeekAnalysis = async (week: UserWeek, startDate: string) => {
    console.log(`[AI Analysis] Generating analysis for Week ${week.weekNumber} (${week.startDate} to ${week.endDate})`);
    
    // Get all logs for previous week comparison
    const allLogs = getAllEmotionLogs()
    const prevWeekData = getPreviousWeekData(week.weekNumber, allLogs, startDate)
    
    console.log(`[AI Analysis] Week ${week.weekNumber} will ${prevWeekData ? 'HAVE' : 'NOT HAVE'} previous week comparison`);
    
    // Prepare week data for API
    const weekData = {
      weekNumber: week.weekNumber,
      startDate: week.startDate,
      endDate: week.endDate,
      logs: week.logs,
      averageMood: week.logs.reduce((sum, log) => sum + log.mood, 0) / week.logs.length,
      averageEnergy: week.logs.reduce((sum, log) => sum + log.energy, 0) / week.logs.length,
      averageOverwhelm: week.logs.reduce((sum, log) => sum + log.overwhelm, 0) / week.logs.length,
      topEmotions: getTopEmotions(week.logs)
    }
    
    // Call AI API
    const response = await generateWeeklyInsights(weekData, week.logs, prevWeekData)
    
    // Store the analysis
    const analysisData = {
      analysis: response.insights,
      generatedAt: new Date().toISOString()
    }
    
    localStorage.setItem(`emotion-insights-week-${week.weekNumber}`, JSON.stringify(analysisData))
    
    // Update generated weeks list
    const generated = getGeneratedWeeks()
    if (!generated.includes(week.weekNumber)) {
      generated.push(week.weekNumber)
      localStorage.setItem('emotion-insights-generated', JSON.stringify(generated))
    }
  }

  const getPreviousWeekData = (currentWeekNumber: number, allLogs: EmotionLog[], startDate: string) => {
    if (currentWeekNumber <= 1) return null
    
    console.log(`[AI Analysis] Using startDate:`, startDate);
    
    const prevWeekNumber = currentWeekNumber - 1
    const userStart = new Date(startDate)
    
    console.log(`[AI Analysis] userStart date object:`, userStart);
    
    const { startDate: prevStart, endDate: prevEnd } = getWeekDates(prevWeekNumber, userStart)
    
    console.log(`[AI Analysis] Looking for Week ${prevWeekNumber} data (${prevStart} to ${prevEnd})`);
    
    const prevLogs = allLogs.filter(log => {
      const logDate = new Date(log.date)
      const inRange = logDate >= new Date(prevStart) && logDate <= new Date(prevEnd)
      if (inRange) {
        console.log(`[AI Analysis] Found previous week log: ${log.date}`);
      }
      return inRange
    })
    
    console.log(`[AI Analysis] Week ${prevWeekNumber} logs found: ${prevLogs.length}`);
    
    if (prevLogs.length === 0) {
      console.log(`[AI Analysis] No previous week data for Week ${currentWeekNumber}`);
      return null
    }
    
    const prevWeekData = {
      weekNumber: prevWeekNumber,
      averageMood: prevLogs.reduce((sum, log) => sum + log.mood, 0) / prevLogs.length,
      averageEnergy: prevLogs.reduce((sum, log) => sum + log.energy, 0) / prevLogs.length,
      averageOverwhelm: prevLogs.reduce((sum, log) => sum + log.overwhelm, 0) / prevLogs.length,
      topEmotions: getTopEmotions(prevLogs)
    }
    
    console.log(`[AI Analysis] Previous week ${prevWeekNumber} data:`, prevWeekData);
    return prevWeekData
  }

  const getTopEmotions = (logs: EmotionLog[]): string[] => {
    const emotionCount: { [key: string]: number } = {}
    logs.forEach(log => {
      log.emotions.forEach(emotion => {
        emotionCount[emotion] = (emotionCount[emotion] || 0) + 1
      })
    })
    
    return Object.entries(emotionCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion)
  }

  const toggleWeekExpansion = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber)
    } else {
      newExpanded.add(weekNumber)
    }
    setExpandedWeeks(newExpanded)
  }



  // No logs state
  if (!hasAnyLogs) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
      >
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Emotion Data Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
              Log your daily emotions first to get AI-powered weekly insights and personalized tips.
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
      {/* Processing indicator */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Generating AI Analysis</h3>
                <p className="text-blue-700 text-sm">{processingProgress}</p>
              </div>
            </div>
          </div>
          {processingWeek && (
            <div className="text-center mb-4">
              <p className="text-blue-600">Analyzing Week {processingWeek} emotional patterns...</p>
            </div>
          )}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800 text-sm font-medium">⚠️ Please don't close this tab or browser while analysis is in progress</p>
          </div>
        </motion.div>
      )}

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
        >
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            onClick={() => initializeAndCheckWeeks()}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Try Again
          </Button>
        </motion.div>
      )}

      {/* Info box for ongoing weeks */}
      {weekAnalyses.length > 0 && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">📊 How Weekly Analysis Works</h3>
              <p className="text-blue-700 text-sm leading-relaxed">
                AI insights are generated automatically <strong>after each week ends</strong> (Sunday night). 
                Current or future weeks won't appear here until they're complete. Keep logging daily to get comprehensive weekly analysis!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly analyses and empty week placeholders */}
      {hasAnyLogs && userStartDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
          className="space-y-4"
        >
          {(() => {
            // Get all completed weeks (including empty ones)
            const allLogs = getAllEmotionLogs()
            const completedWeeks = getCompletedWeeksWithLogs(allLogs, userStartDate)
            
            return completedWeeks
              .sort((a, b) => b.weekNumber - a.weekNumber) // Most recent first
              .map((week) => {
                // Check if this week has an analysis
                const analysis = weekAnalyses.find(a => a.weekNumber === week.weekNumber)
                
                if (analysis) {
                  // Week with analysis
                  return (
                    <WeekAnalysisCard 
                      key={week.weekNumber}
                      weekAnalysis={analysis}
                      userStartDate={userStartDate}
                      isExpanded={expandedWeeks.has(week.weekNumber)}
                      onToggle={() => toggleWeekExpansion(week.weekNumber)}
                    />
                  )
                } else if (!week.hasLogs) {
                  // Empty week placeholder
                  return (
                    <EmptyWeekCard
                      key={week.weekNumber}
                      weekNumber={week.weekNumber}
                      startDate={week.startDate}
                      endDate={week.endDate}
                    />
                  )
                } else {
                  // Week with logs but no analysis yet (shouldn't happen with current logic)
                  return null
                }
              })
              .filter(Boolean)
          })()}
        </motion.div>
      )}

      {/* Info message - only show if no analyses exist and not processing */}
      {hasAnyLogs && weekAnalyses.length === 0 && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Analysis Coming Soon!</h3>
              <p className="text-blue-700 text-sm leading-relaxed mb-3">
                You're building your emotion tracking journey! AI-powered weekly insights will appear here automatically once your first week completes.
              </p>
              <div className="bg-white/60 rounded-md p-3 border border-blue-100">
                <p className="text-blue-800 text-xs font-medium mb-1">💡 What you'll get:</p>
                <ul className="text-blue-700 text-xs space-y-0.5">
                  <li>• Personalized emotional pattern analysis</li>
                  <li>• Custom tips based on your week's data</li>
                  <li>• Progress tracking week-over-week</li>
                  <li>• Insights to support your wellbeing journey</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Individual week analysis card component
function WeekAnalysisCard({ 
  weekAnalysis, 
  userStartDate, 
  isExpanded, 
  onToggle 
}: {
  weekAnalysis: WeekAnalysis
  userStartDate: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const getWeekDates = (weekNumber: number): { start: string, end: string } => {
    const startDate = new Date(userStartDate)
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (weekNumber - 1) * 7)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    return {
      start: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const { start, end } = getWeekDates(weekAnalysis.weekNumber)
  const insights = weekAnalysis.analysis

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 -m-4 p-4 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Week {weekAnalysis.weekNumber}
              </h3>
              <p className="text-sm text-gray-600">
                {start} - {end}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Condensed Weekly Overview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-pink-500" />
              <h4 className="font-medium text-gray-900">Week Summary</h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {insights.weeklyOverview.split('.').slice(0, 2).join('.')}
              {insights.weeklyOverview.split('.').length > 2 ? '.' : ''}
            </p>
          </div>

          {/* Key Insights - Bullet Points */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <h4 className="font-medium text-gray-900">Key Insights</h4>
            </div>
            <ul className="space-y-1">
              {insights.keyInsights.slice(0, 3).map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Personalized Tips */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-500" />
              <h4 className="font-medium text-gray-900">Tips</h4>
            </div>
            <ul className="space-y-1">
              {insights.personalizedTips.slice(0, 3).map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progress Comparison (if exists and meaningful) */}
          {insights.progressComparison && 
           !insights.progressComparison.toLowerCase().includes('no previous') &&
           !insights.progressComparison.toLowerCase().includes('not available') && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <h4 className="font-medium text-gray-900">Progress</h4>
              </div>
              <p className="text-sm text-gray-700 bg-green-50 p-2 rounded border-l-2 border-green-300">
                {insights.progressComparison}
              </p>
            </div>
          )}

          {/* Next Week Focus */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h4 className="font-medium text-gray-900">Next Week Focus</h4>
            </div>
            <p className="text-sm text-gray-700 bg-indigo-50 p-2 rounded border-l-2 border-indigo-300">
              {insights.nextWeekFocus}
            </p>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t">
            Generated: {new Date(weekAnalysis.generatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Empty Week Card Component
interface EmptyWeekCardProps {
  weekNumber: number
  startDate: string
  endDate: string
}

function EmptyWeekCard({ weekNumber, startDate, endDate }: EmptyWeekCardProps) {
  return (
    <Card className="border border-gray-300 border-dashed bg-gray-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-500">Week {weekNumber}</h3>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                  {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
            No Analysis
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h4 className="text-base font-medium text-gray-600 mb-1">No Emotion Data This Week</h4>
            <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
              AI analysis requires emotion logs. Start logging daily to unlock personalized insights and tips.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}