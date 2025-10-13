'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Play, CheckCircle, Circle, BarChart3, Award, Target, Trophy, Lightbulb, FileText, ExternalLink, AlertTriangle } from 'lucide-react'

interface CourseModule {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  resources?: string[]
  learningObjectives?: string[]
  content?: {
    introduction?: string
    coreContent?: string
    keyTakeaways?: string[]
    troubleshooting?: string
  } | string
  example?: {
    title: string
    description: string
    steps: string[]
    materials: string[]
  }
  examples?: Array<{
    title: string
    level: 'beginner' | 'intermediate' | 'advanced'
    description: string
    steps: string[]
    tips: string[]
    timeRequired: string
    materials: string[]
  }> | string[]
  quiz?: {
    question: string
    options: string[]
    correctAnswer: number
    explanation?: string
    type?: 'knowledge' | 'application' | 'safety'
  }[]
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  totalModules: number
  estimatedHours: number
  modules: CourseModule[]
  createdAt: string
  progress?: number
  completedModules?: string[]
  completedQuizzes?: {[moduleId: string]: {score: number, answers: number[], timestamp: string}}
  totalTimeSpent?: number
  lastAccessed?: string
}

interface CourseProgressProps {
  courses: Course[]
  onCourseUpdate: (courses: Course[]) => void
  activeModule?: string | null
  selectedCourse?: Course | null
  onModuleSelect?: (moduleId: string) => void
}

export function CourseProgress({ courses, onCourseUpdate, activeModule: externalActiveModule, selectedCourse: externalSelectedCourse, onModuleSelect }: CourseProgressProps) {
  const [internalSelectedCourse, setInternalSelectedCourse] = useState<Course | null>(null)
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'moduleList' | 'moduleDetail'>('overview')
  const [currentQuiz, setCurrentQuiz] = useState<any>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]) // for all-at-once quiz
  const [quizError, setQuizError] = useState<string>('') // for validation errors

  // use external course if provided, otherwise use internal state
  const selectedCourse = externalSelectedCourse || internalSelectedCourse

  // format time helper
  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0 && minutes > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  }

  const formatEstimatedTime = (decimalHours: number) => {
    const totalMinutes = Math.round(decimalHours * 60)
    return formatTime(totalMinutes)
  }

  // auto-select the latest course if no external course is provided
  useEffect(() => {
    if (!externalSelectedCourse && courses.length > 0) {
      const latestCourse = courses[courses.length - 1]
      setInternalSelectedCourse(latestCourse)
    }
  }, [courses, externalSelectedCourse])

  // handle external active module
  useEffect(() => {
    if (externalActiveModule && selectedCourse) {
      const module = selectedCourse.modules?.find(m => m.id === externalActiveModule)
      if (module) {
        setSelectedModule(module)
        setViewMode('moduleDetail')
        // scroll to top when module is selected
        setTimeout(() => {
          window.scrollTo({ top: 230, behavior: 'smooth' })
        }, 100)
      }
    } else {
      setSelectedModule(null)
      setViewMode('overview')
    }
  }, [externalActiveModule, selectedCourse])

  const handleViewModuleDetails = () => {
    setViewMode('moduleList')
    setTimeout(() => {
      window.scrollTo({ top: 230, behavior: 'smooth' })
    }, 100)
  }

  const handleModuleStart = (module: CourseModule) => {
    setSelectedModule(module)
    if (onModuleSelect) {
      onModuleSelect(module.id)
    }
    setTimeout(() => {
      window.scrollTo({ top: 230, behavior: 'smooth' })
    }, 100)
  }

  const handleBackToOverview = () => {
    setSelectedModule(null)
    setViewMode('overview')
    setTimeout(() => {
      window.scrollTo({ top: 230, behavior: 'smooth' })
    }, 100)
  }

  const handleQuizFinish = () => {
    if (!currentQuiz || !selectedCourse || !selectedModule) return

    const finalScore = quizScore + (selectedAnswer === currentQuiz.questions[currentQuestionIndex].correctAnswer ? 1 : 0)
    const total = currentQuiz.questions.length
    const percentage = Math.round((finalScore / total) * 100)

    // collect user answers
    const userAnswers: number[] = []
    for (let i = 0; i <= currentQuestionIndex; i++) {
      if (i === currentQuestionIndex) {
        userAnswers.push(selectedAnswer || 0)
      } else {
        // this is simplified - in a real app you'd track all answers
        userAnswers.push(0)
      }
    }

    const results = {
      score: finalScore,
      total,
      percentage,
      userAnswers,
      timestamp: new Date().toISOString()
    }

    setQuizResults(results)
    setShowQuizResults(true)
    setCurrentQuiz(null)

    // update course data
    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        const completedModules = course.completedModules || []
        const completedQuizzes = (course.completedQuizzes && typeof course.completedQuizzes === 'object' && !Array.isArray(course.completedQuizzes)) 
          ? course.completedQuizzes 
          : {}

        // check if this is the first time completing this module
        const isFirstCompletion = !completedModules.includes(selectedModule.id) && !completedQuizzes[selectedModule.id]

        // mark module as completed
        if (!completedModules.includes(selectedModule.id)) {
          completedModules.push(selectedModule.id)
        }

        // save quiz results
        completedQuizzes[selectedModule.id] = {
          score: percentage,
          answers: userAnswers,
          timestamp: results.timestamp
        }

        // only add time if this is the first completion - don't double count retakes
        const newTimeSpent = isFirstCompletion 
          ? (course.totalTimeSpent || 0) + (selectedModule.estimatedMinutes || 0)
          : (course.totalTimeSpent || 0)

        // ensure we don't exceed the total course duration
        const maxCourseTime = course.estimatedHours * 60 // convert hours to minutes
        const finalTimeSpent = Math.min(newTimeSpent, maxCourseTime)

        return {
          ...course,
          completedModules,
          completedQuizzes,
          progress: Math.round((completedModules.length / course.totalModules) * 100),
          totalTimeSpent: finalTimeSpent,
          lastAccessed: new Date().toISOString()
        }
      }
      return course
    })

    onCourseUpdate(updatedCourses)
  }

  const handleSubmitAllQuiz = () => {
    if (!selectedModule?.quiz || !selectedCourse) return

    // validation: check if all questions are answered
    const unansweredQuestions = []
    for (let i = 0; i < selectedModule.quiz.length; i++) {
      if (!quizAnswers || quizAnswers[i] === undefined) {
        unansweredQuestions.push(i + 1)
      }
    }

    if (unansweredQuestions.length > 0) {
      setQuizError(`Please answer all questions. Missing: Q${unansweredQuestions.join(', Q')}`)
      return
    }

    // Clear any previous errors
    setQuizError('')

    const quiz = selectedModule.quiz
    let score = 0

    // Calculate score
    quizAnswers.forEach((answer, index) => {
      if (answer === quiz[index].correctAnswer) {
        score++
      }
    })

    const total = quiz.length
    const percentage = Math.round((score / total) * 100)

    // update course data with quiz completion
    const updatedCourses = courses.map(course => {
      if (course.id === selectedCourse.id) {
        const completedModules = course.completedModules || []
        const completedQuizzes = (course.completedQuizzes && typeof course.completedQuizzes === 'object' && !Array.isArray(course.completedQuizzes)) 
          ? course.completedQuizzes 
          : {}

        // check if this is the first time completing this module
        const isFirstCompletion = !completedModules.includes(selectedModule.id) && !completedQuizzes[selectedModule.id]

        // mark module as completed
        if (!completedModules.includes(selectedModule.id)) {
          completedModules.push(selectedModule.id)
        }

        // save quiz results
        completedQuizzes[selectedModule.id] = {
          score,
          answers: quizAnswers,
          timestamp: new Date().toISOString()
        }

        // only add time if this is the first completion
        const newTimeSpent = isFirstCompletion 
          ? (course.totalTimeSpent || 0) + (selectedModule.estimatedMinutes || 0)
          : (course.totalTimeSpent || 0)

        // Ensure we don't exceed the total course duration
        const maxCourseTime = course.estimatedHours * 60
        const finalTimeSpent = Math.min(newTimeSpent, maxCourseTime)

        return {
          ...course,
          completedModules,
          completedQuizzes,
          progress: Math.round((completedModules.length / course.totalModules) * 100),
          totalTimeSpent: finalTimeSpent,
          lastAccessed: new Date().toISOString()
        }
      }
      return course
    })

    onCourseUpdate(updatedCourses)
    
    // Reset quiz state
    setQuizAnswers([])

    // Auto-scroll to start of quiz section after submission (with offset)
    setTimeout(() => {
      const quizElement = document.querySelector('[data-quiz-start]')
      if (quizElement) {
        const elementPosition = quizElement.getBoundingClientRect().top + window.pageYOffset
        const offsetPosition = elementPosition - 30 // 30px offset from top
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  const handleModuleComplete = (courseId: string, moduleId: string) => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        const completedModules = course.completedModules || []
        const isCompleted = completedModules.includes(moduleId)
        
        const newCompletedModules = isCompleted 
          ? completedModules.filter(id => id !== moduleId)
          : [...completedModules, moduleId]

        // Find the module to get its estimated time
        const module = course.modules?.find(m => m.id === moduleId)
        const moduleTime = module?.estimatedMinutes || 0

        // Calculate time spent: add time when completing, subtract when uncompleting
        let newTimeSpent = course.totalTimeSpent || 0
        if (!isCompleted && module) {
          // Adding completion - add time only if not already counted
          const hasQuizRecord = course.completedQuizzes?.[moduleId]
          if (!hasQuizRecord) {
            newTimeSpent += moduleTime
          }
        } else if (isCompleted && module) {
          // Removing completion - subtract time only if no quiz record exists
          const hasQuizRecord = course.completedQuizzes?.[moduleId]
          if (!hasQuizRecord) {
            newTimeSpent = Math.max(0, newTimeSpent - moduleTime)
          }
        }

        // Ensure we don't exceed the total course duration
        const maxCourseTime = course.estimatedHours * 60
        const finalTimeSpent = Math.min(newTimeSpent, maxCourseTime)

        return {
          ...course,
          completedModules: newCompletedModules,
          progress: Math.round((newCompletedModules.length / course.totalModules) * 100),
          totalTimeSpent: finalTimeSpent,
          lastAccessed: new Date().toISOString()
        }
      }
      return course
    })
    onCourseUpdate(updatedCourses)
  }

  // Calculate stats
  const coursesWithProgress = courses // Show all courses, not just ones with progress
  const totalTimeSpent = courses.reduce((acc, course) => acc + (course.totalTimeSpent || 0), 0)

  return (
    <div className="space-y-6">
      {selectedModule ? (
        /* individual module view - educational content */
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Module Header */}
              {/* Module Header */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-4">
                      Module {(selectedCourse?.modules?.findIndex(m => m.id === selectedModule.id) || 0) + 1}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedModule.estimatedMinutes || 0} minutes
                    </div>
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedModule.title}
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">{selectedModule.description}</p>

              </div>

              {/* Learning Objectives */}
              {selectedModule.learningObjectives && selectedModule.learningObjectives.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Objectives</h2>
                  <ul className="space-y-2">
                    {selectedModule.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <Target className="w-4 h-4 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Content */}
              {selectedModule.content && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">What You'll Learn</h2>
                  {typeof selectedModule.content === 'string' ? (
                    <div className="text-gray-800 leading-relaxed whitespace-pre-line text-base">
                      {selectedModule.content}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {selectedModule.content.introduction && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Introduction</h3>
                          <p className="text-gray-700 leading-relaxed">{selectedModule.content.introduction}</p>
                        </div>
                      )}
                      
                      {selectedModule.content.coreContent && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Core Learning</h3>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {selectedModule.content.coreContent}
                          </div>
                        </div>
                      )}
                      
                      {selectedModule.content.keyTakeaways && selectedModule.content.keyTakeaways.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Key Takeaways</h3>
                          <ul className="space-y-2">
                            {selectedModule.content.keyTakeaways.map((takeaway, index) => (
                              <li key={index} className="flex items-start">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span className="text-gray-700">{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedModule.content.troubleshooting && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <h3 className="text-lg font-medium text-amber-900 mb-2 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Troubleshooting Tips
                          </h3>
                          <p className="text-amber-800">{selectedModule.content.troubleshooting}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Examples Section */}
              {(selectedModule.example || (selectedModule.examples && selectedModule.examples.length > 0)) && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-amber-600" />
                    Examples & Practice
                  </h2>
                  <div className="space-y-8">
                    {selectedModule.example ? (
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedModule.example.title}</h3>
                        <p className="text-gray-700 mb-4">{selectedModule.example.description}</p>
                        
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Materials Needed:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {selectedModule.example.materials.map((material, i) => (
                              <li key={i} className="flex items-start">
                                <span className="text-gray-400 mr-2">•</span>
                                {material}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Steps:</h4>
                          <ol className="text-sm text-gray-700 space-y-2">
                            {selectedModule.example.steps.map((step, i) => (
                              <li key={i} className="flex items-start">
                                <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                                  {i + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ) : selectedModule.examples ? (
                      selectedModule.examples.map((example, index) => {
                        if (typeof example === 'string') {
                          return (
                            <div key={index} className="border-l-4 border-amber-400 pl-6 py-2">
                              <h3 className="text-base font-medium text-gray-900 mb-3">
                                Example {index + 1}
                              </h3>
                              <p className="text-gray-700 leading-relaxed">{example}</p>
                            </div>
                          );
                        } else {
                          const levelColors = {
                            beginner: 'text-green-700 bg-green-100 border-green-200',
                            intermediate: 'text-blue-700 bg-blue-100 border-blue-200', 
                            advanced: 'text-purple-700 bg-purple-100 border-purple-200'
                          };
                          
                          return (
                            <div key={index} className="border border-gray-200 rounded-lg p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">{example.title}</h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${levelColors[example.level]}`}>
                                  {example.level.charAt(0).toUpperCase() + example.level.slice(1)}
                                </span>
                              </div>
                              
                              <p className="text-gray-700 mb-4">{example.description}</p>
                              
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Materials Needed:</h4>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {example.materials.map((material, i) => (
                                      <li key={i} className="flex items-start">
                                        <span className="text-gray-400 mr-2">•</span>
                                        {material}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Time Required:</h4>
                                  <p className="text-sm text-gray-600">{example.timeRequired}</p>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Steps:</h4>
                                <ol className="text-sm text-gray-700 space-y-2">
                                  {example.steps.map((step, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                                        {i + 1}
                                      </span>
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                              
                              {example.tips && example.tips.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <h4 className="text-sm font-medium text-blue-900 mb-2">Pro Tips:</h4>
                                  <ul className="text-sm text-blue-800 space-y-1">
                                    {example.tips.map((tip, i) => (
                                      <li key={i} className="flex items-start">
                                        <Trophy className="w-3 h-3 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                                        {tip}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        }
                      })
                    ) : null}
                  </div>
                </div>
              )}

              {/* Additional Resources */}
              {(selectedModule.resources || []).length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-purple-600" />
                    Additional Resources
                  </h2>
                  <div className="space-y-3">
                    {(selectedModule.resources || []).map((resource, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-center">
                          <ExternalLink className="w-4 h-4 text-purple-600 mr-3" />
                          <span className="text-gray-700 text-sm">{resource}</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs">
                          View Resource
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge Check Quiz */}
              {selectedModule.quiz && selectedModule.quiz.length > 0 && (
                <div className="mb-10">
                  <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-8 border border-indigo-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center" data-quiz-start>
                      <Target className="w-5 h-5 mr-2 text-indigo-600" />
                      Knowledge Check
                    </h2>
                    
                    {(() => {
                      const moduleQuizResult = (selectedCourse?.completedQuizzes || {})[selectedModule.id];
                      if (moduleQuizResult) {
                        // Show completed quiz with persistent results
                        return (
                          <div className="space-y-6">
                            {selectedModule.quiz.map((question, qIndex) => {
                              const userAnswer = moduleQuizResult.answers[qIndex];
                              const isCorrect = userAnswer === question.correctAnswer;
                              
                              return (
                                <div key={qIndex} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                                  <h3 className="text-base font-medium text-gray-900 mb-4 text-left">
                                    Q{qIndex + 1}. {question.question}
                                  </h3>
                                  
                                  <div className="space-y-3 mb-4">
                                    {question.options.map((option, optIndex) => {
                                      let optionClass = "p-4 border rounded-lg text-left ";
                                      
                                      if (optIndex === question.correctAnswer) {
                                        optionClass += "border-green-400 bg-green-50 text-green-800";
                                      } else if (optIndex === userAnswer && !isCorrect) {
                                        optionClass += "border-red-400 bg-red-50 text-red-800";
                                      } else {
                                        optionClass += "border-gray-200 bg-gray-50 text-gray-700";
                                      }
                                      
                                      return (
                                        <div key={optIndex} className={optionClass}>
                                          <div className="flex items-center">
                                            <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3 text-xs font-medium flex-shrink-0">
                                              {String.fromCharCode(65 + optIndex)}
                                            </span>
                                            <span className="flex-1">{option}</span>
                                            {optIndex === question.correctAnswer && (
                                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            )}
                                            {optIndex === userAnswer && !isCorrect && (
                                              <Circle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                    <p className="text-sm font-medium text-indigo-900 mb-2 text-left">Explanation:</p>
                                    <p className="text-indigo-800 text-sm text-left">{question.explanation}</p>
                                  </div>
                                </div>
                              );
                            })}
                            
                            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100" data-quiz-results>
                              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
                                <Trophy className="w-6 h-6 text-indigo-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Quiz Completed!</h3>
                              <p className="text-indigo-700">
                                Final Score: {Math.round((moduleQuizResult.score / selectedModule.quiz.length) * 100)}%
                                ({moduleQuizResult.score} out of {selectedModule.quiz.length} correct)
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        // Show quiz to be taken
                        return (
                          <div className="space-y-6">
                            {selectedModule.quiz.map((question, qIndex) => {
                              const isUnanswered = !quizAnswers || quizAnswers[qIndex] === undefined;
                              const hasError = quizError && isUnanswered;
                              
                              return (
                                <div key={qIndex} className={`bg-white rounded-lg p-6 shadow-sm border transition-colors ${
                                  hasError ? 'border-red-300 bg-red-50' : 'border-gray-100'
                                }`}>
                                  <h3 className={`text-base font-medium mb-4 text-left ${
                                    hasError ? 'text-red-800' : 'text-gray-900'
                                  }`}>
                                    Q{qIndex + 1}. {question.question}
                                    {hasError && (
                                      <span className="ml-2 text-sm text-red-600 font-normal">
                                        (Please answer this question)
                                      </span>
                                    )}
                                  </h3>
                                  
                                  <div className="space-y-3">
                                    {question.options.map((option, optIndex) => (
                                      <button
                                        key={optIndex}
                                        className={`w-full text-left p-4 border rounded-lg transition-colors ${
                                          (quizAnswers || [])[qIndex] === optIndex
                                            ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                                            : hasError
                                            ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300'
                                            : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                        onClick={() => {
                                          const newAnswers = [...(quizAnswers || [])];
                                          newAnswers[qIndex] = optIndex;
                                          setQuizAnswers(newAnswers);
                                          // Clear error when user answers
                                          if (quizError) {
                                            setQuizError('');
                                          }
                                        }}
                                      >
                                        <div className="flex items-center">
                                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 text-xs font-medium flex-shrink-0 ${
                                            (quizAnswers || [])[qIndex] === optIndex 
                                              ? 'border-indigo-500 bg-indigo-500 text-white' 
                                              : hasError
                                              ? 'border-red-400 text-red-400'
                                              : 'border-gray-400 text-gray-400'
                                          }`}>
                                            {String.fromCharCode(65 + optIndex)}
                                          </span>
                                          <span className="flex-1">{option}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Error Message */}
                            {quizError && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center">
                                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                                  <span className="text-red-800 font-medium">{quizError}</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="text-center pt-4">
                              <Button
                                onClick={handleSubmitAllQuiz}
                                className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3"
                                size="lg"
                              >
                                Submit Quiz
                              </Button>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* learning progress overview */
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Progress</h2>
            <p className="text-gray-600">Track your course completion and learning achievements</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Time you have spent in learning</p>
                  <p className="text-2xl font-bold text-blue-600">{formatTime(totalTimeSpent)}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Modules Completed</p>
                  <p className="text-2xl font-bold text-green-600">{selectedCourse ? `${selectedCourse.completedModules?.length || 0}/${selectedCourse.totalModules}` : `${coursesWithProgress.reduce((acc, course) => acc + (course.completedModules?.length || 0), 0)}`}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Quizzes Taken</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedCourse ? Object.keys(selectedCourse.completedQuizzes || {}).length : coursesWithProgress.reduce((acc, course) => acc + Object.keys(course.completedQuizzes || {}).length, 0)}/{selectedCourse ? selectedCourse.totalModules : coursesWithProgress.reduce((acc, course) => acc + course.totalModules, 0)}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Your Learning Course Section - Changes based on viewMode */}
          {coursesWithProgress.length > 0 && (
            <div>
              {viewMode === 'overview' ? (
                /* course overview card */
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Your Learning Course
                  </h3>
                  
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    {(() => {
                      const latestCourse = coursesWithProgress[coursesWithProgress.length - 1];
                      return (
                        <div className="p-6">

                          
                          {/* Header Section */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-2xl font-bold text-gray-900 mb-2">{latestCourse.title}</h4>
                              <p className="text-blue-700 font-medium mb-3">{latestCourse.category}</p>
                              <p className="text-gray-600 text-sm leading-relaxed">{latestCourse.description}</p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm text-gray-500 mb-1">Progress</div>
                              <div className="text-3xl font-bold text-blue-600">{Math.round(latestCourse.progress || 0)}%</div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${latestCourse.progress || 0}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{latestCourse.completedModules?.length || 0} of {latestCourse.totalModules} modules completed</span>
                              <span>{formatTime(latestCourse.totalTimeSpent || 0)} spent learning</span>
                            </div>
                          </div>
                          
                          {/* Action Button */}
                          <div className="mb-6">
                            <Button 
                              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-lg font-medium transition-all duration-200"
                              onClick={handleViewModuleDetails}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              View Module Details
                            </Button>
                          </div>
                          
                          {/* Bottom Stats */}
                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-200">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{latestCourse.totalModules}</div>
                              <div className="text-sm text-gray-600">Total Modules</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-indigo-600">{formatEstimatedTime(latestCourse.estimatedHours)}</div>
                              <div className="text-sm text-gray-600">Estimated Time</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{latestCourse.totalModules}</div>
                              <div className="text-sm text-gray-600">Total Quizzes</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </Card>
                </div>
              ) : (
                /* module list view */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedCourse?.title}</h3>
                      <p className="text-blue-700 font-medium">{selectedCourse?.category}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleBackToOverview}
                    >
                      Back to Overview
                    </Button>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${selectedCourse?.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Progress</span>
                      <span>{selectedCourse?.completedModules?.length || 0} of {selectedCourse?.totalModules} modules</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4">Course Modules</h4>
                    <div className="space-y-4">
                      {(selectedCourse?.modules || []).map((module, index) => {
                        const isCompleted = selectedCourse?.completedModules?.includes(module.id) || false
                        
                        return (
                          <Card key={module.id} className="p-6 bg-white border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                                
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-gray-900">
                                      Module {index + 1}: {module.title}
                                    </h5>
                                    {isCompleted && (
                                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        Complete
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {module.estimatedMinutes} minutes
                                  </div>
                                </div>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleModuleStart(module)}
                                className={isCompleted ? "border-green-200 text-green-700 hover:bg-green-50" : ""}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                {isCompleted ? 'Review' : 'Start'}
                              </Button>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}



          {courses.length === 0 && (
            <Card className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Learning Progress Yet</h4>
              <p className="text-gray-600 mb-4">Create your first course to start tracking your learning journey</p>
              <Button variant="outline">
                Create Your First Course
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}