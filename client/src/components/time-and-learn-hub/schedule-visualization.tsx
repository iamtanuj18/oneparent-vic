'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Clock, Calendar, BarChart2, Loader } from 'lucide-react'
import { 
  ScheduleAnalysisResponse,
  analyzeCategoriesSequential,
  analyzeMetricsSequential,
  analyzeFreeTimeSequential,
  analyzePatternsSequential
} from '@/lib/api/time-and-learn-hub'

interface ScheduleVisualizationProps {
  scheduleData: any[]
  onViewChange?: (view: string) => void
  onAnalysisStateChange?: (isAnalyzing: boolean) => void
}

export function ScheduleVisualization({ scheduleData, onViewChange, onAnalysisStateChange }: ScheduleVisualizationProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<ScheduleAnalysisResponse['analysis'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // calculate total free time from free time pockets
  const parseDurationToHours = (durationStr: string): number => {
    if (!durationStr) return 0
    
    const str = durationStr.toLowerCase().trim()
    
    // Handle "X hour" or "X hours" format
    const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/)
    if (hourMatch) {
      return parseFloat(hourMatch[1])
    }
    
    // Handle "X min" or "X minutes" format - convert to hours
    const minMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:min|minute)s?/)
    if (minMatch) {
      return parseFloat(minMatch[1]) / 60
    }
    
    // Handle "X.X h" format
    const shortHourMatch = str.match(/(\d+(?:\.\d+)?)\s*h$/)
    if (shortHourMatch) {
      return parseFloat(shortHourMatch[1])
    }
    
    // Fallback - try to extract just the number (assume hours)
    const numMatch = str.match(/(\d+(?:\.\d+)?)/)
    if (numMatch) {
      return parseFloat(numMatch[1])
    }
    
    return 0
  }

  const totalFreeTime = analysisData?.freeTimePockets?.reduce((acc: number, slot: any) => {
    const hours = parseDurationToHours(slot.duration)
    return acc + hours
  }, 0) || 0

  useEffect(() => {
    const savedAnalysis = localStorage.getItem('timeLearnHub-analysis')
    const savedSchedule = localStorage.getItem('timeLearnHub-approvedSchedule')
    
    if (savedAnalysis) {
      try {
        setAnalysisData(JSON.parse(savedAnalysis))
        return
      } catch (e) {
        // failed to parse saved analysis
      }
    }
    
    if (savedSchedule) {
      performAnalysis()
    }
  }, [])

  const performAnalysis = async () => {
    try {
      setIsAnalyzing(true)
      onAnalysisStateChange?.(true)
      setError(null)
      
      const savedSchedule = localStorage.getItem('timeLearnHub-approvedSchedule')
      if (!savedSchedule) {
        setError('No approved schedule found')
        return
      }

      const scheduleArray = JSON.parse(savedSchedule)
      const scheduleData: any = {}
      
      scheduleArray.forEach((day: any) => {
        if (day.schedule && day.schedule.trim()) {
          scheduleData[day.day.toLowerCase()] = day.schedule.trim()
        }
      })

      // use sequential analysis for better reliability
      
      // analyze categories
      const categoryResult = await analyzeCategoriesSequential(scheduleData)
      if (!categoryResult.success || !categoryResult.categoryBreakdown) {
        throw new Error(categoryResult.message || 'Category analysis failed')
      }
      
      // analyze metrics
      const metricsResult = await analyzeMetricsSequential(scheduleData, categoryResult.categoryBreakdown)
      if (!metricsResult.success || !metricsResult.metrics) {
        throw new Error(metricsResult.message || 'Metrics analysis failed')
      }
      
      // analyze free time pockets
      const freeTimeResult = await analyzeFreeTimeSequential(scheduleData)
      if (!freeTimeResult.success || !freeTimeResult.freeTimePockets) {
        throw new Error(freeTimeResult.message || 'Free time analysis failed')
      }
      
      // analyze daily patterns
      const patternsResult = await analyzePatternsSequential(scheduleData, categoryResult.categoryBreakdown)
      if (!patternsResult.success || !patternsResult.dailyPatterns) {
        throw new Error(patternsResult.message || 'Pattern analysis failed')
      }
      
      // consolidate results into expected format
      const consolidatedAnalysis = {
        categoryBreakdown: categoryResult.categoryBreakdown,
        metrics: metricsResult.metrics,
        freeTimePockets: freeTimeResult.freeTimePockets,
        suggestions: freeTimeResult.suggestions || [],
        dailyPatterns: patternsResult.dailyPatterns,
        timeOptimizationTips: freeTimeResult.timeOptimizationTips || []
      }
      
      setAnalysisData(consolidatedAnalysis)
      localStorage.setItem('timeLearnHub-analysis', JSON.stringify(consolidatedAnalysis))
      
    } catch (error: any) {
      // handle api errors
      let errorMessage = 'Unable to analyze schedule. Please try again.'
      
      if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your internet connection and try again.'
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Our analysis servers are temporarily unavailable. Please try again in a few minutes.'
      } else if (error?.response?.status === 429) {
        errorMessage = 'Analysis requests are being rate limited. Please wait a moment and try again.'
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'Network error occurred during analysis. Please check your connection.'
      }
      
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
      onAnalysisStateChange?.(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Work': '#3B82F6',
      'Personal': '#10B981', 
      'Family': '#8B5CF6',
      'Family/Social': '#8B5CF6',
      'Health': '#EF4444',
      'Learning': '#F59E0B',
      'Chores': '#6B7280',
      'Chores/Errands': '#6B7280',
      'Sleep': '#4C1D95',
      'Meals': '#059669',
      'Leisure/Free Time': '#DC2626',
      'Other': '#6366F1'
    }
    return colors[category as keyof typeof colors] || colors.Other
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Analysis</h2>
          <p className="text-gray-600">Analyzing your schedule patterns and time distribution</p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Please don't close the browser while we analyse</h3>
            <p className="text-gray-600 max-w-md">
              This could take upto 2 mins thank you
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Analysis</h2>
          <p className="text-gray-600">Unable to analyze your schedule</p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-red-900">Analysis Failed</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={performAnalysis}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Analysis</h2>
            <p className="text-gray-600">Analyze your schedule patterns and identify optimization opportunities</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Analysis Status</p>
            <p className="text-2xl font-bold text-blue-600">Pending</p>
          </div>
        </div>

        {/* empty state card */}
        <Card className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data Available</h3>
          <p className="text-gray-600 mb-6">
            Complete your schedule input first to generate detailed analysis and insights.
          </p>
          {onViewChange && (
            <Button 
              onClick={() => onViewChange('schedule-input')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Complete Your Schedule Input
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Analysis</h2>
        <p className="text-gray-600">Visualize your schedule patterns and time distribution</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Weekly Schedule Overview
          </h3>
          <p className="text-sm text-gray-600 mb-4">Key insights and patterns from your schedule analysis</p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="text-sm text-blue-800">
              <strong>How to read your metrics:</strong> Hover over each metric below for detailed explanations. 
              These scores help you understand how structured your schedule is and identify opportunities for better work-life balance.
            </div>
          </div>
          
          <div className="text-center space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg group relative">
                <div className="text-2xl font-bold text-blue-600">{analysisData.metrics.overallEfficiency}%</div>
                <div className="text-sm text-gray-600">Schedule Efficiency</div>
                <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded-lg px-3 py-2 top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 z-10">
                  How much of your waking time is scheduled. Higher = more structured schedule.
                  <div className="text-xs mt-1 opacity-75">90%+ = Very structured, 70-89% = Well organized, 60-69% = Flexible</div>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg group relative">
                <div className="text-2xl font-bold text-green-600">{totalFreeTime.toFixed(0)}h</div>
                <div className="text-sm text-gray-600">Free Time/Week</div>
                <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded-lg px-3 py-2 top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 z-10">
                  Total unscheduled waking hours available for spontaneous activities or rest.
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg group relative">
                <div className="text-2xl font-bold text-purple-600">{analysisData.metrics.balanceScore}</div>
                <div className="text-sm text-gray-600">Balance Score</div>
                <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded-lg px-3 py-2 top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 z-10">
                  Work-life balance rating (1-5).
                  <div className="text-xs mt-1 opacity-75">5 = Excellent (≤40h work), 4 = Good (40-50h), 3 = Fair (50-60h), 2 = Poor (&gt;60h)</div>
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg group relative">
                <div className="text-2xl font-bold text-orange-600">{analysisData.metrics.activeDays}</div>
                <div className="text-sm text-gray-600">Active Days</div>
                <div className="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded-lg px-3 py-2 top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 z-10">
                  Number of days with planned activities. 7 means you have something scheduled every day.
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900 mb-2">Peak Activity</div>
              <div className="text-sm text-gray-600">{analysisData.metrics.peakActivity}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-green-600" />
            Category Breakdown
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            How you spend your 168 weekly hours (7 days × 24 hours). Hours per activity and percentage of your total week.
          </p>
          
          <div className="space-y-4">
            {(() => {
              const entries = Object.entries(analysisData.categoryBreakdown)
                .filter(([category, data]) => data.hours > 0)
              const maxPercentage = Math.max(...entries.map(([, data]) => data.percentage))
              
              return entries.map(([category, data]) => {
                const adjustedWidth = Math.max(8, (data.percentage / maxPercentage) * 85)
                
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span>{category}</span>
                      <div className="flex items-center space-x-2">
                        <span>{data.hours}h</span>
                        <span className="text-gray-500">{data.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full transition-all duration-700 ease-out" 
                        style={{ 
                          width: `${adjustedWidth}%`,
                          backgroundColor: getCategoryColor(category)
                        }} 
                      />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-600" />
          Daily Time Patterns
        </h3>
        <p className="text-sm text-gray-600 mb-4">Hour-by-hour breakdown showing patterns across the week</p>
        
        {analysisData.dailyPatterns ? (
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="flex">
                <div className="w-16 flex-shrink-0">
                  <div className="h-8 flex items-center text-xs font-semibold text-gray-700">Time</div>
                  {Array.from({ length: 18 }, (_, i) => 6 + i).map(hour => (
                    <div key={hour} className="h-6 flex items-center text-xs text-gray-600 border-r pr-2">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
                
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {DAYS.map(day => (
                    <div key={day} className="flex flex-col">
                      <div className="h-8 flex items-center justify-center text-xs font-semibold text-gray-700 border-b">
                        {day.slice(0, 3)}
                      </div>
                      
                      <div className="relative" style={{ height: `${18 * 24}px` }}>
                        {/* render free time pockets from analysis data */}
                        {(analysisData.freeTimePockets || [])
                          .filter((pocket: any) => pocket.day === day)
                          .map((pocket: any, index: number) => {
                            const startHour = parseInt(pocket.startTime.split(':')[0])
                            const endHour = parseInt(pocket.endTime.split(':')[0])
                            if (startHour < 6 || startHour > 23) return null
                            
                            const topPosition = (startHour - 6) * 24
                            const height = (endHour - startHour) * 24
                            return (
                              <div
                                key={`free-${index}`}
                                className="absolute bg-gray-100"
                                style={{
                                  top: `${topPosition}px`,
                                  height: `${height}px`,
                                  width: '100%'
                                }}
                                title={`Free Time: ${pocket.startTime} - ${pocket.endTime}`}
                              />
                            )
                          })}
                        
                        {/* render activities from analysis data */}
                        {(analysisData.dailyPatterns?.[day] || []).map((slot: any, index: number) => {
                          const hour = parseInt(slot.hour.split(':')[0])
                          if (hour < 6 || hour > 23) return null
                          
                          const topPosition = (hour - 6) * 24
                          return (
                            <div
                              key={index}
                              className="absolute"
                              style={{
                                top: `${topPosition}px`,
                                height: '24px',
                                backgroundColor: getCategoryColor(slot.category),
                                width: '100%'
                              }}
                              title={`${slot.activity} (${slot.category})`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Daily patterns will appear here after analysis completes</p>
          </div>
        )}
        
        {!analysisData && scheduleData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No schedule items to visualize</p>
            <p className="text-sm">Add schedule items to see your weekly pattern</p>
          </div>
        )}
      </Card>

      {/* Schedule Optimization Tips */}
      {analysisData.freeTimePockets && analysisData.freeTimePockets.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Schedule Optimization Tips</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Smart ways to improve your current routine and utilize free time</p>
          
          {analysisData.suggestions && analysisData.suggestions.length > 0 ? (
            <div className="space-y-4">
              {analysisData.suggestions.map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-900">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                Complete your schedule analysis to get personalized optimization tips.
              </p>
            </div>
          )}
        </Card>
      )}

    </div>
  )
}