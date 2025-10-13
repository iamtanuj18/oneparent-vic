'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X, BookOpen, Clock, Save, AlertTriangle } from 'lucide-react'
import { generateCourseId } from '@/lib/utils/time-learn-hub'
import { validateLearningPlan, generateLearningPlan } from '@/lib/api/time-and-learn-hub'
import { Course } from '@/types/time-learn-hub'
interface CourseCreationProps {
  courses: Course[]
  onCourseUpdate: (courses: Course[]) => void
  onViewChange?: (view: string) => void
  onGeneratingChange?: (generating: boolean) => void
}

const COURSE_CATEGORIES = [
  { id: 'creative', label: 'Creative Hobbies', examples: ['Photography', 'Digital Art', 'Cooking', 'Gardening', 'Crafting', 'Painting'] },
  { id: 'tech', label: 'Basic Tech Skills', examples: ['Phone Photography', 'Social Media Basics', 'Computer Basics', 'Photo Editing', 'Online Safety'] },
  { id: 'languages', label: 'Languages', examples: ['Spanish Basics', 'French Phrases', 'Italian Essentials', 'German Basics', 'Japanese Basics'] }
]

const INTEREST_LEVELS = ['Beginner', 'Curious', 'Enthusiast']
const LEARNING_STYLES = ['Visual Learner', 'Hands-on Practice', 'Reading-focused']

export function CourseCreation({ courses, onCourseUpdate, onViewChange, onGeneratingChange }: CourseCreationProps) {
  const [showForm, setShowForm] = useState(false)
  const [courseData, setCourseData] = useState({
    category: 'creative',
    interestLevel: 'Beginner',
    learningStyle: 'Visual Learner',
    specificInterests: [] as string[]
  })
  const [customInterest, setCustomInterest] = useState('')
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [showValidation, setShowValidation] = useState(false)
  const [safetyCheckLoading, setSafetyCheckLoading] = useState(false)
  const [safetyCheckError, setSafetyCheckError] = useState('')
  const [courseGenerating, setCourseGenerating] = useState(false)

  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!courseData.category) {
      errors.category = 'Please select a learning category'
    }
    
    if (!courseData.interestLevel) {
      errors.interestLevel = 'Please select your interest level'
    }
    
    if (!courseData.learningStyle) {
      errors.learningStyle = 'Please select your learning style'
    }
    
    if (courseData.specificInterests.length < 2) {
      errors.specificInterests = 'Please select at least 2 specific interests'
    }
    
    setValidationErrors(errors)
    setShowValidation(true)
    return Object.keys(errors).length === 0
  }

  const performSafetyCheck = async () => {
    setSafetyCheckLoading(true)
    setSafetyCheckError('')
    
    try {
      const result = await validateLearningPlan({
        category: courseData.category,
        interestLevel: courseData.interestLevel,
        learningStyle: courseData.learningStyle,
        specificInterests: courseData.specificInterests
      })

      if (!result.safe) {
        const flaggedItems = result.flaggedItems || []
        let errorMessage = ''
        
        if (flaggedItems.length > 0) {
          errorMessage = `Please modify these interests: ${flaggedItems.join(', ')}`
        } else if (result.issues && result.issues.length > 0) {
          errorMessage = result.issues.map(issue => issue.reason).join(', ')
        } else {
          errorMessage = 'Please review and adjust your learning interests to continue.'
        }
        
        setSafetyCheckError(errorMessage)
        return false
      }

      return true
    } catch (error: any) {
      // use the backend error message if available, otherwise provide a helpful fallback
      const errorMessage = error.message || 'Unable to process your request right now. Please try again in a moment.'
      setSafetyCheckError(errorMessage)
      return false
    } finally {
      setSafetyCheckLoading(false)
    }
  }

  const handleCreateCourse = async () => {
    // clear any existing safety errors
    if (safetyCheckError) {
      setSafetyCheckError('')
    }

    if (!validateForm()) {
      // scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('[data-error]')
        if (firstError) {
          firstError.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 100)
      return
    }

    // perform safety check before proceeding
    const isSafe = await performSafetyCheck()
    
    if (!isSafe) {
      // safety check failed, error will be displayed automatically
      return
    }

    // if safety check passes, start course generation
    generateCourse()
  }

  const addCustomInterest = () => {
    const trimmedInterest = customInterest.trim()
    
    // Validate character length
    if (trimmedInterest.length > 60) {
      setValidationErrors({
        ...validationErrors, 
        customInterest: 'Interest must be 60 characters or less'
      })
      return
    }
    
    if (trimmedInterest && !courseData.specificInterests.includes(trimmedInterest)) {
      const newInterests = [...courseData.specificInterests, trimmedInterest]
      setCourseData({
        ...courseData,
        specificInterests: newInterests
      })
      setCustomInterest('')
      // clear custom interest error
      if (validationErrors.customInterest) {
        setValidationErrors({...validationErrors, customInterest: ''})
      }
      // clear error if we now have enough interests
      if (showValidation && validationErrors.specificInterests && newInterests.length >= 2) {
        setValidationErrors({...validationErrors, specificInterests: ''})
      }
      // clear safety error when modifying interests
      if (safetyCheckError) {
        setSafetyCheckError('')
      }
    }
  }

  const generateCourse = async () => {
    setCourseGenerating(true)
    onGeneratingChange?.(true)
    
    try {
      const analysisData = JSON.parse(localStorage.getItem('timeLearnHub-analysis') || '{}')
      const freeTimePockets = analysisData.freeTimePockets || []
      
      const generatedCourse = await generateLearningPlan({
        category: courseData.category,
        interestLevel: courseData.interestLevel,
        learningStyle: courseData.learningStyle,
        specificInterests: courseData.specificInterests,
        freeTimePockets: freeTimePockets
      })

      const courseId = generateCourseId()

      const newCourse: Course = {
        id: courseId,
        ...generatedCourse,
        createdAt: new Date().toISOString(),
        progress: 0,
        completedModules: [],
        completedQuizzes: {}
      }

      const updatedCourses = [...courses, newCourse]
      onCourseUpdate(updatedCourses)
      
      localStorage.setItem('timeLearnHub-courses', JSON.stringify(updatedCourses))
      
      setCourseData({
        category: 'creative',
        interestLevel: 'Beginner',
        learningStyle: 'Visual Learner',
        specificInterests: []
      })
      setShowForm(false)
      
      // switch to learning progress tab after course creation
      if (onViewChange) {
        onViewChange('progress')
      }
      
    } catch (error: any) {
      setSafetyCheckError('Unable to generate your course at this time. Please try again.')
    } finally {
      setCourseGenerating(false)
      onGeneratingChange?.(false)
    }
  }

  const handleDeleteCourse = (courseId: string) => {
    onCourseUpdate(courses.filter(course => course.id !== courseId))
  }

  // check if schedule analysis is completed
  const checkAnalysisCompleted = () => {
    const savedAnalysis = localStorage.getItem('timeLearnHub-analysis')
    if (!savedAnalysis) return false
    
    try {
      const analysisData = JSON.parse(savedAnalysis)
      return Boolean(
        analysisData.categoryBreakdown && 
        analysisData.freeTimePockets && 
        analysisData.metrics
      )
    } catch {
      return false
    }
  }

  const isAnalysisCompleted = checkAnalysisCompleted()
  
  // check if learning plan exists (only allow one)
  const hasLearningPlan = courses.length > 0
  const currentPlan = hasLearningPlan ? courses[0] : null

  // if no analysis is completed, show redirect message
  if (!isAnalysisCompleted) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Learning Plan</h2>
          <p className="text-gray-600">Design personalized micro-learning plans for your free time</p>
        </div>
        
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Analysis Required</h3>
          <p className="text-gray-600 mb-6">
            To create a personalized learning plan, we need to analyze your schedule first to understand your available time slots and preferences.
          </p>
          {onViewChange && (
            <Button 
              onClick={() => onViewChange('schedule-input')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Complete Schedule Analysis
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Learning Plan</h2>
          <p className="text-gray-600">
            {hasLearningPlan 
              ? "Your personalized micro-learning plan" 
              : "Design personalized micro-learning plans for your free time"
            }
          </p>
        </div>
        {!hasLearningPlan && (
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="flex items-center"
            variant={showForm ? "outline" : "primary"}
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create New Learning Plan
              </>
            )}
          </Button>
        )}
      </div>

      {!hasLearningPlan && showForm && (
        <Card className="p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
              New Learning Plan
            </h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div data-error={showValidation && validationErrors.category ? "true" : undefined}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={courseData.category}
                  onChange={(e) => {
                    setCourseData({...courseData, category: e.target.value})
                    if (showValidation && validationErrors.category) {
                      setValidationErrors({...validationErrors, category: ''})
                    }
                    if (safetyCheckError) {
                      setSafetyCheckError('')
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    showValidation && validationErrors.category 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                >
                  {COURSE_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
                {showValidation && validationErrors.category && (
                  <p className="mt-1 text-sm text-red-600" data-error-message>
                    {validationErrors.category}
                  </p>
                )}
              </div>
              
              <div data-error={showValidation && validationErrors.interestLevel ? "true" : undefined}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Level *
                </label>
                <select
                  value={courseData.interestLevel}
                  onChange={(e) => {
                    setCourseData({...courseData, interestLevel: e.target.value})
                    if (showValidation && validationErrors.interestLevel) {
                      setValidationErrors({...validationErrors, interestLevel: ''})
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    showValidation && validationErrors.interestLevel 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                >
                  {INTEREST_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                {showValidation && validationErrors.interestLevel && (
                  <p className="mt-1 text-sm text-red-600" data-error-message>
                    {validationErrors.interestLevel}
                  </p>
                )}
              </div>

              <div data-error={showValidation && validationErrors.learningStyle ? "true" : undefined}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Style *
                </label>
                <select
                  value={courseData.learningStyle}
                  onChange={(e) => {
                    setCourseData({...courseData, learningStyle: e.target.value})
                    if (showValidation && validationErrors.learningStyle) {
                      setValidationErrors({...validationErrors, learningStyle: ''})
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    showValidation && validationErrors.learningStyle 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                >
                  {LEARNING_STYLES.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                {showValidation && validationErrors.learningStyle && (
                  <p className="mt-1 text-sm text-red-600" data-error-message>
                    {validationErrors.learningStyle}
                  </p>
                )}
              </div>
            </div>

            <div data-error={showValidation && validationErrors.specificInterests ? "true" : undefined}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Interests * (minimum 2, select or add your own)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Examples: {COURSE_CATEGORIES.find(c => c.id === courseData.category)?.examples.join(', ')}
              </p>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {COURSE_CATEGORIES.find(c => c.id === courseData.category)?.examples.map(example => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        if (!courseData.specificInterests.includes(example)) {
                          const newInterests = [...courseData.specificInterests, example]
                          setCourseData({
                            ...courseData, 
                            specificInterests: newInterests
                          })
                          // clear error if we now have enough interests
                          if (showValidation && validationErrors.specificInterests && newInterests.length >= 2) {
                            setValidationErrors({...validationErrors, specificInterests: ''})
                          }
                          // clear safety error when modifying interests
                          if (safetyCheckError) {
                            setSafetyCheckError('')
                          }
                        }
                      }}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        courseData.specificInterests.includes(example)
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {example}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInterest}
                    maxLength={60}
                    onChange={(e) => {
                      const value = e.target.value
                      setCustomInterest(value)
                      
                      // Clear error when user starts typing within limit
                      if (value.length <= 60 && validationErrors.customInterest) {
                        setValidationErrors({...validationErrors, customInterest: ''})
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomInterest()
                      }
                    }}
                    placeholder="Add your own interest..."
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.customInterest ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  <Button 
                    type="button"
                    onClick={addCustomInterest}
                    variant="outline"
                  >
                    Add
                  </Button>
                </div>
                
                {/* Character counter and error message */}
                <div className="flex justify-between items-center">
                  {validationErrors.customInterest && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertTriangle size={16} />
                      {validationErrors.customInterest}
                    </p>
                  )}
                  <div className={`text-sm ml-auto ${
                    customInterest.length > 50 ? 'text-orange-600' : 
                    customInterest.length > 55 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {customInterest.length}/60 characters
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {courseData.specificInterests.map((interest, index) => (
                    <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {interest}
                      <button
                        type="button"
                        onClick={() => {
                          setCourseData({
                            ...courseData,
                            specificInterests: courseData.specificInterests.filter((_, i) => i !== index)
                          })
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {showValidation && validationErrors.specificInterests && (
                <p className="mt-2 text-sm text-red-600" data-error-message>
                  {validationErrors.specificInterests}
                </p>
              )}
            </div>

            {/* safety check error display */}
            {safetyCheckError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-700">{safetyCheckError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Learning Plan
              </Button>
            </div>
          </div>
        </Card>
      )}

      {hasLearningPlan ? (
        // show current learning plan
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{currentPlan?.title}</h3>
              <p className="text-sm text-blue-600 font-medium">{currentPlan?.category}</p>
              <p className="text-gray-600 mt-2">{currentPlan?.description}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDeleteCourse(currentPlan?.id || '')}
              className="text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>{currentPlan?.totalModules} modules</span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {currentPlan?.estimatedHours}h total
            </span>
          </div>
          
          <Button variant="outline" className="w-full">
            Start Learning
          </Button>
        </Card>
      ) : (
        // show creation interface when no plan exists
        !showForm ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Learning Plan Created</h4>
            <p className="text-gray-600">Use the button above to design your personalized learning plan</p>
          </Card>
        ) : null
      )}
      </div>

      {(safetyCheckLoading || courseGenerating) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {safetyCheckLoading ? 'Safety Check in Progress' : 'Generating Your Course'}
            </h3>
            <p className="text-gray-600">
              {safetyCheckLoading 
                ? 'Checking your learning plan inputs for safety...' 
                : 'Creating your personalized learning modules...'
              }
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {safetyCheckLoading ? 'This may take a few moments' : 'Please wait up to 2 minutes'}
            </p>
            <p className="text-sm text-red-600 mt-3 font-medium">
              ⚠️ Please do not close your browser during this process
            </p>
          </div>
        </div>
      )}
    </>
  )
}