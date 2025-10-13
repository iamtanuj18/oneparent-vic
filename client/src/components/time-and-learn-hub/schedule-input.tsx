'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Calendar, Plus, Trash2, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { validateScheduleInputs, ScheduleData } from '@/lib/api/time-and-learn-hub'

interface DaySchedule {
  day: string
  schedule: string
}

interface ScheduleInputProps {
  onViewChange?: (view: string) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function ScheduleInput({ onViewChange }: ScheduleInputProps) {
  // schedule state
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(
    DAYS.map(day => ({
      day,
      schedule: ''
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
  const [characterErrors, setCharacterErrors] = useState<{[key: string]: string}>({})

  const SCHEDULE_CHAR_LIMIT = 500 // 500 characters for daily schedule

  // Check if any day exceeds character limit
  const hasCharacterLimitErrors = () => {
    return daySchedules.some(day => day.schedule.length > SCHEDULE_CHAR_LIMIT) || 
           Object.keys(characterErrors).length > 0
  }

  useEffect(() => {
    // load saved schedule
    const saved = localStorage.getItem('timeLearnHub-approvedSchedule')
    if (saved) {
      try {
        const parsedSchedule = JSON.parse(saved)
        setSavedSchedule(parsedSchedule)
        setDaySchedules(parsedSchedule)
      } catch (e) {
        // failed to parse saved schedule
      }
    }
  }, [])

  useEffect(() => {
    const currentScheduleStr = JSON.stringify(daySchedules)
    const savedScheduleStr = JSON.stringify(savedSchedule)
    setHasChanges(currentScheduleStr !== savedScheduleStr && savedSchedule.length > 0)
  }, [daySchedules, savedSchedule])

  const handleScheduleChange = (day: string, schedule: string) => {
    // Always update the schedule first (allow typing but track errors)
    setDaySchedules(prev => prev.map(item => 
      item.day === day ? { ...item, schedule } : item
    ))
    
    // Check character limit and set/clear errors
    if (schedule.length > SCHEDULE_CHAR_LIMIT) {
      setCharacterErrors({
        ...characterErrors,
        [day]: `Schedule must be ${SCHEDULE_CHAR_LIMIT} characters or less`
      })
    } else {
      // Clear character error if within limit
      if (characterErrors[day]) {
        const newErrors = { ...characterErrors }
        delete newErrors[day]
        setCharacterErrors(newErrors)
      }
    }
    
    // clear validation errors when user starts typing
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

    // check for empty days all days must have content
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
        localStorage.setItem('timeLearnHub-approvedSchedule', JSON.stringify(daySchedules))
        localStorage.removeItem('timeLearnHub-analysis')
        setSavedSchedule([...daySchedules])
        setHasChanges(false)
        
        // automatically switch to schedule analysis tab when validation passes
        if (onViewChange) {
          onViewChange('visualization')
        }
      } else {
        setValidationState({
          type: 'error',
          message: result.message || 'Some schedule entries need attention.',
          flaggedDays: result.flaggedDays
        })
      }

      // scroll to message
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
      
      // scroll to error message
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

      {/* day tabs */}
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

      {/* validation messages */}
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
              
              {/* show flagged days */}
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

      {/* current day input */}
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
                      e.target.value = '' 
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
              maxLength={SCHEDULE_CHAR_LIMIT}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] ${
                characterErrors[currentDay] ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={`Example: "6am wake up, 7am breakfast, 8am drop kids at school, 9am-5pm work, 12:30pm lunch break free time, 5:30pm pick up kids, 7pm dinner, 8:30pm kids to bed, 9pm finally some me time, 11pm sleep"`}
            />
            
            {/* Character counter and error message */}
            <div className="flex justify-between items-center mt-2">
              {characterErrors[currentDay] && (
                <p className="text-red-600 text-sm flex items-center gap-1">
                  <AlertTriangle size={16} />
                  {characterErrors[currentDay]}
                </p>
              )}
              <div className={`text-sm ml-auto ${
                (daySchedules.find(d => d.day === currentDay)?.schedule.length || 0) > 450 ? 'text-orange-600' : 
                (daySchedules.find(d => d.day === currentDay)?.schedule.length || 0) > 480 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {daySchedules.find(d => d.day === currentDay)?.schedule.length || 0}/{SCHEDULE_CHAR_LIMIT} characters
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for better analysis of your schedule:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li><strong>Show your free time clearly</strong> (e.g., "lunch break free time", "finally some me time")</li>
              <li><strong>Include specific times</strong> (e.g., "9am-5pm work", "8pm kids to bed")</li>
              <li><strong>Mention gaps between activities</strong> - these are learning opportunities!</li>
              <li><strong>Include personal time</strong> like "relax time", "quiet time", "personal time"</li>
            </ul>
          </div>


        </div>
      </Card>

      {/* schedule summary */}
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
        
        {/* Character limit error message */}
        {hasCharacterLimitErrors() && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              <strong>Cannot analyze schedule:</strong> Some days exceed the {SCHEDULE_CHAR_LIMIT} character limit. Please shorten your schedule descriptions.
            </p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={saveSchedule} 
            disabled={isValidating || (!hasChanges && savedSchedule.length > 0) || hasCharacterLimitErrors()}
            className={`flex items-center ${
              (!hasChanges && savedSchedule.length > 0) || hasCharacterLimitErrors() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isValidating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Validating Schedule...
              </>
            ) : hasCharacterLimitErrors() ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Fix Character Limits First
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