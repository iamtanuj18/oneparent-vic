// events filter component for category and date filtering
'use client'

import { motion } from 'framer-motion'
import { Calendar, Filter } from 'lucide-react'

export interface FilterState {
  category: string
  startDate: string
  endDate: string
}

interface EventsFilterProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApplyFilters: () => void
  isLoading?: boolean
  categories: string[]
}

// helper to format date as yyyy-mm-dd
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// get today's date as minimum start date
const getTodayDate = (): string => {
  const today = new Date()
  return formatDateForInput(today)
}

export function EventsFilter({ 
  filters, 
  onFiltersChange, 
  onApplyFilters, 
  isLoading = false,
  categories 
}: EventsFilterProps) {
  // early return if required props are missing
  if (!filters || !onFiltersChange || !onApplyFilters || !categories) {
    return null
  }

  const minDate = getTodayDate()

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category })
  }

  const handleStartDateChange = (startDate: string) => {
    if (!startDate) return
    
    let newFilters = { ...filters, startDate }
    
    // if end date is before new start date update end date
    if (filters.endDate && filters.endDate < startDate) {
      newFilters.endDate = startDate
    }
    
    onFiltersChange(newFilters)
  }

  const handleEndDateChange = (endDate: string) => {
    if (!endDate) return
    onFiltersChange({ ...filters, endDate })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-5 h-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">filter events and activities</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* category selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            category
          </label>
          <select 
            value={filters.category} 
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {categories.length > 0 ? (
              categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))
            ) : (
              <option value="">no categories available</option>
            )}
          </select>
        </div>

        {/* start date selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            start date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              min={minDate}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* end date selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            end date
          </label>
          <div className="relative">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              min={filters.startDate || minDate}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* apply filter button */}
        <div className="flex flex-col gap-2 md:justify-end">
          <button 
            onClick={onApplyFilters}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? 'loading...' : 'apply'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}