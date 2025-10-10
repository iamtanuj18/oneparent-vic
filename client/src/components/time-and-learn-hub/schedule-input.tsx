'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Calendar, Plus, Trash2, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { validateScheduleInputs, ScheduleData } from '@/lib/api/time-and-learn-hub'

interface DaySchedule {
  day: string
  schedule: string
  activities: string[]
}

interface ScheduleInputProps {
  scheduleData: any[]
  onScheduleUpdate: (data: any[]) => void
  onViewChange?: (view: string) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function ScheduleInput({ scheduleData, onScheduleUpdate, onViewChange }: ScheduleInputProps) {
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day,
      schedule: '',
      activities: []
    }))
  )
  
  const [currentDay, setCurrentDay] = useState('Monday')
  const [isValidating, setIsValidating] = useState(false)
  const [validationState, setValidationState] = useState<{
    type: 'empty' | 'error' | 'success' | null
    message: string
    flaggedDays?: Array<{
      day: string
      issues: string[]
      type: string
    }>
  }>({ type: null, message: '' })
  
  const [savedSchedule, setSavedSchedule] = useState<DaySchedule[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('timeLearnHub-approvedSchedule')
    if (saved) {
      try {
        const parsedSchedule = JSON.parse(saved)
        setSavedSchedule(parsedSchedule)
        setDaySchedules(parsedSchedule)
      } catch (e) {
        console.error('Failed to parse saved schedule')
      }
    }
  }, [])

  useEffect(() => {
    const currentScheduleStr = JSON.stringify(daySchedules)
    const savedScheduleStr = JSON.stringify(savedSchedule)
    setHasChanges(currentScheduleStr !== savedScheduleStr && savedSchedule.length > 0)
  }, [daySchedules, savedSchedule])

  const handleScheduleChange = (day: string, schedule: string) => {
    setDaySchedules(prev => prev.map(item => 
      item.day === day ? { ...item, schedule } : item
    ))
    
    // clear errors when user starts typing
    if (schedule.trim().length > 0) {
      setValidationState({ type: null, message: '' })
    }
  }

  const copyFromDay = (fromDay: string, toDay: string) => {
    const sourceSchedule = daySchedules.find(item => item.day === fromDay)
    if (sourceSchedule && sourceSchedule.schedule.trim()) {
      handleScheduleChange(toDay, sourceSchedule.schedule)
    }
  }

  const getDaysWithContent = (excludeDay: string) => {
    return daySchedules.filter(item => 
      item.day !== excludeDay && item.schedule.trim().length > 0
    )
  }

  const clearDay = (day: string) => {
    handleScheduleChange(day, '')
  }

  const saveSchedule = async () => {
    // clear previous errors
    setValidationState({ type: null, message: '' })

    // check for empty days - all days must have content
    const emptyDays = daySchedules.filter(day => day.schedule.trim().length === 0)

    if (emptyDays.length > 0) {
      const emptyDayNames = emptyDays.map(day => day.day)
      setValidationState({
        type: 'empty',
        message: 'All days must have schedule information. Please fill in the following days:',
        flaggedDays: emptyDayNames.map(day => ({ day: day.toLowerCase(), issues: [], type: 'missing' as const }))
      })
      // scroll to error with smooth effect
      setTimeout(() => {
        const messageElement = document.getElementById('validation-message')
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
      return
    }

    // proceed with validation if all days have content
    setIsValidating(true)

    try {
      // prepare schedule data for validation
      const scheduleData: ScheduleData = {}
      daySchedules.forEach(daySchedule => {
        if (daySchedule.schedule.trim()) {
          scheduleData[daySchedule.day.toLowerCase() as keyof ScheduleData] = daySchedule.schedule.trim()
        }
      })

      // validate with backend
      const result = await validateScheduleInputs(scheduleData)

      if (result.valid) {
        console.log('Validation passed, switching to visualization tab')
        localStorage.setItem('timeLearnHub-approvedSchedule', JSON.stringify(daySchedules))
        localStorage.removeItem('timeLearnHub-analysis')
        setSavedSchedule([...daySchedules])
        setHasChanges(false)
        setValidationState({ type: null, message: '' })
        
        if (onViewChange) {
          console.log('Calling onViewChange with visualization')
          onViewChange('visualization')
        } else {
          console.error('onViewChange is not available')
        }
      } else {
        setValidationState({
          type: 'error',
          message: result.message || 'Some schedule entries need attention.',
          flaggedDays: result.flaggedDays
        })
      }

      // scroll to message with longer timeout to ensure element is rendered
      setTimeout(() => {
        const messageElement = document.getElementById('validation-message')
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)

    } catch (error: any) {
      setValidationState({
        type: 'error',
        message: 'Unable to validate schedule at this time. Please try again.'
      })
      
      // scroll to error message for network errors too
      setTimeout(() => {
        const messageElement = document.getElementById('validation-message')
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Input</h2>
        <p className="text-gray-600">Describe your weekly schedule in plain English for each day</p>
      </div>

      {/* Day Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setCurrentDay(day)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentDay === day
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {day}
            </button>
          ))}
        </nav>
      </div>

      {/* Consolidated Validation Messages */}
      {validationState.type && (
        <div 
          id="validation-message"
          className={`rounded-lg p-4 animate-in ${
            validationState.type === 'success' 
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start">
            {validationState.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {validationState.type === 'empty' && (
                <h4 className="text-sm font-medium mb-2 text-red-900">
                  Schedule incomplete
                </h4>
              )}
              <div className={`text-sm ${
                validationState.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {validationState.message}
              </div>
              
              {/* Show flagged days for both empty days and Gemini errors */}
              {((validationState.type === 'empty' || validationState.type === 'error') && validationState.flaggedDays && validationState.flaggedDays.length > 0) && (
                <div className="mt-3">
                  <p className="text-sm text-red-700 font-bold">
                    {validationState.flaggedDays.map((flaggedDay, index) => (
                      <span key={index} className="capitalize">
                        {flaggedDay.day}{index < (validationState.flaggedDays?.length || 0) - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Current Day Input */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            {currentDay} Schedule
          </h3>
          <div className="flex space-x-2">
            {getDaysWithContent(currentDay).length > 0 && (
              <div className="flex items-center space-x-2">
                <Copy className="w-4 h-4 text-blue-600" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      copyFromDay(e.target.value, currentDay)
                      e.target.value = '' // Reset dropdown
                    }
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Copy from day...</option>
                  {getDaysWithContent(currentDay).map((daySchedule) => (
                    <option key={daySchedule.day} value={daySchedule.day}>
                      {daySchedule.day}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearDay(currentDay)}
              className="flex items-center text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your {currentDay} schedule in plain English
            </label>
            <textarea
              value={daySchedules.find(d => d.day === currentDay)?.schedule || ''}
              onChange={(e) => handleScheduleChange(currentDay, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder={`Example: "Wake up at 7am, breakfast with kids at 8am, work from 9am to 5pm, pick up kids from school at 3:30pm, dinner at 6pm, bedtime routine at 8pm"`}
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better analysis of your schedule:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Always include specific times</strong> (e.g., "work from 9am to 5pm")</li>
              <li>• Mention activities with your children</li>
              <li>• Include breaks and personal time</li>
              <li>• Use the "Copy from day" dropdown for similar routines</li>
            </ul>
          </div>


        </div>
      </Card>

      {/* Schedule Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule Summary</h3>
          <div className="text-sm">
            <span className="text-green-600 font-medium">
              {daySchedules.filter(day => day.schedule.trim().length > 0).length}
            </span>
            <span className="text-gray-500"> of 7 days completed</span>
          </div>
        </div>
        <div className="space-y-3">
          {daySchedules.map((daySchedule) => (
            <div key={daySchedule.day} className="flex items-start space-x-3">
              <div className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
                {daySchedule.day}:
              </div>
              <div className="flex-1 text-sm">
                {daySchedule.schedule ? (
                  <span className="text-gray-600">{daySchedule.schedule}</span>
                ) : (
                  <span className="italic text-red-500 font-medium">Schedule required</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={saveSchedule} 
            disabled={isValidating || (!hasChanges && savedSchedule.length > 0)}
            className={`flex items-center ${(!hasChanges && savedSchedule.length > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isValidating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Validating Schedule...
              </>
            ) : (!hasChanges && savedSchedule.length > 0) ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                No Changes Detected
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Save and Analyze Schedule
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}