'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/ui'
import { ANIMATION_CONFIG } from '@/lib/animation'
import { ChevronDown, MapPin, Users, GraduationCap } from 'lucide-react'
import {
  fetchLanguages,
  fetchTopLgasByLanguage,
  fetchSuburbsByLga,
  fetchSchoolsNear,
  type LgaData,
  type SuburbData,
  type SchoolData
} from '@/lib/api/community-match'

export function CommunityMatchPage() {
  const [languages, setLanguages] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [topLgas, setTopLgas] = useState<LgaData[]>([])
  const [selectedLga, setSelectedLga] = useState<string>('')
  const [suburbs, setSuburbs] = useState<SuburbData[]>([])
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  // load available languages on component mount
  useEffect(() => {
    loadLanguages()
  }, [])

  // fetch top LGAs when language changes
  useEffect(() => {
    if (selectedLanguage) {
      loadTopLgas(selectedLanguage)
      setSelectedLga('')
      setSuburbs([])
      setSchools([])
    }
  }, [selectedLanguage])

  // fetch suburbs when LGA is selected
  useEffect(() => {
    if (selectedLga) {
      loadSuburbs(selectedLga)
      setSchools([])
    }
  }, [selectedLga])

  const loadLanguages = async () => {
    try {
      const data = await fetchLanguages()
      setLanguages(data.languages || [])
      if (data.languages?.length > 0) {
        setSelectedLanguage(data.languages[0])
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  const loadTopLgas = async (language: string) => {
    setLoading(true)
    try {
      const data = await fetchTopLgasByLanguage(language)
      setTopLgas(data.topLgas || [])
    } catch (error) {
      console.error('Error fetching top LGAs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSuburbs = async (lga: string) => {
    try {
      const data = await fetchSuburbsByLga(lga)
      setSuburbs(data.suburbs || [])
    } catch (error) {
      console.error('Error fetching suburbs:', error)
    }
  }

  const handleLgaSelect = (lga: string) => {
    setSelectedLga(lga)
  }

  const handleSuburbClick = async (suburb: SuburbData) => {
    // Mock coordinates for demo - in real app, would get from suburb data
    const mockLat = -37.8136
    const mockLng = 144.9631
    
    try {
      const data = await fetchSchoolsNear({
        lat: mockLat,
        lng: mockLng,
        radiusKm: 3,
        lga: selectedLga,
        limit: 200
      })
      setSchools(data.schools || [])
    } catch (error) {
      console.error('Error fetching schools:', error)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Page Header using global component */}
      <PageHeader
        title="Community"
        titleGradientText="Match"
        subtitle="Find suburbs where your cultural background is celebrated and your family feels truly at home, connecting with neighbors who share your values."
      />

      {/* Main Content Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Language Selection Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Your Language</h3>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full lg:w-96 px-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white appearance-none cursor-pointer transition-all duration-200"
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
              </div>
            </motion.div>

            {/* Top Councils Section */}
            {selectedLanguage && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_CONFIG.duration, delay: 0.2, ease: ANIMATION_CONFIG.ease }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-8 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Top Councils <span className="text-orange-600">({selectedLanguage})</span>
                    </h3>
                    
                    {/* Quick Select Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedLga}
                        onChange={(e) => handleLgaSelect(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white appearance-none cursor-pointer w-full lg:w-72"
                      >
                        <option value="">-- Select Council --</option>
                        {topLgas.map((lga) => (
                          <option key={lga.lga} value={lga.lga}>
                            {lga.lga}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading council data...</p>
                  </div>
                )}

                {/* Top LGAs Table */}
                {!loading && topLgas.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900 w-16">#</th>
                          <th className="px-8 py-4 text-left text-sm font-semibold text-gray-900">Council</th>
                          <th className="px-8 py-4 text-right text-sm font-semibold text-gray-900">Population</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topLgas.map((lga, index) => (
                          <tr
                            key={lga.lga}
                            onClick={() => handleLgaSelect(lga.lga)}
                            className="hover:bg-orange-50 cursor-pointer transition-colors duration-200"
                          >
                            <td className="px-8 py-4 text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex items-center">
                                <MapPin className="w-5 h-5 text-orange-600 mr-3" />
                                <span className="text-sm font-medium text-gray-900">{lga.lga}</span>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-right">
                              <div className="flex items-center justify-end">
                                <Users className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {lga.population.toLocaleString()}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* Suburbs Section */}
            {selectedLga && suburbs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_CONFIG.duration, delay: 0.3, ease: ANIMATION_CONFIG.ease }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Suburbs in <span className="text-orange-600">{selectedLga}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suburbs.map((suburb, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuburbClick(suburb)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-gray-400 group-hover:text-orange-600 mr-3 transition-colors duration-200" />
                        <span className="text-sm font-medium text-gray-900">{suburb.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Schools Section */}
            {schools.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: ANIMATION_CONFIG.duration, delay: 0.4, ease: ANIMATION_CONFIG.ease }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Nearby Schools
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {schools.map((school) => (
                    <div key={school.id} className="p-6 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{school.name}</h4>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {school.type}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        <span className="text-sm">{school.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Map Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: ANIMATION_CONFIG.duration, delay: 0.5, ease: ANIMATION_CONFIG.ease }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Interactive Map</h3>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Map integration coming soon</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Interactive map with LGA boundaries, suburbs, and school locations
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  )
}