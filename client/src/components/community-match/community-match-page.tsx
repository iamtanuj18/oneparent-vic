// community match page component
'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Loader2, Users, ChevronDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/ui/page-header'
import { useLanguages, useTop3, type Top3Item } from '@/lib/api/community-match'

// dynamic import map component to avoid ssr issues
const CommunityMapView = dynamic(
  () => import('./community-match-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Interactive Map</h3>
          <p className="text-gray-500 text-sm">Preparing your community exploration tool...</p>
        </div>
      </div>
    )
  }
)

export function CommunityMatchPage() {
  // language selection state
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  
  // selected council for highlighting
  const [activeCouncil, setActiveCouncil] = useState<string | null>(null)
  
  // ref for auto-scroll to map
  const mapSectionRef = useRef<HTMLElement>(null)
  
  // api data fetching
  const { data: languages, error: languagesError } = useLanguages()
  const { data: top3Communities, isLoading: top3Loading, error: top3Error } = useTop3(selectedLanguage || undefined)

  // debug logging for language changes
  useEffect(() => {
    // Debug logging removed for production
  }, [selectedLanguage, top3Communities, top3Loading])

  // set default language when data loads
  useEffect(() => {
    if (!selectedLanguage && languages && languages.length > 0) {
      setSelectedLanguage(languages[0])
    }
  }, [languages, selectedLanguage])

  // memoized council options
  const councilOptions = useMemo<Top3Item[]>(
    () => top3Communities || [],
    [top3Communities]
  )

  // handle language selection change
  const handleLanguageChange = useCallback((newLanguage: string) => {
    setSelectedLanguage(newLanguage)
    setActiveCouncil(null) // reset council selection when language changes
  }, [])

  // handle council selection from map (no scrolling needed)
  const handleMapCouncilSelection = useCallback((councilName: string) => {
    setActiveCouncil(councilName)
    // No scrolling since user is already on the map
  }, [])

  // handle council selection (used by both cards and map)
  const handleCouncilSelection = useCallback((councilName: string, scrollToMap: boolean = true) => {
    setActiveCouncil(councilName)
    
    // auto-scroll to map section with smooth animation only if requested (e.g., from card click)
    if (scrollToMap) {
      setTimeout(() => {
        mapSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 300) // small delay to allow card animation to complete
    }
  }, [])

  // handle suburb selection from map
  const handleSuburbSelection = useCallback((suburbName: string) => {
    // suburb selection logic can be added here
  }, [])

  // check if we have valid data
  const hasValidData = languages && languages.length > 0
  const hasTop3Data = councilOptions.length > 0
  const hasErrors = languagesError || top3Error
  const isInitialLoading = !languages && !languagesError

  return (
    <div className="min-h-screen bg-gray-50">
      {/* page header */}
      <PageHeader
        title="Community"
        titleGradientText="Match"
        subtitle="Find your perfect neighborhood. Compare housing, schools, and connect with communities that speak your language - helping you make confident decisions for your family's future."
      />

      {/* main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* initial loading state */}
        {isInitialLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* loading header */}
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Please wait, loading Community Match map
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                This could take a few moments, thanks for your patience...
              </p>
            </div>

            {/* skeleton cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>

            {/* skeleton map */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>
              <div className="h-[600px] bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* error state */}
        {!isInitialLoading && hasErrors && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-red-800">Unable to Load Community Data</h3>
              </div>
              <p className="text-red-600 mb-4">
                We're having trouble connecting to our community database. Please try again in a moment.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* language selection */}
        {!isInitialLoading && hasValidData && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Choose Your Language
                </h2>
                <p className="text-gray-600">
                  Select your language to see areas where speakers are most present, then explore suburb-specific housing costs and school details.
                </p>
              </div>
              
              <div className="md:w-80">
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full bg-white border-2 border-gray-300 rounded-xl px-4 py-4 text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                  >
                    <option value="" disabled>Choose your language...</option>
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                
                {selectedLanguage && (
                  <motion.div
                    key={`${selectedLanguage}-${top3Loading}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2"
                  >
                    {top3Loading ? (
                      <>
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-600 font-medium">
                          Finding top areas with {selectedLanguage} speakers...
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-green-600 font-medium">
                          ✓ Showing top {councilOptions.length} areas with most {selectedLanguage} speakers
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* feature benefits for single parents */}
        {!isInitialLoading && hasValidData && selectedLanguage && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                  What You'll Discover for Each Area
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🏘️</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Housing & Costs</h4>
                    <p className="text-sm text-gray-600">
                      Compare suburb-specific median house prices, weekly rent, and flat prices to find what fits your budget
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🏫</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Schools & Education</h4>
                    <p className="text-sm text-gray-600">
                      See suburb-specific school counts: primary, secondary, government, and private schools available in each area
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">👥</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Language Community</h4>
                    <p className="text-sm text-gray-600">
                      Discover the top 3 council areas where your language speakers are most present based on community data
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* communities ranking */}
        {!isInitialLoading && hasValidData && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Top 3 Areas for {selectedLanguage || 'Your Language'} Speakers</h2>
              <p className="text-gray-600">
                These council areas have strong {selectedLanguage || 'your language'} communities. Click on suburbs to see housing costs, rent, and schools.
              </p>
            </div>

            {/* loading state */}
            {top3Loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Finding top areas for {selectedLanguage}...</p>
                </div>
              </div>
            )}

            {/* no results state */}
            {!top3Loading && !hasTop3Data && selectedLanguage && (
              <div className="text-center py-12">
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 max-w-md mx-auto">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No top areas found</h3>
                  <p className="text-gray-600">
                    We couldn't find enough {selectedLanguage} speaker data in Greater Melbourne council areas. 
                    Try selecting a different language.
                  </p>
                </div>
              </div>
            )}

            {/* community cards */}
            {!top3Loading && hasTop3Data && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {councilOptions.map((community, index) => {
                  const isActive = activeCouncil?.toLowerCase() === community.council.toLowerCase()
                  
                  return (
                    <motion.div
                      key={community.council}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * (index + 1) }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      onClick={() => handleCouncilSelection(community.council, true)} // true = scroll to map
                      className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all duration-300 hover:shadow-md ${
                        isActive 
                          ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="p-6">
                        {/* rank badge and icon */}
                        <div className="flex items-center justify-between mb-4">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                            community.rank === 1 ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200' :
                            community.rank === 2 ? 'bg-gray-100 text-gray-800 ring-2 ring-gray-200' :
                            'bg-orange-100 text-orange-800 ring-2 ring-orange-200'
                          }`}>
                            #{community.rank}
                          </div>
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        
                        {/* council name */}
                        <h4 className="font-bold text-lg text-gray-900 mb-3 leading-tight">
                          {community.council}
                        </h4>
                        
                        {/* population stats */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">{selectedLanguage} Speakers</span>
                            <span className="font-bold text-lg text-gray-900">
                              {community.population.toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500 text-center py-1">
                            People who speak {selectedLanguage} in this area
                          </div>
                        </div>
                        
                        {/* primary action button */}
                        <div className="mt-6">
                          {isActive ? (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-center"
                            >
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <div className="text-sm font-medium text-blue-700">
                                  ✓ Now exploring this area
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  View suburbs and details on the map below
                                </div>
                              </div>
                              <button
                                onClick={() => setActiveCouncil(null)}
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                              >
                                ← Choose different area
                              </button>
                            </motion.div>
                          ) : (
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                              <span>Explore this Council</span>
                              <motion.div
                                whileHover={{ x: 2 }}
                                transition={{ duration: 0.2 }}
                              >
                                →
                              </motion.div>
                            </button>
                          )}
                         </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.section>
        )}

        {/* interactive map */}
        {!isInitialLoading && hasValidData && (
          <motion.section
            ref={mapSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {activeCouncil ? `Exploring ${activeCouncil}` : 'Suburb Explorer Map'}
                  </h2>
                  <p className="text-gray-600">
                    {activeCouncil 
                      ? 'Click on suburbs to see housing prices, schools, and local details'
                      : 'Select an area above to explore individual suburbs with detailed housing costs, school options, and community information'
                    }
                  </p>
                </div>
                
                {activeCouncil && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => {
                      setActiveCouncil(null);
                    }}
                    className="px-6 py-3 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 flex items-center gap-2"
                  >
                    ← Reset View
                  </motion.button>
                )}
              </div>
              
              {!selectedLanguage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <p className="text-blue-700 text-sm font-medium">
                    💡 Choose a language above to see which areas have the most speakers
                  </p>
                </motion.div>
              )}
            </div>

            {/* map component */}
            <div className="relative">
              <CommunityMapView
                key={`map-${selectedLanguage}-${councilOptions.length}`}
                top3={councilOptions}
                activeCouncil={activeCouncil}
                onPickCouncil={handleMapCouncilSelection}
                onPickSuburb={handleSuburbSelection}
                height={600}
              />
              
              {/* loading overlay for data fetching */}
              {top3Loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-white/90 flex items-center justify-center"
                >
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Loading Top Areas...
                    </h3>
                    <p className="text-gray-600 max-w-sm">
                      Finding top 3 areas with {selectedLanguage} speakers and updating the map...
                    </p>
                  </div>
                </motion.div>
              )}
              
              {/* map overlay for guidance */}
              {!selectedLanguage && !top3Loading && (
                <div className="absolute inset-0 bg-gray-50/80 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to Find Your Perfect Area?
                    </h3>
                    <p className="text-gray-600 max-w-sm">
                      Choose your language above to discover family-friendly areas with housing options, schools, and strong communities for single parents.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}