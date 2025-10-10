'use client'

import { Card } from '@/components/ui/card'
import { BarChart3, Clock, BookOpen, TrendingUp, Calendar, Target } from 'lucide-react'

interface OverviewProps {
  scheduleData: any[]
  courses: any[]
}

export function TimeLearnOverview({ scheduleData, courses }: OverviewProps) {
  const totalScheduledHours = scheduleData.reduce((acc, item) => {
    if (item.endTime && item.startTime) {
      const start = new Date(`2024-01-01 ${item.startTime}`)
      const end = new Date(`2024-01-01 ${item.endTime}`)
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }
    return acc
  }, 0)

  const completedCourses = courses.filter(course => course.progress === 100).length
  const activeCourses = courses.filter(course => course.progress > 0 && course.progress < 100).length

  const statsCards = [
    {
      title: 'Weekly Scheduled Hours',
      value: `${totalScheduledHours.toFixed(1)}h`,
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Active Courses',
      value: activeCourses.toString(),
      icon: BookOpen,
      color: 'green'
    },
    {
      title: 'Completed Courses',
      value: completedCourses.toString(),
      icon: Target,
      color: 'purple'
    },
    {
      title: 'Schedule Items',
      value: scheduleData.length.toString(),
      icon: Calendar,
      color: 'orange'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Overview</h2>
        <p className="text-gray-600">Your personal time management and learning dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600', 
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600'
          }

          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <h4 className="font-medium text-blue-900">Add Schedule Item</h4>
              <p className="text-sm text-blue-700">Plan your day with time blocks</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
              <h4 className="font-medium text-green-900">Create Learning Course</h4>
              <p className="text-sm text-green-700">Design personalized micro-learning</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
              <h4 className="font-medium text-purple-900">Analyze Time Usage</h4>
              <p className="text-sm text-purple-700">Visualize your schedule patterns</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {scheduleData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.title || 'Schedule Item'}</p>
                  <p className="text-sm text-gray-600">
                    {item.startTime} - {item.endTime}
                  </p>
                </div>
                <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {item.day || 'Today'}
                </div>
              </div>
            ))}
            {scheduleData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No schedule items yet</p>
                <p className="text-sm">Start by adding your first schedule item</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}