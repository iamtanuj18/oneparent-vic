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

interface ScheduleItem {
  id: string
  title: string
  day: string
  startTime: string
  endTime: string
  category: string
  description?: string
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  totalModules: number
  estimatedHours: number
  modules: any[]
  createdAt: string
  progress?: number
  completedModules?: string[]
}

export function TimeLearnHub() {
  const [activeView, setActiveView] = useState('overview')
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  const handleViewChange = (view: string) => {
    console.log('TimeLearnHub: View change requested from', activeView, 'to', view)
    setActiveView(view)
  }

  useEffect(() => {
    const savedSchedule = localStorage.getItem('timeLearnSchedule')
    const savedCourses = localStorage.getItem('timeLearnCourses')
    
    if (savedSchedule) {
      setScheduleData(JSON.parse(savedSchedule))
    }
    
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses))
    }
  }, [])

  const handleScheduleUpdate = (newScheduleData: ScheduleItem[]) => {
    setScheduleData(newScheduleData)
    localStorage.setItem('timeLearnSchedule', JSON.stringify(newScheduleData))
  }

  const handleCourseUpdate = (newCourses: Course[]) => {
    setCourses(newCourses)
    localStorage.setItem('timeLearnCourses', JSON.stringify(newCourses))
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <TimeLearnOverview scheduleData={scheduleData} courses={courses} />
      case 'schedule':
        return <ScheduleInput scheduleData={scheduleData} onScheduleUpdate={handleScheduleUpdate} onViewChange={handleViewChange} />
      case 'visualization':
        return <ScheduleVisualization scheduleData={scheduleData} />
      case 'free-time':
        return <FreeTimePockets scheduleData={scheduleData} />
      case 'courses':
        return <CourseCreation courses={courses} onCourseUpdate={handleCourseUpdate} />
      case 'progress':
        return <CourseProgress courses={courses} onCourseUpdate={handleCourseUpdate} />
      default:
        return <TimeLearnOverview scheduleData={scheduleData} courses={courses} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Time & Learn"
        titleGradientText="Hub"
        subtitle="Your personal time management and micro-learning companion"
      />

      <div className="relative flex min-h-screen">
        <TimeLearnSidebar activeView={activeView} onViewChange={handleViewChange} />
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