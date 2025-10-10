'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { EmotionLogForm } from '@/components/emotion-tracker/emotion-log-form'
import { WeeklyViewSection } from '@/components/emotion-tracker/weekly-view-section'
import { AIAnalysis } from '@/components/emotion-tracker/ai-analysis'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ANIMATION_CONFIG } from '@/lib/animation'
import { PenTool, BarChart3, Brain } from 'lucide-react'

export default function EmotionTrackerPage() {
  const [activeTab, setActiveTab] = useState('today')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [hasLogs, setHasLogs] = useState(false)

  // Check if user has any logs on component mount and tab changes
  useEffect(() => {
    checkForLogs()
  }, [activeTab])

  // Listen for localStorage changes to update hasLogs state
  useEffect(() => {
    const handleStorageChange = () => {
      checkForLogs()
    }

    const handleSwitchToToday = () => {
      setActiveTab('today')
    }
    
    window.addEventListener('storage', handleStorageChange)
    // listen to custom events for same-window changes
    window.addEventListener('emotion-data-changed', handleStorageChange)
    window.addEventListener('switch-to-today-tab', handleSwitchToToday)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('emotion-data-changed', handleStorageChange)
      window.removeEventListener('switch-to-today-tab', handleSwitchToToday)
    }
  }, [])

  const checkForLogs = () => {
    const storedLogs = localStorage.getItem('emotion-logs')
    const logs = storedLogs ? JSON.parse(storedLogs) : []
    setHasLogs(logs.length > 0)
  }

  const handleDeleteData = () => {
    // Clear all emotion tracker localStorage data
    localStorage.removeItem('emotion-logs')
    localStorage.removeItem('user-emotion-start-date')
    localStorage.removeItem('emotion-insights-generated')
    
    const generated = localStorage.getItem('emotion-insights-generated')
    if (generated) {
      try {
        const weekNumbers = JSON.parse(generated)
        weekNumbers.forEach((weekNum: number) => {
          localStorage.removeItem(`emotion-insights-week-${weekNum}`)
        })
      } catch (error) {
        console.error('Error parsing generated weeks:', error)
      }
    }
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('emotion-insights-week-')) {
        localStorage.removeItem(key)
      }
    })
    
    setShowDeleteConfirm(false)
    setHasLogs(false)
    
    // Trigger events to update other components
    window.dispatchEvent(new Event('storage'))
    window.dispatchEvent(new Event('emotion-data-changed'))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* page header with gradient and description */}
      <PageHeader
        title="Emotion"
        titleGradientText="Tracker"
        subtitle="Track your daily emotions and discover patterns in your mental wellbeing journey as a single parent"
      />

      {/* main content section - following figma layout */}
      <section className="relative py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* main content wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
            className="space-y-6"
          >
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                {[
                  { id: 'today', label: "Today's Log", icon: PenTool },
                  { id: 'weekly', label: 'Weekly Summary', icon: BarChart3 },
                  { id: 'ai-analysis', label: 'AI Analysis', icon: Brain }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-md transition-all text-center whitespace-nowrap ${
                      activeTab === id 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content Areas */}
            <div className="space-y-6">
              {/* Today's emotion logging form */}
              {activeTab === 'today' && (
                <div className="space-y-6">
                  <EmotionLogForm onDataChange={checkForLogs} />
                </div>
              )}

              {/* Weekly view with summaries and insights */}
              {activeTab === 'weekly' && (
                <div>
                  <WeeklyViewSection />
                </div>
              )}

              {/* AI Analysis tab */}
              {activeTab === 'ai-analysis' && (
                <AIAnalysis isActive={activeTab === 'ai-analysis'} />
              )}
            </div>

            {/* Delete Data Section */}
            {hasLogs && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete All Emotion Data</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Permanently remove all your emotion logs, AI analyses, and data from this device.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 font-semibold"
                    >
                      Delete My Data
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Delete All Emotion Data?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    This will permanently delete all your emotion logs, weekly summaries, AI analyses, and all stored data. This action cannot be undone.
                  </p>
                  <div className="flex gap-4 justify-end">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} size="lg" className="px-8 py-4 text-lg font-semibold">
                      Cancel
                    </Button>
                    <Button 
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-semibold" 
                      onClick={handleDeleteData}
                      size="lg"
                    >
                      Delete Data
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </section>
    </div>
  )
}