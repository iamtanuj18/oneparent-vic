'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, ChevronDown, ChevronUp, Zap, BookOpen, Coffee } from 'lucide-react'

interface FreeTimePocketsProps {
  scheduleData: any[]
}

interface FreeTimeSlot {
  day: string
  startTime: string
  endTime: string
  duration: string
  suggestedActivities: string[]
}

export function FreeTimePockets({ scheduleData }: FreeTimePocketsProps) {
  const [freeTimeSlots, setFreeTimeSlots] = useState<FreeTimeSlot[]>([])
  const [timeOptimizationTips, setTimeOptimizationTips] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set())

  useEffect(() => {
    const savedAnalysis = localStorage.getItem('timeLearnHub-analysis')
    if (savedAnalysis) {
      try {
        const analysisData = JSON.parse(savedAnalysis)
        if (analysisData.freeTimePockets) {
          setFreeTimeSlots(analysisData.freeTimePockets)
        }
        if (analysisData.timeOptimizationTips) {
          setTimeOptimizationTips(analysisData.timeOptimizationTips)
        }
      } catch (e) {
        console.error('Failed to parse analysis data')
      }
    }
    setIsLoading(false)
  }, [])

  const toggleSlot = (index: number) => {
    const newExpanded = new Set(expandedSlots)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSlots(newExpanded)
  }

  const getDurationColor = (duration: string) => {
    const durationFloat = parseFloat(duration)
    if (durationFloat >= 2) return 'text-green-600 bg-green-50'
    if (durationFloat >= 1) return 'text-blue-600 bg-blue-50'
    return 'text-orange-600 bg-orange-50'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Time Pockets</h2>
          <p className="text-gray-600">Loading your available time slots...</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Time Pockets</h2>
          <p className="text-gray-600">Discover available time slots for learning and personal activities</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Available Slots</p>
          <p className="text-2xl font-bold text-blue-600">{freeTimeSlots.length}</p>
        </div>
      </div>

      {freeTimeSlots.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Free Time Slots Found</h3>
          <p className="text-gray-600 mb-4">
            Complete your schedule analysis first to discover available time pockets.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {freeTimeSlots.map((slot, index) => {
            const isExpanded = expandedSlots.has(index)
            
            return (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                {/* Day and time in corner */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{slot.day}</div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {slot.startTime} - {slot.endTime}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDurationColor(slot.duration)}`}>
                    {slot.duration}
                  </div>
                </div>
                
                {/* Activities button */}
                <Button
                  variant="outline"
                  onClick={() => toggleSlot(index)}
                  className="w-full mb-2 justify-between"
                >
                  {isExpanded ? 'Hide Activities' : 'Suggested Activities'}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
                
                {/* Expanded activities */}
                {isExpanded && slot.suggestedActivities && (
                  <div className="mt-3 space-y-2">
                    {slot.suggestedActivities.map((activity, activityIndex) => {
                      const durationFloat = parseFloat(slot.duration)
                      let icon = Coffee
                      let timeEstimate = '30-60 min'
                      
                      if (durationFloat >= 2) {
                        icon = BookOpen
                        timeEstimate = '2+ hours'
                      } else if (durationFloat >= 1) {
                        icon = Zap
                        timeEstimate = '90-120 min'
                      }
                      
                      const Icon = icon
                      
                      return (
                        <div key={activityIndex} className="flex items-center p-2 bg-gray-50 rounded-lg">
                          <Icon className="w-4 h-4 mr-2 text-gray-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{activity}</div>
                            <div className="text-xs text-gray-500">({timeEstimate})</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
      
      {/* Time Optimization Tips Section */}
      {timeOptimizationTips.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center mb-6">
            <Zap className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Time Optimization Tips</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Learning Sessions</h4>
              <p className="text-gray-700 text-sm mb-4">
                {timeOptimizationTips[0] || 'Use longer slots for focused learning and skill development.'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Quick Wins</h4>
              <p className="text-gray-700 text-sm mb-4">
                {timeOptimizationTips[1] || 'Turn short breaks into micro-learning opportunities.'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Consistency</h4>
              <p className="text-gray-700 text-sm mb-4">
                {timeOptimizationTips[2] || 'Regular daily slots work better than sporadic long sessions.'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Energy Management</h4>
              <p className="text-gray-700 text-sm mb-4">
                {timeOptimizationTips[3] || 'Match challenging topics to your peak energy times.'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}