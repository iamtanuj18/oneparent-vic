'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import {
  fetchPpsLatest,
  fetchPpsTrend,
  fetchPpsHotspot, 
  fetchPpsHotspotDetail,
  fetchLabourLatest,
  fetchLabourBreakdown,
  type PpsLatest, 
  type PpsTrendData,
  type PpsHotspot, 
  type PpsHotspotDetail,
  type LabourLatest,
  type LabourBreakdown
} from '../../lib/api/insights'

// dynamic import for victoria map to handle client-side rendering of leaflet
const VictoriaMap = dynamic(() => import('./VictoriaMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
})

// date formatting helper function
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-AU', { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// number formatting helper function
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const formatChartDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-AU', { 
      year: 'numeric', 
      month: 'short'
    })
  } catch {
    return dateStr
  }
}

interface CommunityStory {
  id: string
  title: string
  description: string
  stat: string
  statDescription: string
  image: string
  bgColor: string
  buttonText: string
  alignment: 'left' | 'right'
}

export function CommunityStoriesZigZag() {
  // state for modal and data
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [ppsLatest, setPpsLatest] = useState<PpsLatest | null>(null)
  const [ppsHotspot, setPpsHotspot] = useState<PpsHotspot | null>(null)
  const [labourLatest, setLabourLatest] = useState<LabourLatest | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // community stories data with government support information
  const communityStories: CommunityStory[] = [
    {
      id: 'pps-trend',
      title: 'Government Support Statistics',
      description: 'Current data on single parent families receiving Parenting Payment Single across Victoria, showing participation trends over recent years.',
      stat: ppsLatest ? `${(ppsLatest.vic_recipients / 1000).toFixed(1)}k` : '68.8k',
      statDescription: `families received support from government in ${ppsLatest ? new Date(ppsLatest.date).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) : 'July 2025'}`,
      image: '/images/homeimg5.png',
      bgColor: 'bg-orange-100',
      buttonText: 'View support trends',
      alignment: 'left'
    },
    {
      id: 'pps-hotspot',
      title: 'Areas with Highest Recipients of Govt Support',
      description: 'Showing which Victorian areas had the highest number of single parent families receiving Parenting Payment Single (PPS).',
      stat: ppsHotspot ? ppsHotspot.recipients.toLocaleString() : '1,810',
      statDescription: `highest recipients recorded in ${ppsHotspot ? ppsHotspot.suburb : 'DONNYBROOK'} in June 2025`,
      image: '/images/homeimg6.png',
      bgColor: 'bg-white',
      buttonText: 'See recipients in each area across Victoria',
      alignment: 'right'
    },
    {
      id: 'labour-snapshot',
      title: 'Single Parents in the Workforce',
      description: 'Single parent families show strong workforce participation across Victoria, demonstrating resilience in balancing career and family responsibilities.',
      stat: labourLatest ? `${labourLatest.labour_pct.toFixed(1)}%` : '63.1%',
      statDescription: `of single parent families participate in the workforce in ${labourLatest ? labourLatest.year : '2023'}`,
      image: '/images/homeimg7.png',
      bgColor: 'bg-teal-50',
      buttonText: 'Compare employment across family types',
      alignment: 'left'
    }
  ]

  // load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ppsData, hotspotData, labourData] = await Promise.all([
          fetchPpsLatest(),
          fetchPpsHotspot(),
          fetchLabourLatest()
        ])
        
        setPpsLatest(ppsData)
        setPpsHotspot(hotspotData)
        setLabourLatest(labourData)
      } catch (error) {
        console.error('failed to load community data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const openModal = (modalId: string) => {
    setActiveModal(modalId)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  return (
    <>
      {/* Main zig-zag section */}
      <section className="py-0">
        {communityStories.map((story, index) => (
          <div key={story.id} className={`${story.bgColor} py-16 lg:py-24`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                  story.alignment === 'right' ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                {/* Image */}
                <div className={`${story.alignment === 'right' ? 'lg:col-start-2' : ''}`}>
                  <div className={`relative h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden p-4 ${story.bgColor}`}>
                    <Image
                      src={story.image}
                      alt={story.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
                      priority={index === 0}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className={`${story.alignment === 'right' ? 'lg:col-start-1' : ''}`}>
                  <div className="max-w-lg">
                    <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                      {story.title}
                    </h3>
                    
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                      {story.description}
                    </p>

                    {/* Statistics - enhanced for better visibility */}
                    <div className="mb-8">
                      <div className={`text-4xl lg:text-5xl font-bold mb-2 ${
                        story.bgColor === 'bg-white' ? 'text-teal-600' : 
                        story.bgColor === 'bg-orange-100' ? 'text-orange-700' : 
                        'text-teal-700'
                      }`}>
                        {isLoading ? (
                          <div className="h-12 bg-gray-200 rounded animate-pulse" />
                        ) : (
                          story.stat
                        )}
                      </div>
                      <div className="text-base text-gray-700 font-medium">
                        {story.statDescription}
                      </div>
                    </div>

                    {/* Call to action button - styled for each background */}
                    <button
                      onClick={() => openModal(story.id)}
                      className={`px-6 py-3 border-2 font-semibold rounded-lg transition-all duration-300 ${
                        story.bgColor === 'bg-white' 
                          ? 'border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white' 
                          : story.bgColor === 'bg-orange-100'
                          ? 'border-orange-700 text-orange-700 hover:bg-orange-700 hover:text-white'
                          : 'border-teal-700 text-teal-700 hover:bg-teal-700 hover:text-white'
                      }`}
                    >
                      {story.buttonText}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ))}
      </section>

      {/* Modals - reusing existing modal logic from CommunityInsights */}
      {activeModal && createPortal(
        <ModalContent modalId={activeModal} onClose={closeModal} />,
        document.body
      )}
    </>
  )
}

// modal content component
function ModalContent({ modalId, onClose }: { modalId: string; onClose: () => void }) {
  const [modalData, setModalData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // scroll lock effect - prevent background scrolling when modal is open
  useEffect(() => {
    // lock scroll when modal opens
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = '15px' // compensate for scrollbar width
    
    // cleanup on unmount - restore scroll when modal closes
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }
  }, [])

  // keyboard event handling - close modal with escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    const loadModalData = async () => {
      setIsLoading(true)
      try {
        let data
        switch (modalId) {
          case 'pps-trend':
            data = await fetchPpsTrend()
            break
          case 'pps-hotspot':
            data = await fetchPpsHotspotDetail()
            break
          case 'labour-snapshot':
            data = await fetchLabourBreakdown()
            break
          default:
            data = null
        }
        setModalData(data)
      } catch (error) {
        console.error(`failed to load ${modalId} modal data:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadModalData()
  }, [modalId])

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
      style={{ touchAction: 'none' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'auto' }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            {modalId === 'pps-trend' && 'Parenting Payment Single Recipients Trend in Victoria'}
            {modalId === 'pps-hotspot' && 'Victoria PPS Recipients by Location'}
            {modalId === 'labour-snapshot' && 'Employment Comparison: Single Parents vs. Couple Families'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading detailed data...</span>
            </div>
          ) : modalData?.error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">⚠️ Error Loading Data</div>
              <div className="text-gray-600">{modalData.error}</div>
            </div>
          ) : (
            <div>
              {modalId === 'pps-trend' && modalData && (
                <div>
                  {modalData.length > 0 ? (
                    <div className="space-y-6">
                      {/* summary stats - vic only */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-blue-600">
                            {modalData[modalData.length - 1]?.vic_total?.toLocaleString() || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600">VIC Recipients</div>
                          <div className="text-xs text-gray-500 mt-1">
                            As of {formatDate(modalData[modalData.length - 1]?.date)}
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {(() => {
                              const firstValue = modalData[0]?.vic_total || 0
                              const lastValue = modalData[modalData.length - 1]?.vic_total || 0
                              const change = lastValue - firstValue
                              const changePercent = firstValue > 0 ? ((change / firstValue) * 100) : 0
                              return changePercent > 0 ? `+${changePercent.toFixed(1)}%` : `${changePercent.toFixed(1)}%`
                            })()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {(() => {
                              const firstDate = new Date(modalData[0]?.date || '')
                              const lastDate = new Date(modalData[modalData.length - 1]?.date || '')
                              const yearsDiff = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                              return `${yearsDiff}-Year Change`
                            })()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Since {formatDate(modalData[0]?.date)}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Chart with Peak/Lowest indicators */}
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-6">
                          Recipients Over Time ({(() => {
                            const firstDate = new Date(modalData[0]?.date || '')
                            const lastDate = new Date(modalData[modalData.length - 1]?.date || '')
                            return `${firstDate.getFullYear()} - ${lastDate.getFullYear()}`
                          })()})
                        </h4>
                        
                        <div className="space-y-4">
                          {(() => {
                            // get the actual latest data point (most recent date)
                            const sortedByDate = [...modalData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            const actualLatest = sortedByDate[0]
                            
                            // sample data intelligently but always include the latest data point
                            let sampledData = modalData.filter((_: any, idx: number) => 
                              idx % Math.max(1, Math.floor(modalData.length / 7)) === 0
                            ).slice(-7) // show max 7 points to leave room for latest
                            
                            // ensure the latest data point is included if not already sampled
                            const latestIncluded = sampledData.some((item: any) => item.date === actualLatest.date)
                            if (!latestIncluded) {
                              sampledData = [...sampledData, actualLatest].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            }
                            
                            const values = sampledData.map((d: any) => d.vic_total)
                            const maxValue = Math.max(...values)
                            const minValue = Math.min(...values)
                            
                            // get the actual peak and lowest values across all data
                            const actualPeak = Math.max(...modalData.map((d: any) => d.vic_total))
                            const actualLowest = Math.min(...modalData.map((d: any) => d.vic_total))
                            
                            return sampledData.map((item: any, idx: number) => {
                              const percentage = ((item.vic_total - minValue) / (maxValue - minValue)) * 100
                              const isActualLatest = item.date === actualLatest.date
                              const isActualPeak = item.vic_total === actualPeak
                              const isActualLowest = item.vic_total === actualLowest
                              
                              return (
                                <div key={idx} className="group hover:bg-gray-50 p-4 rounded-lg transition-colors border border-gray-100">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-800">
                                      {formatChartDate(item.date)}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg font-bold text-gray-900">
                                        {item.vic_total.toLocaleString()}
                                      </span>
                                      <span className="text-sm text-gray-500">recipients</span>
                                      {isActualLatest && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Latest</span>}
                                      {isActualPeak && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Peak</span>}
                                      {isActualLowest && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">Lowest</span>}
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div 
                                      className="h-full rounded-full transition-all duration-1000 ease-out"
                                      style={{ 
                                        width: `${Math.max(10, percentage)}%`,
                                        background: isActualPeak ? 'linear-gradient(90deg, #10B981, #059669)' :
                                                   isActualLatest ? 'linear-gradient(90deg, #3B82F6, #1E40AF)' :
                                                   isActualLowest ? 'linear-gradient(90deg, #EF4444, #DC2626)' :
                                                   'linear-gradient(90deg, #60A5FA, #3B82F6)',
                                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">No trend data available</div>
                  )}
                </div>
              )}

              {modalId === 'pps-hotspot' && modalData && (
                <div>
                  {modalData.length > 0 ? (
                    <div className="space-y-6">
                      {/* enhanced summary stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-6 rounded-lg text-center">
                          <div className="text-3xl font-bold text-purple-600">
                            {modalData.reduce((sum: number, item: any) => sum + item.recipients, 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Total Recipients</div>
                          <div className="text-xs text-gray-500 mt-1">As of June 2025</div>
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-lg text-center">
                          <div className="text-3xl font-bold text-indigo-600">
                            {Math.max(...modalData.map((item: any) => item.recipients)).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Highest recipients recorded in {modalData.find((item: any) => item.recipients === Math.max(...modalData.map((i: any) => i.recipients)))?.suburb || 'N/A'}</div>
                        </div>
                      </div>

                      {/* Full Width Interactive Map */}
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-4">See recipients in each area across Victoria</h4>
                        <div className="relative">
                          <VictoriaMap data={modalData} />
                        </div>
                      </div>

                      {/* Top Locations List */}
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold mb-4">Top 10 Locations</h4>
                        <div className="space-y-3">
                          {modalData
                            .sort((a: any, b: any) => b.recipients - a.recipients)
                            .slice(0, 10)
                            .map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm font-bold text-gray-900 w-6">#{idx + 1}</span>
                                  <span className="font-medium text-gray-800">{item.suburb}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-purple-600">
                                    {item.recipients.toLocaleString()}
                                  </span>
                                  <div className="text-xs text-gray-500">recipients</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">No geographic data available</div>
                  )}
                </div>
              )}

              {modalId === 'labour-snapshot' && modalData && (
                <div>
                  <h3 className="text-xl font-bold mb-6 text-gray-800">Workforce Participation by Family Type</h3>
                  {modalData.length > 0 ? (
                    <div className="space-y-8">
                      {/* Quick Comparison Overview */}
                      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-6 rounded-xl border border-gray-200">
                        <h4 className="text-lg font-semibold mb-4 text-gray-800">Key Insights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(() => {
                            const latestYear = Math.max(...modalData.map((i: any) => i.year))
                            const latestData = modalData.filter((item: any) => item.year === latestYear)
                            
                            const singleParents = latestData.filter((item: any) => item.family_type === 'One parent families')
                            const coupleFamilies = latestData.filter((item: any) => item.family_type === 'Couple families')
                            
                            // calculate single parent employment rate
                            const singleParentTotal = singleParents.reduce((sum: number, item: any) => sum + item.families_k, 0)
                            const singleParentEmployed = singleParents.find((item: any) => item.status === 'Employed parent')?.families_k || 0
                            const singleParentRate = singleParentTotal > 0 ? (singleParentEmployed / singleParentTotal * 100) : 0
                            
                            // calculate couple families employment rate
                            const coupleFamilyTotal = coupleFamilies.reduce((sum: number, item: any) => sum + item.families_k, 0)
                            const atLeastOne = coupleFamilies.find((item: any) => item.status === 'At least one partner employed')?.families_k || 0
                            const bothEmployed = coupleFamilies.find((item: any) => item.status === 'Both partners employed')?.families_k || 0
                            const coupleFamilyRate = coupleFamilyTotal > 0 ? ((atLeastOne + bothEmployed) / coupleFamilyTotal * 100) : 0
                            
                            return (
                              <>
                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-emerald-600 mb-2">
                                      {singleParentRate.toFixed(1)}%
                                    </div>
                                    <div className="text-lg font-semibold text-gray-800 mb-2">
                                      Single Parent Families
                                    </div>
                                    <div className="text-sm text-gray-600 mb-4">
                                      Employment Rate ({latestYear})
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatNumber(singleParentTotal)} families
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-lg border border-gray-200">
                                  <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600 mb-2">
                                      {coupleFamilyRate.toFixed(1)}%
                                    </div>
                                    <div className="text-lg font-semibold text-gray-800 mb-2">
                                      Couple Families
                                    </div>
                                    <div className="text-sm text-gray-600 mb-4">
                                      At Least One Employed ({latestYear})
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatNumber(coupleFamilyTotal)} families
                                    </div>
                                  </div>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                        
                        {(() => {
                          const latestYear = Math.max(...modalData.map((i: any) => i.year))
                          const latestData = modalData.filter((item: any) => item.year === latestYear)
                          
                          const singleParents = latestData.filter((item: any) => item.family_type === 'One parent families')
                          const coupleFamilies = latestData.filter((item: any) => item.family_type === 'Couple families')
                          
                          const singleParentTotal = singleParents.reduce((sum: number, item: any) => sum + item.families_k, 0)
                          const singleParentEmployed = singleParents.find((item: any) => item.status === 'Employed parent')?.families_k || 0
                          const singleParentRate = singleParentTotal > 0 ? (singleParentEmployed / singleParentTotal * 100) : 0
                          
                          const coupleFamilyTotal = coupleFamilies.reduce((sum: number, item: any) => sum + item.families_k, 0)
                          const atLeastOne = coupleFamilies.find((item: any) => item.status === 'At least one partner employed')?.families_k || 0
                          const bothEmployed = coupleFamilies.find((item: any) => item.status === 'Both partners employed')?.families_k || 0
                          const coupleFamilyRate = coupleFamilyTotal > 0 ? ((atLeastOne + bothEmployed) / coupleFamilyTotal * 100) : 0
                          
                          if (singleParentRate > 0 && coupleFamilyRate > 0) {
                            const difference = Math.abs(singleParentRate - coupleFamilyRate)
                            const higherGroup = singleParentRate > coupleFamilyRate ? 'single parent' : 'couple'
                            
                            return (
                              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="text-center text-sm text-gray-700">
                                  <span className="font-semibold">{difference.toFixed(1)} percentage point difference</span>
                                  <br />
                                  {higherGroup} families show higher workforce participation
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>

                      {/* Year-by-Year Comparison */}
                      {(() => {
                        const yearGroups = modalData.reduce((acc: any, item: any) => {
                          if (!acc[item.year]) acc[item.year] = {}
                          if (!acc[item.year][item.family_type]) acc[item.year][item.family_type] = []
                          acc[item.year][item.family_type].push(item)
                          return acc
                        }, {})

                        return Object.entries(yearGroups).sort(([a], [b]) => Number(b) - Number(a)).map(([year, familyTypes]: [string, any]) => (
                          <div key={year} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                            <h4 className="text-lg font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-2">
                              Workforce Participation Comparison - {year}
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              {/* single parent families */}
                              {familyTypes['One parent families'] && (
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-4 h-4 bg-emerald-600 rounded-full"></div>
                                    <h5 className="text-lg font-bold text-emerald-900">Single Parent Families</h5>
                                  </div>
                                  
                                  <div className="space-y-5">
                                    {familyTypes['One parent families'].map((item: any, idx: number) => {
                                      const maxValue = Math.max(...familyTypes['One parent families'].map((i: any) => i.families_k))
                                      const percentage = (item.families_k / maxValue) * 100
                                      
                                      return (
                                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                                          <div className="flex justify-between items-center mb-3">
                                            <span className="font-semibold text-gray-800">{item.status}</span>
                                            <span className="text-xl font-bold text-emerald-700">{formatNumber(item.families_k)}</span>
                                          </div>
                                          <div className="w-full bg-emerald-200 rounded-full h-4 mb-2">
                                            <div
                                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4 rounded-full transition-all duration-700 ease-out"
                                              style={{ width: `${Math.max(15, percentage)}%` }}
                                            ></div>
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {formatNumber(item.with_children_k)} with children (0-14 years)
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  
                                  {/* single parent summary */}
                                  <div className="mt-6 p-4 bg-emerald-900 rounded-lg text-white">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <div className="text-2xl font-bold">
                                          {formatNumber(familyTypes['One parent families'].reduce((sum: number, item: any) => sum + item.families_k, 0))}
                                        </div>
                                        <div className="text-xs text-emerald-200">Total Single Parents</div>
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold">
                                          {((familyTypes['One parent families'].find((i: any) => i.status === 'Employed parent')?.families_k || 0) / 
                                          familyTypes['One parent families'].reduce((sum: number, item: any) => sum + item.families_k, 0) * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-emerald-200">Employment Rate</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Couple Families */}
                              {familyTypes['Couple families'] && (
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                  <div className="flex items-center gap-3 mb-6">
                                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                                    <h5 className="text-lg font-bold text-blue-900">Couple Families</h5>
                                  </div>
                                  
                                  <div className="space-y-5">
                                    {familyTypes['Couple families'].map((item: any, idx: number) => {
                                      const maxValue = Math.max(...familyTypes['Couple families'].map((i: any) => i.families_k))
                                      const percentage = (item.families_k / maxValue) * 100
                                      
                                      return (
                                        <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                                          <div className="flex justify-between items-center mb-3">
                                            <span className="font-semibold text-gray-800">{item.status}</span>
                                            <span className="text-xl font-bold text-blue-700">{formatNumber(item.families_k)}</span>
                                          </div>
                                          <div className="w-full bg-blue-200 rounded-full h-4 mb-2">
                                            <div
                                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-700 ease-out"
                                              style={{ width: `${Math.max(15, percentage)}%` }}
                                            ></div>
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {formatNumber(item.with_children_k)} with children (0-14 years)
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                  
                                  {/* couple family summary */}
                                  <div className="mt-6 p-4 bg-blue-900 rounded-lg text-white">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <div className="text-2xl font-bold">
                                          {formatNumber(familyTypes['Couple families'].reduce((sum: number, item: any) => sum + item.families_k, 0))}
                                        </div>
                                        <div className="text-xs text-blue-200">Total Couple Families</div>
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold">
                                          {(() => {
                                            const total = familyTypes['Couple families'].reduce((sum: number, item: any) => sum + item.families_k, 0)
                                            const atLeastOne = (familyTypes['Couple families'].find((i: any) => i.status === 'At least one partner employed')?.families_k || 0)
                                            const bothEmployed = (familyTypes['Couple families'].find((i: any) => i.status === 'Both partners employed')?.families_k || 0)
                                            return ((atLeastOne + bothEmployed) / total * 100).toFixed(1)
                                          })()}%
                                        </div>
                                        <div className="text-xs text-blue-200">At Least One Employed Rate</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  ) : (
                    <div className="text-gray-600">No employment data available</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}