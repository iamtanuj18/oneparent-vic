'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { TimeLearnSidebar } from './sidebar'
import { TimeLearnOverview } from './overview'
import { ScheduleInput } from './schedule-input'
import { ScheduleVisualization } from './schedule-visualization'
import { FreeTimePockets } from './free-time-pockets'
import { CourseCreation } from './course-creation'
import { CourseProgress } from './course-progress'
import { ScheduleItem, Course, ViewType, DaySchedule } from '@/types/time-learn-hub'
import { storage } from '@/lib/utils/time-learn-hub'

export function TimeLearnHub() {
  const [activeView, setActiveView] = useState('overview')
  const [courses, setCourses] = useState<Course[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)

  const handleViewChange = (view: string) => {
    if (isAnalyzing || isGenerating) return
    
    setActiveView(view)
    
    // clear active module when switching to any main view
    if (activeModule) {
      setActiveModule(null)
    }
    
    setTimeout(() => {
      window.scrollTo({ top: 230, behavior: 'smooth' })
    }, 100)
  }

  const handleAnalysisStateChange = (analyzing: boolean) => {
    setIsAnalyzing(analyzing)
  }

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId)
    setActiveView('progress')
  }

  // auto select course when courses are available
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[courses.length - 1])
    }
  }, [courses, selectedCourse])



  useEffect(() => {
    // clean up old personalization data
    storage.remove('timeLearnHub-profile')
    
    // clean up any old image data
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('image_course_') || key.startsWith('image_module_')) {
          storage.remove(key)
        }
      })
    }
    
    // use consistent localstorage keys with timelearn prefix
    const savedSchedule = storage.get<DaySchedule[] | null>('timeLearnHub-approvedSchedule', null)
    const savedCourses = storage.get<Course[]>('timeLearnHub-courses', [])
    
    // convert old schedule format if it exists
    const oldSchedule = storage.get<ScheduleItem[] | null>('timeLearnSchedule', null)
    if (oldSchedule && !savedSchedule) {
      const convertedSchedule = oldSchedule.map((item: ScheduleItem) => ({
        day: item.day,
        schedule: `${item.title} (${item.startTime} - ${item.endTime})`
      }))
      storage.set('timeLearnHub-approvedSchedule', convertedSchedule)
      storage.remove('timeLearnSchedule')
    }
    
    // convert old courses format if it exists
    const oldCourses = storage.get<Course[] | null>('timeLearnCourses', null)
    if (oldCourses && savedCourses.length === 0) {
      storage.set('timeLearnHub-courses', oldCourses)
      storage.remove('timeLearnCourses')
      setCourses(oldCourses)
    } else {
      // ensure completedquizzes is properly initialized for backward compatibility
      const coursesWithQuizData = savedCourses.map(course => ({
        ...course,
        completedQuizzes: (course.completedQuizzes && typeof course.completedQuizzes === 'object' && !Array.isArray(course.completedQuizzes)) 
          ? course.completedQuizzes 
          : {}
      }))
      
      setCourses(coursesWithQuizData)
    }

  }, [])

  const handleCourseUpdate = (newCourses: Course[]) => {
    setCourses(newCourses)
    storage.set('timeLearnHub-courses', newCourses)
  }

  const handleDeleteCourse = () => {
    setCourses([])
    storage.remove('timeLearnHub-courses')
    setSelectedCourse(null)
    setActiveModule(null)
    setActiveView('courses')
  }

  const hasAnyData = () => {
    // Check if there are courses or any localStorage data
    if (courses.length > 0) return true
    
    if (typeof window === 'undefined') return false
    return Object.keys(localStorage).some(key => 
      key.startsWith('timeLearnHub-') || key.startsWith('timeLearn')
    )
  }

  const handleDeleteAllData = () => {
    if (typeof window === 'undefined') return
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('timeLearnHub-') || key.startsWith('timeLearn')) {
        localStorage.removeItem(key)
      }
    })
    setCourses([])
    setSelectedCourse(null)
    setActiveModule(null)
    setActiveView('overview')
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <TimeLearnOverview scheduleData={[]} courses={courses} onViewChange={handleViewChange} />
      case 'schedule-input':
        return <ScheduleInput onViewChange={handleViewChange} />
      case 'visualization':
        return <ScheduleVisualization scheduleData={[]} onViewChange={handleViewChange} onAnalysisStateChange={handleAnalysisStateChange} />
      case 'free-time':
        return <FreeTimePockets onViewChange={handleViewChange} />
      case 'courses':
        return <CourseCreation courses={courses} onCourseUpdate={handleCourseUpdate} onViewChange={handleViewChange} onGeneratingChange={setIsGenerating} />
      case 'progress':
        return <CourseProgress courses={courses} onCourseUpdate={handleCourseUpdate} activeModule={activeModule} selectedCourse={selectedCourse} onModuleSelect={handleModuleSelect} />
      default:
        return <TimeLearnOverview scheduleData={[]} courses={courses} onViewChange={handleViewChange} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Time & Learn"
        titleGradientText="Hub"
        subtitle="Map your schedule, discover free pockets, and turn quiet moments into personal growth"
      />

      <div className="relative flex min-h-screen">
        <TimeLearnSidebar 
          activeView={activeView} 
          onViewChange={handleViewChange} 
          isAnalyzing={isAnalyzing} 
          isGenerating={isGenerating} 
          courses={courses}
          selectedCourse={selectedCourse}
          onModuleSelect={handleModuleSelect}
          activeModule={activeModule || undefined}
          onDeleteCourse={handleDeleteCourse}
          onDeleteAllData={handleDeleteAllData}
          hasData={hasAnyData()}
        />
        <div className="flex-1">
          <section className="py-12 lg:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-6">
                {renderView()}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}