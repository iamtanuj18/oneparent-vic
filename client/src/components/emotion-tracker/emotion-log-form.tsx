'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Clock, 
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ANIMATION_CONFIG, FADE_UP_VARIANT } from '@/lib/animation'
import { MOOD_LABELS, MOOD_EMOJIS } from '@/lib/api/emotion-tracker'

interface EmotionLog {
  id: string
  date: string
  timestamp: number
  mood: number
  energy: number
  overwhelm: number
  emotions: string[]
  sleepHours: number
  activities: string[]
  week: number
}

// emotion categories following figma exactly
const EMOTIONS = {
  positive: {
    label: 'Positive Emotions',
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    selectedColor: 'bg-orange-500 text-white',
    emotions: [
      'excited', 'amazed', 'joyful', 'grateful', 'loved', 'accomplished',
      'appreciated', 'thankful', 'worthy'
    ]
  },
  productive: {
    label: 'Productive & Active',
    color: 'bg-green-100 text-green-800 hover:bg-green-200',
    selectedColor: 'bg-green-500 text-white',
    emotions: [
      'productive', 'motivated', 'active', 'relaxed', 'refreshed', 'calm'
    ]
  },
  neutral: {
    label: 'Neutral & Low Energy',
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    selectedColor: 'bg-blue-500 text-white',
    emotions: [
      'average', 'uneventful', 'sad', 'lonely', 'insecure', 'numb',
      'tired', 'unmotivated', 'nervous', 'bored', 'impatient', 'worried',
      'ashamed', 'confused', 'weak'
    ]
  },
  negative: {
    label: 'Negative & Intense',
    color: 'bg-red-100 text-red-800 hover:bg-red-200',
    selectedColor: 'bg-red-500 text-white',
    emotions: [
      'angry', 'anxious', 'disgusted', 'frustrated', 'annoyed', 'grumpy'
    ]
  }
}

const ACTIVITIES = [
  { id: 'exercised', label: 'Exercised', icon: '🏃' },
  { id: 'quality_time_kids', label: 'Quality time with kids', icon: '👨‍👩‍👧‍👦' },
  { id: 'connected_friends_family', label: 'Connected with friends/family', icon: '👥' },
  { id: 'relaxed_rested', label: 'Relaxed or rested', icon: '🧘' },
  { id: 'worked_personal_goal', label: 'Worked on a personal goal', icon: '🎯' },
  { id: 'self_care', label: 'Practiced self-care', icon: '💆' }
]

interface EmotionLogFormProps {
  onDataChange?: () => void;
}

export function EmotionLogForm({ onDataChange }: EmotionLogFormProps) {
  const [mood, setMood] = useState<number>(3)
  const [energy, setEnergy] = useState<number>(50)
  const [overwhelm, setOverwhelm] = useState<number>(50)
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [sleepHours, setSleepHours] = useState<number>(7)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [todayLogged, setTodayLogged] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [todayLogId, setTodayLogId] = useState<string | null>(null)
  const [todaysLogData, setTodaysLogData] = useState<EmotionLog | null>(null)
  const [originalValues, setOriginalValues] = useState<{
    mood: number;
    energy: number;
    overwhelm: number;
    emotions: string[];
    sleepHours: number;
    activities: string[];
  } | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  // load data from localStorage on component mount
  useEffect(() => {
    loadDataFromStorage()
    recalculateAllWeekNumbers() // Fix any existing logs with wrong week numbers
  }, [])

  // Listen for localStorage changes to refresh data
  useEffect(() => {
    const handleStorageChange = () => {
      loadDataFromStorage()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('emotion-data-changed', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('emotion-data-changed', handleStorageChange)
    }
  }, [])

  const loadDataFromStorage = () => {
    const savedLogs = localStorage.getItem('emotion-logs')
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs)
      setLogs(parsedLogs)
      checkIfTodayLogged(parsedLogs)
    } else {
      // Handle case when data is deleted
      setLogs([])
      setTodayLogged(false)
      setIsEditMode(false)
      setTodayLogId(null)
      setTodaysLogData(null)
      setOriginalValues(null)
      setErrors({})
      setHasTriedSubmit(false)
      setMood(3)
      setEnergy(50)
      setOverwhelm(50)
      setSelectedEmotions([])
      setSleepHours(7)
      setSelectedActivities([])
    }
  }

  const checkIfTodayLogged = (logs: EmotionLog[]) => {
    const today = new Date().toDateString()
    const todayLog = logs.find(log => new Date(log.timestamp).toDateString() === today)
    if (todayLog) {
      setTodayLogged(true)
      setTodayLogId(todayLog.id)
      setTodaysLogData(todayLog)
      setMood(todayLog.mood)
      setEnergy(todayLog.energy)
      setOverwhelm(todayLog.overwhelm)
      setSelectedEmotions(todayLog.emotions)
      setSleepHours(todayLog.sleepHours || 7)
      setSelectedActivities(todayLog.activities || [])
      setOriginalValues({
        mood: todayLog.mood,
        energy: todayLog.energy,
        overwhelm: todayLog.overwhelm,
        emotions: [...todayLog.emotions],
        sleepHours: todayLog.sleepHours || 7,
        activities: [...(todayLog.activities || [])]
      })
    } else {
      setTodaysLogData(null)
    }
  }

  // handle emotion selection/deselection
  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev => {
      const newEmotions = prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
      
      // Clear emotion error if user has now selected enough emotions
      if (newEmotions.length >= 3 && errors.emotions) {
        setErrors(prevErrors => ({ ...prevErrors, emotions: '' }))
      }
      
      return newEmotions
    })
  }

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    )
  }

  // get week number based on first log date
  const getWeekNumber = (date: Date, firstLogDate: Date): number => {
    const startOfFirstWeek = new Date(firstLogDate)
    startOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1) // Monday of first week
    startOfFirstWeek.setUTCHours(0, 0, 0, 0) // Normalize to UTC midnight to handle DST
    
    const startOfCurrentWeek = new Date(date)
    startOfCurrentWeek.setDate(date.getDate() - date.getDay() + 1) // Monday of current week
    startOfCurrentWeek.setUTCHours(0, 0, 0, 0) // Normalize to UTC midnight to handle DST
    
    const diffTime = startOfCurrentWeek.getTime() - startOfFirstWeek.getTime()
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000)) // Use Math.round for DST safety
    
    return Math.max(1, diffWeeks + 1)
  }

  // get current week number
  const getCurrentWeek = (): number => {
    if (logs.length === 0) return 1
    const firstLogDate = new Date(logs.reduce((earliest, log) => 
      log.timestamp < earliest.timestamp ? log : earliest
    ).timestamp)
    return getWeekNumber(new Date(), firstLogDate)
  }

  // Recalculate week numbers for all existing logs to fix inconsistencies
  const recalculateAllWeekNumbers = () => {
    const savedLogs = localStorage.getItem('emotion-logs')
    if (!savedLogs) return
    
    const existingLogs: EmotionLog[] = JSON.parse(savedLogs)
    if (existingLogs.length === 0) return
    
    // Get user start date (Monday of first log's week)
    let userStartDate = localStorage.getItem('user-emotion-start-date')
    if (!userStartDate) {
      const firstLogDate = new Date(existingLogs.reduce((earliest, log) => log.timestamp < earliest.timestamp ? log : earliest).timestamp)
      const mondayOfFirstWeek = new Date(firstLogDate)
      mondayOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1)
      userStartDate = mondayOfFirstWeek.toISOString().split('T')[0]
      localStorage.setItem('user-emotion-start-date', userStartDate)
    }
    
    // Recalculate week numbers for all logs
    const updatedLogs = existingLogs.map(log => {
      // Use timestamp for consistent date parsing (log.date string parsing can be inconsistent)
      const logDate = new Date(log.timestamp)
      const correctWeekNumber = getWeekNumber(logDate, new Date(userStartDate!))
      return {
        ...log,
        week: correctWeekNumber
      }
    })
    
    // Save updated logs
    localStorage.setItem('emotion-logs', JSON.stringify(updatedLogs))
    setLogs(updatedLogs)
  }

  // check if current values are different from original
  const hasValuesChanged = (): boolean => {
    if (!originalValues) return true
    return (
      mood !== originalValues.mood ||
      energy !== originalValues.energy ||
      overwhelm !== originalValues.overwhelm ||
      selectedEmotions.length !== originalValues.emotions.length ||
      !selectedEmotions.every(emotion => originalValues.emotions.includes(emotion))
    )
  }

  // handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset to original values
      if (originalValues) {
        setMood(originalValues.mood)
        setEnergy(originalValues.energy)
        setOverwhelm(originalValues.overwhelm)
        setSelectedEmotions([...originalValues.emotions])
      }
    }
    
    // Reset validation state when toggling edit mode
    setErrors({})
    setHasTriedSubmit(false)
    setIsEditMode(!isEditMode)
  }

  // handle bottom cancel button - with scroll up to show summary
  const handleBottomCancel = () => {
    if (isEditMode) {
      // Cancel edit - reset to original values
      if (originalValues) {
        setMood(originalValues.mood)
        setEnergy(originalValues.energy)
        setOverwhelm(originalValues.overwhelm)
        setSelectedEmotions([...originalValues.emotions])
      }
      // Auto-scroll to top to show summary with offset
      window.scrollTo({ top: 220, behavior: 'smooth' })
    }
    
    // Reset validation state when toggling edit mode
    setErrors({})
    setHasTriedSubmit(false)
    setIsEditMode(!isEditMode)
  }

  // get emotion color based on category
  const getEmotionColor = (emotion: string): string => {
    const positiveEmotions = EMOTIONS.positive.emotions
    const productiveEmotions = EMOTIONS.productive.emotions
    const neutralEmotions = EMOTIONS.neutral.emotions
    const negativeEmotions = EMOTIONS.negative.emotions
    
    if (positiveEmotions.includes(emotion)) {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    } else if (productiveEmotions.includes(emotion)) {
      return 'bg-green-100 text-green-800 border-green-200'
    } else if (neutralEmotions.includes(emotion)) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    } else if (negativeEmotions.includes(emotion)) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // get mood emoji for display
  const getMoodEmoji = (moodValue: number): string => {
    const emojis = ['😢', '😟', '😐', '🙂', '😊', '😍']
    return emojis[Math.max(0, Math.min(5, moodValue - 1))]
  }

  // get mood label for display
  const getMoodLabel = (moodValue: number): string => {
    const labels = ['Very Bad', 'Bad', 'Okay', 'Good', 'Great', 'Amazing']
    return labels[Math.max(0, Math.min(5, moodValue - 1))]
  }

  // validate form following app patterns
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    if (selectedEmotions.length < 3) {
      newErrors.emotions = `Please select at least ${3 - selectedEmotions.length} more emotion${3 - selectedEmotions.length !== 1 ? 's' : ''} to continue`
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }



  // submit or update emotion log - localStorage only
  const handleSubmit = () => {
    setHasTriedSubmit(true)
    
    if (!validateForm()) {
      // Scroll to show error message
      setTimeout(() => {
        const errorElement = document.querySelector('[data-error-message]')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return
    }

    const now = new Date()
    
    // Use the same start date logic as AI Analysis to ensure consistency
    let userStartDate = localStorage.getItem('user-emotion-start-date')
    console.log(`[DEBUG] Stored user start date: ${userStartDate}`)
    
    // Force recalculation of start date if there are existing logs to ensure consistency
    // This fixes any previously stored incorrect start dates due to date vs timestamp bugs
    const savedLogs = localStorage.getItem('emotion-logs')
    if (savedLogs) {
      const existingLogs = JSON.parse(savedLogs)
      if (existingLogs.length > 0) {
        const firstLogDate = new Date(existingLogs.reduce((earliest: any, log: any) => log.timestamp < earliest.timestamp ? log : earliest).timestamp)
        const mondayOfFirstWeek = new Date(firstLogDate)
        mondayOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1)
        const calculatedStartDate = mondayOfFirstWeek.toISOString().split('T')[0]
        
        console.log(`[DEBUG] First log timestamp: ${existingLogs.reduce((earliest: any, log: any) => log.timestamp < earliest.timestamp ? log : earliest).timestamp}`)
        console.log(`[DEBUG] First log date: ${firstLogDate.toDateString()}`)
        console.log(`[DEBUG] Calculated start date (Monday): ${calculatedStartDate}`)
        
        // Always update to ensure consistency - fixes any incorrect stored dates
        if (userStartDate !== calculatedStartDate) {
          console.log(`[DEBUG] Correcting user start date from ${userStartDate} to ${calculatedStartDate}`)
          userStartDate = calculatedStartDate
          localStorage.setItem('user-emotion-start-date', userStartDate)
        }
      }
    }
    
    if (!userStartDate) {
      if (logs.length > 0) {
        const firstLogDate = new Date(logs.reduce((earliest, log) => log.timestamp < earliest.timestamp ? log : earliest).timestamp)
        // Always use Monday of the week containing the first log
        const mondayOfFirstWeek = new Date(firstLogDate)
        mondayOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1)
        userStartDate = mondayOfFirstWeek.toISOString().split('T')[0]
      } else {
        // For brand new users, check if there are existing logs in localStorage that aren't loaded yet
        const savedLogs = localStorage.getItem('emotion-logs')
        if (savedLogs) {
          const existingLogs = JSON.parse(savedLogs)
          if (existingLogs.length > 0) {
            const firstLogDate = new Date(existingLogs.reduce((earliest: any, log: any) => log.timestamp < earliest.timestamp ? log : earliest).timestamp)
            const mondayOfFirstWeek = new Date(firstLogDate)
            mondayOfFirstWeek.setDate(firstLogDate.getDate() - firstLogDate.getDay() + 1)
            userStartDate = mondayOfFirstWeek.toISOString().split('T')[0]
          } else {
            // Truly brand new user - use Monday of this week
            const mondayOfThisWeek = new Date(now)
            mondayOfThisWeek.setDate(now.getDate() - now.getDay() + 1)
            userStartDate = mondayOfThisWeek.toISOString().split('T')[0]
          }
        } else {
          // No localStorage data - use Monday of this week
          const mondayOfThisWeek = new Date(now)
          mondayOfThisWeek.setDate(now.getDate() - now.getDay() + 1)
          userStartDate = mondayOfThisWeek.toISOString().split('T')[0]
        }
      }
      localStorage.setItem('user-emotion-start-date', userStartDate)
      console.log(`[DEBUG] Set user start date to: ${userStartDate}`)
    }

    const weekNumber = getWeekNumber(now, new Date(userStartDate))
    console.log(`[DEBUG] Calculated week number: ${weekNumber} for date: ${now.toDateString()} with start: ${userStartDate}`)
    
    // Ensure week number is never 0 or negative
    const finalWeekNumber = Math.max(1, weekNumber)
    console.log(`[DEBUG] Final week number: ${finalWeekNumber}`)

    let updatedLogs: EmotionLog[]

    if (isEditMode && todayLogId) {
      // Update existing log
      updatedLogs = logs.map(log => {
        if (log.id === todayLogId) {
          return {
            ...log,
            mood,
            energy,
            overwhelm,
            emotions: selectedEmotions,
            timestamp: now.getTime(), // Update timestamp for edit time
            week: finalWeekNumber // ← CRITICAL FIX: Update week number on edit
          }
        }
        return log
      })
    } else {
      // Remove any existing log for today and add new one (ensure one log per day)
      const today = new Date().toDateString()
      const logsWithoutToday = logs.filter(log => new Date(log.timestamp).toDateString() !== today)
      
      const newLog: EmotionLog = {
        id: Date.now().toString(),
        date: now.toDateString(),
        timestamp: now.getTime(),
        mood,
        energy,
        overwhelm,
        emotions: selectedEmotions,
        sleepHours,
        activities: selectedActivities,
        week: finalWeekNumber
      }
      
      updatedLogs = [...logsWithoutToday, newLog]
    }

    setLogs(updatedLogs)
    localStorage.setItem('emotion-logs', JSON.stringify(updatedLogs))
    
    // Force recalculation of all week numbers to ensure consistency
    // Note: Recalculation now uses timestamp for consistent parsing - may not need delayed recalculation
    recalculateAllWeekNumbers()
    
    // Update today's log state immediately to show summary
    const today = new Date().toDateString()
    const todaysLog = updatedLogs.find(log => new Date(log.timestamp).toDateString() === today)
    
    if (todaysLog) {
      setTodayLogId(todaysLog.id)
      setTodaysLogData(todaysLog)
    }
    
    // Update state immediately
    setTodayLogged(true)
    setIsEditMode(false)
    setErrors({})
    setHasTriedSubmit(false)
    setOriginalValues({
      mood,
      energy,
      overwhelm,
      emotions: [...selectedEmotions],
      sleepHours,
      activities: [...selectedActivities]
    })

    // Reset form only for new logs, not edits
    if (!isEditMode) {
      setMood(3)
      setEnergy(50)
      setOverwhelm(50)
      setSelectedEmotions([])
    }
    
    // notify parent of data change
    onDataChange?.()
    
    // Trigger events to update other components immediately
    window.dispatchEvent(new Event('emotion-data-changed'))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="space-y-6">
        {todayLogged && !isEditMode && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span>You've already logged your emotions today!</span>
                </div>
                <Button
                  onClick={handleEditToggle}
                  variant="outline"
                  className="text-green-700 border-green-300 hover:bg-green-100 px-6 py-2 font-semibold"
                >
                  Edit Today's Log
                </Button>
              </div>

              {/* Today's Emotion Summary */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-3">Today's Emotion Summary</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Mood */}
                  <div className="text-center">
                    <div className="text-3xl mb-1">{getMoodEmoji(todaysLogData?.mood || mood)}</div>
                    <div className="font-medium text-gray-900">{getMoodLabel(todaysLogData?.mood || mood)}</div>
                    <div className="text-sm text-gray-600">Overall Mood</div>
                  </div>

                  {/* Energy */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Energy</span>
                      <span className="font-semibold text-blue-600">{todaysLogData?.energy || energy}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                        style={{ width: `${todaysLogData?.energy || energy}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Overwhelm */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overwhelm</span>
                      <span className="font-semibold text-orange-600">{todaysLogData?.overwhelm || overwhelm}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" 
                        style={{ width: `${todaysLogData?.overwhelm || overwhelm}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Emotions */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-2">Emotions Felt ({todaysLogData?.emotions.length || selectedEmotions.length})</h5>
                  <div className="flex flex-wrap gap-2">
                    {(todaysLogData?.emotions || selectedEmotions).map((emotion) => (
                      <span
                        key={emotion}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border ${getEmotionColor(emotion)}`}
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sleep and Activities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sleep Hours */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Sleep</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">😴</span>
                      <span className="text-purple-600 font-semibold">
                        {todaysLogData?.sleepHours || sleepHours}h
                      </span>
                      <span className="text-gray-600 text-sm">of sleep</span>
                    </div>
                  </div>

                  {/* Activities */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Activities ({(todaysLogData?.activities || selectedActivities).length})
                    </h5>
                    {(todaysLogData?.activities || selectedActivities).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(todaysLogData?.activities || selectedActivities).map((activityId) => {
                          const activity = ACTIVITIES.find(a => a.id === activityId)
                          return (
                            <span
                              key={activityId}
                              className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                            >
                              {activity?.icon} {activity?.label}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No activities logged</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isEditMode && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span>Editing today's emotion log</span>
                </div>
                <Button
                  onClick={handleEditToggle}
                  variant="outline"
                  className="text-blue-700 border-blue-300 hover:bg-blue-100 px-6 py-2 font-semibold"
                >
                  Cancel Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(!todayLogged || isEditMode) && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">How was your mood?</h3>
            <p className="text-sm text-gray-600">
              Select your overall mood on a scale from 1 (very sad) to 6 (very happy)
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center gap-2">
              {MOOD_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMood(index + 1)
                    // Clear any mood-related errors
                    if (errors.mood) {
                      setErrors(prev => ({ ...prev, mood: '' }))
                    }
                  }}
                  className={`p-3 rounded-full transition-all hover:scale-110 ${
                    mood === index + 1 
                      ? 'bg-gray-900 text-white scale-110' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={MOOD_LABELS[index]}
                >
                  <span className="text-2xl">{emoji}</span>
                </button>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              {MOOD_LABELS[mood - 1]}
            </div>
          </CardContent>
        </Card>
        )}

        {(!todayLogged || isEditMode) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Energy Slider */}
          <Card>
            <CardHeader>
              <label className="block text-base font-semibold text-gray-900 mb-1">
                What was your energy level? <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600">Move the slider to indicate your energy</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="px-2">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={energy}
                    onChange={(e) => {
                      setEnergy(Number(e.target.value))
                      // Clear any energy-related errors
                      if (errors.energy) {
                        setErrors(prev => ({ ...prev, energy: '' }))
                      }
                    }}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer energy-slider"
                    style={{
                      background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${energy}%, #e5e7eb ${energy}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
              
              <div className="text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {energy}% Energy
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Overwhelm Slider */}
          <Card>
            <CardHeader>
              <label className="block text-base font-semibold text-gray-900 mb-1">
                How overwhelmed/busy were you? <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600">Move the slider to indicate your overwhelm level</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="px-2">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overwhelm}
                    onChange={(e) => {
                      setOverwhelm(Number(e.target.value))
                      // Clear any overwhelm-related errors
                      if (errors.overwhelm) {
                        setErrors(prev => ({ ...prev, overwhelm: '' }))
                      }
                    }}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer overwhelm-slider"
                    style={{
                      background: `linear-gradient(to right, #f87171 0%, #f87171 ${overwhelm}%, #e5e7eb ${overwhelm}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>0%</span>
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
              
              <div className="text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  {overwhelm}% Overwhelm
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {(!todayLogged || isEditMode) && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                How many hours of sleep did you have last night? <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600">
                Drag the slider to indicate your total sleep hours
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="px-2">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer sleep-slider"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(sleepHours / 12) * 100}%, #e5e7eb ${(sleepHours / 12) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>0h</span>
                <span>2h</span>
                <span>4h</span>
                <span>6h</span>
                <span>8h</span>
                <span>10h</span>
                <span>12h</span>
              </div>
              
              <div className="text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {sleepHours}h Sleep
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {(!todayLogged || isEditMode) && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                What activities did you do today?
              </h3>
              <p className="text-sm text-gray-600">
                Select all activities that apply to your day (optional)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACTIVITIES.map((activity) => {
                  const isSelected = selectedActivities.includes(activity.id)
                  return (
                    <button
                      key={activity.id}
                      onClick={() => toggleActivity(activity.id)}
                      className={`text-left p-3 rounded-lg border transition-all hover:scale-105 ${
                        isSelected 
                          ? 'bg-green-50 border-green-300 text-green-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-lg mr-2">{activity.icon}</span>
                        <span className="font-medium">{activity.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {selectedActivities.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm mb-2">Selected activities ({selectedActivities.length}):</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivities.map((activityId) => {
                      const activity = ACTIVITIES.find(a => a.id === activityId)
                      return (
                        <span key={activityId} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {activity?.icon} {activity?.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(!todayLogged || isEditMode) && (
          <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              How did you feel? <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600">
              Select at least 3 emotions that apply to your day. You can choose multiple emotions.
            </p>
            {/* Real-time feedback for selection progress */}
            {selectedEmotions.length > 0 && selectedEmotions.length < 3 && !hasTriedSubmit && (
              <p className="text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                {3 - selectedEmotions.length} more emotion{3 - selectedEmotions.length !== 1 ? 's' : ''} needed to continue
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Display - prominent placement */}
            {(hasTriedSubmit && errors.emotions) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.emotions}</p>
              </div>
            )}
            
            {Object.entries(EMOTIONS).map(([key, category]) => (
              <div key={key} className="space-y-3">
                <h4 className="text-sm text-gray-600 font-medium">{category.label}</h4>
                <div className="flex flex-wrap gap-2">
                  {category.emotions.map((emotion) => {
                    const isSelected = selectedEmotions.includes(emotion)
                    return (
                      <button
                        key={emotion}
                        className={`cursor-pointer transition-all hover:scale-105 px-3 py-1 rounded-full text-sm font-medium ${
                          isSelected ? category.selectedColor : category.color
                        }`}
                        onClick={() => toggleEmotion(emotion)}
                      >
                        {emotion}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {selectedEmotions.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm mb-2">Selected emotions ({selectedEmotions.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEmotions.map((emotion) => (
                    <span key={emotion} className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {(!todayLogged || isEditMode) && (
          <div className="flex justify-center gap-4">
            {isEditMode && (
              <Button 
                variant="outline"
                onClick={handleBottomCancel}
                className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 px-6 py-2 font-semibold"
              >
                Cancel Edit
              </Button>
            )}
            <Button 
              variant="primary"
              onClick={handleSubmit}
              className={`w-full sm:w-auto transition-colors px-6 py-2 font-semibold ${
                selectedEmotions.length < 3 || (isEditMode && !hasValuesChanged())
                  ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={selectedEmotions.length < 3 || (isEditMode && !hasValuesChanged())}
            >
              {selectedEmotions.length < 3 
                ? `Select ${3 - selectedEmotions.length} More Emotion${3 - selectedEmotions.length !== 1 ? 's' : ''}`
                : isEditMode 
                  ? (hasValuesChanged() ? 'Update Today\'s Emotions' : 'No Changes Made')
                  : 'Log Today\'s Emotions'
              }
            </Button>
          </div>
        )}


      </div>
    </div>
  )
}