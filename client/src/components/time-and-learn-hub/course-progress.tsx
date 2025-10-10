'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, BookOpen, Clock, Target, Play, CheckCircle, Circle, BarChart3, Award } from 'lucide-react'

interface CourseModule {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  resources: string[]
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
  totalTimeSpent?: number
  lastAccessed?: string
}

interface CourseProgressProps {
  courses: Course[]
  onCourseUpdate: (courses: Course[]) => void
}

export function CourseProgress({ courses, onCourseUpdate }: CourseProgressProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  
  const coursesWithProgress = courses.map(course => {
    const completedModules = course.completedModules || []
    const progress = completedModules.length > 0 ? (completedModules.length / course.totalModules) * 100 : 0
    
    return {
      ...course,
      progress,
      completedModules,
      totalTimeSpent: course.totalTimeSpent || 0,
      lastAccessed: course.lastAccessed || course.createdAt
    }
  })

  const handleModuleComplete = (courseId: string, moduleId: string) => {
    const updatedCourses = courses.map(course => {
      if (course.id === courseId) {
        const completedModules = course.completedModules || []
        const isAlreadyCompleted = completedModules.includes(moduleId)
        
        const newCompletedModules = isAlreadyCompleted 
          ? completedModules.filter(id => id !== moduleId)
          : [...completedModules, moduleId]
        
        const module = course.modules.find(m => m.id === moduleId)
        const timeToAdd = isAlreadyCompleted ? -(module?.estimatedMinutes || 0) : (module?.estimatedMinutes || 0)
        
        return {
          ...course,
          completedModules: newCompletedModules,
          totalTimeSpent: (course.totalTimeSpent || 0) + timeToAdd,
          lastAccessed: new Date().toISOString()
        }
      }
      return course
    })
    
    onCourseUpdate(updatedCourses)
  }

  const activeCourses = coursesWithProgress.filter(course => course.progress > 0 && course.progress < 100)
  const completedCourses = coursesWithProgress.filter(course => course.progress === 100)
  const notStartedCourses = coursesWithProgress.filter(course => course.progress === 0)

  const totalTimeSpent = coursesWithProgress.reduce((acc, course) => acc + (course.totalTimeSpent || 0), 0)
  const totalCoursesCompleted = completedCourses.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Progress</h2>
        <p className="text-gray-600">Track your course completion and learning achievements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Learning Time</p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(totalTimeSpent / 60 * 10) / 10}h</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Courses Completed</p>
              <p className="text-2xl font-bold text-green-600">{totalCoursesCompleted}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Courses</p>
              <p className="text-2xl font-bold text-purple-600">{activeCourses.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {selectedCourse ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{selectedCourse.title}</h3>
              <p className="text-blue-600 font-medium">{selectedCourse.category}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedCourse(null)}>
              Back to Overview
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedCourse.completedModules?.length || 0} of {selectedCourse.totalModules} modules
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${selectedCourse.progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Course Modules</h4>
            
            {selectedCourse.modules.map((module, index) => {
              const isCompleted = selectedCourse.completedModules?.includes(module.id) || false
              
              return (
                <div key={module.id} className={`p-4 rounded-lg border-2 transition-all ${
                  isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleModuleComplete(selectedCourse.id, module.id)}
                        className={isCompleted ? 'text-green-600 border-green-200' : 'text-gray-400'}
                      >
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </Button>
                      
                      <div className="flex-1">
                        <h5 className={`font-medium ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                          Module {index + 1}: {module.title}
                        </h5>
                        <p className={`text-sm mt-1 ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                          {module.description}
                        </p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {module.estimatedMinutes} minutes
                          {module.resources.length > 0 && (
                            <span className="ml-4">
                              • {module.resources.length} resource{module.resources.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {module.resources.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Resources:</p>
                            <div className="space-y-1">
                              {module.resources.map((resource, resourceIndex) => (
                                <div key={resourceIndex} className="text-xs text-blue-600 truncate">
                                  {resource.startsWith('http') ? (
                                    <a href={resource} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                      {resource}
                                    </a>
                                  ) : (
                                    <span>{resource}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4"
                      disabled={isCompleted}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {isCompleted ? 'Completed' : 'Start'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeCourses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                Continue Learning ({activeCourses.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCourses.map((course) => (
                  <Card key={course.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedCourse(course)}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{course.title}</h4>
                        <p className="text-sm text-blue-600 font-medium">{course.category}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {Math.round(course.progress)}% complete
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{course.completedModules?.length || 0} of {course.totalModules} modules</span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.round((course.totalTimeSpent || 0) / 60 * 10) / 10}h spent
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedCourses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-green-600" />
                Completed Courses ({completedCourses.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedCourses.map((course) => (
                  <Card key={course.id} className="p-6 bg-green-50 border-green-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-green-900">{course.title}</h4>
                        <p className="text-sm text-green-700 font-medium">{course.category}</p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-green-700">
                      <span>All {course.totalModules} modules completed</span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.round((course.totalTimeSpent || 0) / 60 * 10) / 10}h total
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {notStartedCourses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-gray-600" />
                Ready to Start ({notStartedCourses.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notStartedCourses.map((course) => (
                  <Card key={course.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedCourse(course)}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{course.title}</h4>
                        <p className="text-sm text-blue-600 font-medium">{course.category}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{course.totalModules} modules</span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.estimatedHours}h estimated
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
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