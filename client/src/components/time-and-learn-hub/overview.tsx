'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Clock, Calendar, Target, BookOpen, BarChart3, Lightbulb } from 'lucide-react'

interface OverviewProps {
  scheduleData: any[]
  courses: any[]
  onViewChange?: (view: string) => void
}

export function TimeLearnOverview({ scheduleData, courses, onViewChange }: OverviewProps) {
  const hasAnalysis = localStorage.getItem('timeLearnHub-analysis')
  const isFirstTime = scheduleData.length === 0 && !hasAnalysis

  if (isFirstTime) {
    return (
      <div className="space-y-12">
        {/* hero section */}
        <div className="text-center space-y-8 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">
              See Your Week Clearly, Make Time for Yourself
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Input your weekly schedule, visualize where your time goes, and discover opportunities for personal growth that actually fit your busy life.
            </p>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => onViewChange?.('schedule-input')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold rounded-xl shadow-lg"
              >
                Add My Schedule
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
          
          {/* feature preview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Schedule Visualization</h3>
              <p className="text-sm text-gray-600">See your entire week at a glance with colorful charts and patterns</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Time Analysis</h3>
              <p className="text-sm text-gray-600">Discover patterns and find those precious moments for yourself</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Personal Growth</h3>
              <p className="text-sm text-gray-600">Create activities and habits that actually fit your lifestyle</p>
            </div>
          </div>
        </div>

        {/* how it works section */}
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">See It in Action</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From messy schedules to meaningful moments - here's how it all comes together.
            </p>
          </div>
          
          {/* feature showcase */}
          <div className="space-y-8">
            {/* schedule management section */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Schedule Management</h3>
                  <p className="text-lg text-gray-700">
                    Input your weekly routine and see it transformed into clear, colorful visualizations. 
                    Understand exactly where your time goes and spot patterns you never noticed.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-blue-600" /> Easy schedule input</li>
                    <li className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-blue-600" /> Visual time breakdown</li>
                    <li className="flex items-center"><Lightbulb className="w-4 h-4 mr-2 text-blue-600" /> Pattern recognition</li>
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="text-sm font-medium text-gray-900 mb-4">Weekly Overview</div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Work & Commute</span>
                        <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full w-3/5"></div>
                        </div>
                        <span className="text-sm font-medium">45h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Family Time</span>
                        <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full w-2/5"></div>
                        </div>
                        <span className="text-sm font-medium">30h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Personal Time</span>
                        <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full w-1/5"></div>
                        </div>
                        <span className="text-sm font-medium">12h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* course creation section */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Build Skills in Your Free Time</h3>
                  <p className="text-lg text-gray-700">
                    Choose something you're interested in - photography, cooking, fitness, or any hobby. We'll create a simple plan 
                    with short sessions that fit into your available time windows. Learn at your own pace, no deadlines or pressure.
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center"><Lightbulb className="w-4 h-4 mr-2 text-blue-600" /> Personalized learning plans</li>
                    <li className="flex items-center"><Clock className="w-4 h-4 mr-2 text-blue-600" /> Matches your available time slots</li>
                    <li className="flex items-center"><BookOpen className="w-4 h-4 mr-2 text-blue-600" /> Track progress over time</li>
                  </ul>
                </div>
                <div className="flex-1">
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="text-sm font-medium text-gray-900 mb-4">Photography Essentials</div>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-blue-900">Phone Camera Basics</span>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">15 min</span>
                        </div>
                        <div className="text-xs text-blue-700">Settings and composition • Better family photos</div>
                        <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                          <div className="bg-blue-500 h-1 rounded-full w-4/5"></div>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border-l-4 border-blue-300">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-blue-800">Lighting Techniques</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">20 min</span>
                        </div>
                        <div className="text-xs text-blue-600">Natural light tips • Morning and evening shots</div>
                        <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                          <div className="bg-blue-400 h-1 rounded-full w-1/3"></div>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border-l-4 border-gray-300">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-700">Basic Editing</span>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">10 min</span>
                        </div>
                        <div className="text-xs text-gray-600">Simple adjustments • Enhance your photos</div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div className="bg-gray-400 h-1 rounded-full w-0"></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      Use your existing phone • Fits into your free time slots • Build skills gradually
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // get analysis data for better overview
  const analysisData = hasAnalysis ? JSON.parse(localStorage.getItem('timeLearnHub-analysis') || '{}') : null
  const freeTimeSlots = analysisData?.freeTimePockets?.length || 0
  const parseDurationToHours = (durationStr: string): number => {
    if (!durationStr) return 0
    
    const str = durationStr.toLowerCase().trim()
    
    // Handle "X hour" or "X hours" format
    const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/)
    if (hourMatch) {
      return parseFloat(hourMatch[1])
    }
    
    // Handle "X min" or "X minutes" format - convert to hours
    const minMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:min|minute)s?/)
    if (minMatch) {
      return parseFloat(minMatch[1]) / 60
    }
    
    // Handle "X.X h" format
    const shortHourMatch = str.match(/(\d+(?:\.\d+)?)\s*h$/)
    if (shortHourMatch) {
      return parseFloat(shortHourMatch[1])
    }
    
    // Fallback - try to extract just the number (assume hours)
    const numMatch = str.match(/(\d+(?:\.\d+)?)/)
    if (numMatch) {
      return parseFloat(numMatch[1])
    }
    
    return 0
  }

  const totalFreeTime = analysisData?.freeTimePockets?.reduce((acc: number, slot: any) => {
    const hours = parseDurationToHours(slot.duration)
    return acc + hours
  }, 0) || 0

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Your Schedule Insights</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Here's what we discovered about your weekly routine and time opportunities.
            </p>
          </div>
          
          {/* key metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">{freeTimeSlots}</p>
              <p className="text-sm text-gray-600">Free Time Pockets</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">{totalFreeTime.toFixed(0)}h</p>
              <p className="text-sm text-gray-600">Weekly Free Time</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600 mb-1">{analysisData?.categoryBreakdown ? Object.keys(analysisData.categoryBreakdown).length : 0}</p>
              <p className="text-sm text-gray-600">Different Life Areas</p>
              <p className="text-xs text-gray-500 mt-1">You spend time across {analysisData?.categoryBreakdown ? Object.keys(analysisData.categoryBreakdown).length : 0} major categories</p>
            </div>
          </div>

          {/* top categories */}
          {analysisData?.categoryBreakdown && Object.keys(analysisData.categoryBreakdown).length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Where Your Time Goes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {Object.entries(analysisData.categoryBreakdown)
                  .sort(([,a], [,b]) => (b as any).hours - (a as any).hours)
                  .slice(0, 3)
                  .map(([category, data], index) => {
                    const colors = [
                      'border-blue-100 bg-blue-50', 
                      'border-green-100 bg-green-50', 
                      'border-purple-100 bg-purple-50'
                    ];
                    const textColors = [
                      'text-blue-600', 
                      'text-green-600', 
                      'text-purple-600'
                    ];
                    return (
                      <div key={category} className={`text-center p-6 ${colors[index]} rounded-xl shadow-sm`}>
                        <p className={`text-2xl font-bold ${textColors[index]} mb-1`}>{(data as any).hours}h</p>
                        <p className="text-sm text-gray-700 capitalize font-medium mb-1">{category}</p>
                        <p className="text-xs text-gray-600">{(data as any).percentage.toFixed(1)}% of week</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* peak activity insight */}
          {analysisData?.insights && (
            <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 text-center">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Peak Activity Period</h4>
              <p className="text-gray-700">
                {analysisData.insights.peakActivity || 'Busiest during 8AM-5PM weekdays (Work)'}
              </p>
            </div>
          )}

          {/* navigation hint */}
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-600">
              Explore the other tabs for detailed analysis, visualizations, and free time opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* course section */}
      {hasAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            
            {courses.length === 0 ? (
              <>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Make Time for Yourself?</h3>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    You've discovered your free time pockets! Now create a personal learning plan that fits perfectly into your schedule.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <Lightbulb className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Choose Your Interest</p>
                    <p className="text-xs text-gray-600 mt-1">Photography, cooking, fitness, or any hobby you love</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Perfect Timing</p>
                    <p className="text-xs text-gray-600 mt-1">Activities designed to fit your available time slots</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">Your Pace</p>
                    <p className="text-xs text-gray-600 mt-1">Learn gradually with no pressure or deadlines</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => onViewChange?.('courses')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
                >
                  Create Your First Learning Plan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Continue Your Learning Journey</h3>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    You have {courses.length} learning plan{courses.length > 1 ? 's' : ''} ready to go! Continue building skills in your free time.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-white p-6 rounded-xl shadow-sm max-w-md">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600 mb-2">{courses.length}</p>
                      <p className="text-sm font-medium text-gray-900 mb-1">Active Learning Plan{courses.length > 1 ? 's' : ''}</p>
                      <p className="text-xs text-gray-600">Ready for your next session</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => onViewChange?.('progress')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
                >
                  Go to Learning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}