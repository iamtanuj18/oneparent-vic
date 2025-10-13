'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Target } from 'lucide-react'

interface FreeTimePocketsProps {
  onViewChange?: (view: string) => void
}

interface FreeTimeSlot {
  day: string
  startTime: string
  endTime: string
  duration: string
  suggestedActivities: string[]
}

export function FreeTimePockets({ onViewChange }: FreeTimePocketsProps) {
  const [freeTimeSlots, setFreeTimeSlots] = useState<FreeTimeSlot[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedAnalysis = localStorage.getItem('timeLearnHub-analysis')
    if (savedAnalysis) {
      try {
        const analysisData = JSON.parse(savedAnalysis)
        if (analysisData.freeTimePockets) {
          setFreeTimeSlots(analysisData.freeTimePockets)
        }
        // check for suggestions in multiple possible locations
        let loadedSuggestions: string[] = []
        
        if (analysisData.suggestions && analysisData.suggestions.length > 0) {
          loadedSuggestions = analysisData.suggestions
        } else if (analysisData.timeOptimizationTips && analysisData.timeOptimizationTips.length > 0) {
          loadedSuggestions = analysisData.timeOptimizationTips
        } else if (analysisData.freeTimeAnalysis?.suggestions && analysisData.freeTimeAnalysis.suggestions.length > 0) {
          loadedSuggestions = analysisData.freeTimeAnalysis.suggestions
        }
        
        setSuggestions(loadedSuggestions)
      } catch (e) {
        // failed to parse analysis data
      }
    }
    setIsLoading(false)
  }, [])



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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Free Time Pockets Found</h3>
          <p className="text-gray-600 mb-6">
            Your schedule appears to be fully packed! Try updating your schedule with more realistic time gaps between activities, or consider if some activities could be shortened to create free time opportunities.
          </p>
          {onViewChange && (
            <Button 
              onClick={() => onViewChange('schedule-input')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Update Your Schedule
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {freeTimeSlots.map((slot, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              {/* day and time in corner */}
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
            </Card>
          ))}
        </div>
      )}
      
      {/* schedule optimization suggestions */}
      {freeTimeSlots.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
          <div className="flex items-center mb-6">
            <Target className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Schedule Optimization Tips</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Smart ways to improve your current routine and utilize free time</p>
          
          {suggestions && suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion: string, index: number) => (
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