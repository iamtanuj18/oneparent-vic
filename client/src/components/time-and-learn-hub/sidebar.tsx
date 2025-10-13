'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Home, Calendar, BarChart3, Clock, BookOpen, TrendingUp, Menu } from 'lucide-react'
import { ViewType } from '@/types/time-learn-hub'

interface TimeLearnSidebarProps {
  activeView: string
  onViewChange: (view: ViewType) => void
  isAnalyzing?: boolean
  isGenerating?: boolean
  courses?: any[]
  selectedCourse?: any
  onModuleSelect?: (moduleId: string) => void
  activeModule?: string
  onDeleteCourse?: () => void
  onDeleteAllData?: () => void
  hasData?: boolean
}

const getMenuItems = (courses: any[] = []) => {
  const baseItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'schedule-input', label: 'Schedule Input', icon: Calendar },
    { id: 'visualization', label: 'Schedule Analysis', icon: BarChart3 },
    { id: 'free-time', label: 'Free Time Pockets', icon: Clock },
  ]
  
  const learningItems = []
  
  // show learning progress if courses exist
  if (courses.length > 0) {
    learningItems.push({ id: 'progress', label: 'Learning Progress', icon: TrendingUp })
  }
  
  // only show create learning modules if no courses exist
  if (courses.length === 0) {
    learningItems.push({ id: 'courses', label: 'Create Learning Modules', icon: BookOpen })
  }
  
  return [...baseItems, ...learningItems]
}

export function TimeLearnSidebar({ activeView, onViewChange, isAnalyzing = false, isGenerating = false, courses = [], selectedCourse, onModuleSelect, activeModule, onDeleteCourse, onDeleteAllData, hasData = false }: TimeLearnSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDeleteCourseConfirm, setShowDeleteCourseConfirm] = useState(false)
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const menuItems = getMenuItems(courses)
  const isDisabled = isAnalyzing || isGenerating

  const SidebarContent = () => (
    <div className="sticky top-0 w-64 bg-white border-r border-gray-200 h-screen">
      <div className="p-6 h-full overflow-y-auto">
        <div className="pt-16 pb-4">
          <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={(activeView === item.id && !activeModule) ? "primary" : "outline"}
              disabled={isDisabled && activeView !== item.id}
              className={`w-full justify-start text-left pl-4 ${
                (activeView === item.id && !activeModule)
                  ? '' 
                  : 'text-gray-700 hover:bg-gray-100 border-0 shadow-none'
              } ${isDisabled && activeView !== item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!isDisabled || activeView === item.id) {
                  onViewChange(item.id as ViewType)
                  setMobileOpen(false)
                }
              }}
            >
              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
              <span className="text-left">{item.label}</span>
            </Button>
          )
        })}

        {/* module navigation */}
        {selectedCourse && selectedCourse.modules && selectedCourse.modules.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Course Modules
            </h3>
            <div className="space-y-1">
              {selectedCourse.modules.map((module: any, index: number) => {
                const isCompleted = selectedCourse.completedModules?.includes(module.id) || false
                const hasQuizScore = selectedCourse.completedQuizzes?.[module.id]
                const isModuleComplete = isCompleted || (hasQuizScore && hasQuizScore.score >= 70)
                
                return (
                  <Button
                    key={module.id}
                    variant={activeModule === module.id ? "primary" : "outline"}
                    size="sm"
                    className={`w-full justify-start text-left pl-6 text-sm ${
                      activeModule === module.id
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-50 border-0 shadow-none'
                    }`}
                    onClick={() => {
                      if (onModuleSelect) {
                        onModuleSelect(module.id)
                        setMobileOpen(false)
                        // scroll to top for module selection
                        setTimeout(() => {
                          window.scrollTo({ top: 230, behavior: 'smooth' })
                        }, 100)
                      }
                    }}
                  >
                    <div className="flex items-center w-full">
                      <span className="flex-1 truncate">
                        Module {index + 1}
                        {isModuleComplete && (
                          <span className={`ml-2 text-xs font-medium ${
                            activeModule === module.id 
                              ? 'text-white' 
                              : 'text-black'
                          }`}>
                            Completed
                          </span>
                        )}
                      </span>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {courses.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left pl-4 text-red-600 hover:bg-red-50 border-red-200"
                onClick={() => setShowDeleteCourseConfirm(true)}
              >
                Delete Course
              </Button>
            </div>
          </div>
        )}

        {hasData && !isAnalyzing && !isGenerating && (
          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full justify-start text-left pl-4 text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => setShowDeleteAllConfirm(true)}
            >
              Delete Entire Data
            </Button>
          </div>
        )}
          </nav>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* mobile sidebar */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mb-4">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {showDeleteCourseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Course?
            </h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete your current learning course. Your schedule data will remain intact. This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteCourseConfirm(false)} size="lg" className="px-8 py-4 text-lg font-semibold">
                Cancel
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-semibold" 
                onClick={() => {
                  setShowDeleteCourseConfirm(false)
                  onDeleteCourse?.()
                }}
                size="lg"
              >
                Delete Course
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete All Data?
            </h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete your schedule data, course progress, and all stored information in the Time & Learn Hub. This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteAllConfirm(false)} size="lg" className="px-8 py-4 text-lg font-semibold">
                Cancel
              </Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-semibold" 
                onClick={() => {
                  setShowDeleteAllConfirm(false)
                  onDeleteAllData?.()
                }}
                size="lg"
              >
                Delete Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}