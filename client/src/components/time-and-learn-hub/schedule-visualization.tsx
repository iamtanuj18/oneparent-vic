'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart3, PieChart, Clock, Calendar, Target, Zap, BarChart2, Loader } from 'lucide-react'
import { analyzeSchedule, ScheduleAnalysisResponse } from '@/lib/api/time-and-learn-hub'

interface ScheduleVisualizationProps {
  scheduleData: any[]
}

export function ScheduleVisualization({ scheduleData }: ScheduleVisualizationProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<ScheduleAnalysisResponse['analysis'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    const savedAnalysis = localStorage.getItem('timeLearnHub-analysis')
    const savedSchedule = localStorage.getItem('timeLearnHub-approvedSchedule')
    
    if (savedAnalysis) {
      try {
        setAnalysisData(JSON.parse(savedAnalysis))
        return
      } catch (e) {
        console.error('Failed to parse saved analysis')
      }
    }
    
    if (savedSchedule) {
      performAnalysis()
    }
  }, [])

  const performAnalysis = async () => {
    try {
      setIsAnalyzing(true)
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

      const result = await analyzeSchedule(scheduleData)
      
      if (result.success && result.analysis) {
        setAnalysisData(result.analysis)
        localStorage.setItem('timeLearnHub-analysis', JSON.stringify(result.analysis))
      } else {
        setError(result.message || 'Analysis failed')
      }
    } catch (error: any) {
      setError('Unable to analyze schedule. Please try again.')
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  const getTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }

  const timeSlots = getTimeSlots()

  const isTimeSlotOccupied = (day: string, time: string) => {
    return scheduleData.some(item => {
      if (item.day !== day) return false
      
      const itemStart = item.startTime
      const itemEnd = item.endTime
      const slotTime = time
      
      return slotTime >= itemStart && slotTime < itemEnd
    })
  }

  const getScheduleItemForSlot = (day: string, time: string) => {
    return scheduleData.find(item => {
      if (item.day !== day) return null
      
      const itemStart = item.startTime
      const itemEnd = item.endTime
      const slotTime = time
      
      return slotTime >= itemStart && slotTime < itemEnd
    })
  }

  const getCategoryStats = () => {
    const stats: { [key: string]: number } = {}
    scheduleData.forEach(item => {
      if (item.endTime && item.startTime) {
        const start = new Date(`2024-01-01 ${item.startTime}`)
        const end = new Date(`2024-01-01 ${item.endTime}`)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        stats[item.category] = (stats[item.category] || 0) + hours
      }
    })
    return stats
  }

  const categoryStats = getCategoryStats()
  const totalHours = Object.values(categoryStats).reduce((a, b) => a + b, 0)

  const getCategoryColor = (category: string) => {
    const colors = {
      Work: '#3B82F6',
      Personal: '#10B981',
      Family: '#8B5CF6',
      Health: '#EF4444',
      Learning: '#F59E0B',
      Chores: '#6B7280',
      Other: '#6366F1'
    }
    return colors[category as keyof typeof colors] || colors.Other
  }

  const getDayStats = () => {
    const dayStats: { [key: string]: number } = {}
    DAYS.forEach(day => {
      dayStats[day] = scheduleData
        .filter(item => item.day === day)
        .reduce((acc, item) => {
          if (item.endTime && item.startTime) {
            const start = new Date(`2024-01-01 ${item.startTime}`)
            const end = new Date(`2024-01-01 ${item.endTime}`)
            return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          }
          return acc
        }, 0)
    })
    return dayStats
  }

  const dayStats = getDayStats()
  const maxDayHours = Math.max(...Object.values(dayStats))

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
            <h3 className="text-lg font-semibold text-gray-900">Analysis in Progress</h3>
            <p className="text-gray-600 max-w-md">
              Please don't close this page. Our AI is thoroughly analyzing your schedule, 
              finding optimal free time pockets, and calculating insights.
            </p>
            <p className="text-sm text-gray-500">This process may take up to 2 minutes.</p>
          </div>
          
          <div className="w-full max-w-md bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Analysis</h2>
          <p className="text-gray-600">No analysis data available</p>
        </div>
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
                <div className="text-2xl font-bold text-green-600">{analysisData.metrics.weeklyFreeTime}h</div>
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
          <p className="text-sm text-gray-600 mb-4">Detailed time allocation with percentages</p>
          
          <div className="space-y-4">
            {Object.entries(analysisData.categoryBreakdown).map(([category, data]) => (
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
                    className="h-3 rounded-full" 
                    style={{ 
                      width: `${data.percentage}%`,
                      backgroundColor: getCategoryColor(category)
                    }} 
                  />
                </div>
              </div>
            ))}
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
                        {/* Default background for free time */}
                        <div className="absolute inset-0 bg-gray-100" style={{ height: '100%' }} title="Free Time" />
                        
                        {/* Render activities from analysis data */}
                        {(analysisData.dailyPatterns?.[day] || []).map((slot: any, index: number) => {
                          const hour = parseInt(slot.hour.split(':')[0])
                          if (hour < 6 || hour > 23) return null // Only show 6AM-11PM
                          
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
        
        {scheduleData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No schedule items to visualize</p>
            <p className="text-sm">Add schedule items to see your weekly pattern</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          Schedule Optimization Suggestions
        </h3>
        <p className="text-sm text-gray-600 mb-6">Personalized recommendations to optimize your routine</p>
        
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
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Optimization suggestions will appear here after analysis completes</p>
          </div>
        )}
      </Card>
    </div>
  )
}