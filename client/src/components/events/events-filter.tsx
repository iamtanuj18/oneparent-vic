// events filter component for category and date filtering
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Filter, AlertCircle } from 'lucide-react'

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

// get max date (6 months from today)
const getMaxDate = (): string => {
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 6)
  return formatDateForInput(maxDate)
}

// validate date range and constraints
const validateDate = (dateString: string, type: 'start' | 'end', otherDate?: string): string | null => {
  if (!dateString) return null
  
  // Check date format first
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return 'Please enter a valid date format'
  }
  
  const inputDate = new Date(dateString + 'T00:00:00')
  
  // Check if date is valid
  if (isNaN(inputDate.getTime())) {
    return 'Please enter a valid date'
  }
  
  const today = new Date()
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 6)
  
  // Remove time components for accurate comparison
  today.setHours(0, 0, 0, 0)
  inputDate.setHours(0, 0, 0, 0)
  maxDate.setHours(0, 0, 0, 0)
  
  if (type === 'start') {
    if (inputDate < today) {
      return 'Start date cannot be in the past'
    }
    if (inputDate > maxDate) {
      return 'Start date cannot be more than 6 months from today'
    }
  } else {
    if (otherDate && otherDate.length === 10) {
      const startDate = new Date(otherDate + 'T00:00:00')
      startDate.setHours(0, 0, 0, 0)
      if (inputDate < startDate) {
        return 'End date cannot be before start date'
      }
    }
    if (inputDate > maxDate) {
      return 'End date cannot be more than 6 months from today'
    }
  }
  
  return null
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

  const [startDateError, setStartDateError] = useState<string | null>(null)
  const [endDateError, setEndDateError] = useState<string | null>(null)

  const minDate = getTodayDate()
  const maxDate = getMaxDate()

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category })
  }

  const handleStartDateChange = (startDate: string) => {
    // Clear previous error when user starts typing
    setStartDateError(null)
    
    // Always update the form data to allow smooth typing
    let newFilters = { ...filters, startDate }
    
    // If end date is before new start date, update end date
    if (filters.endDate && filters.endDate < startDate) {
      newFilters.endDate = startDate
      setEndDateError(null) // Clear end date error as we're auto-adjusting
    }
    
    onFiltersChange(newFilters)
    
    // Only validate if we have a complete date (YYYY-MM-DD format)
    if (startDate && startDate.length === 10) {
      const startError = validateDate(startDate, 'start')
      if (startError) {
        setStartDateError(startError)
      } else {
        // Revalidate end date with new start date if both are complete
        if (filters.endDate && filters.endDate.length === 10) {
          const endError = validateDate(filters.endDate, 'end', startDate)
          setEndDateError(endError)
        }
      }
    }
  }

  const handleEndDateChange = (endDate: string) => {
    // Clear previous error when user starts typing
    setEndDateError(null)
    
    // Always update the form data to allow smooth typing
    onFiltersChange({ ...filters, endDate })
    
    // Only validate if we have a complete date (YYYY-MM-DD format)
    if (endDate && endDate.length === 10) {
      const endError = validateDate(endDate, 'end', filters.startDate)
      if (endError) {
        setEndDateError(endError)
      }
    }
  }

  const handleStartDateBlur = () => {
    if (filters.startDate) {
      // Check if date is incomplete
      if (filters.startDate.length > 0 && filters.startDate.length < 10) {
        setStartDateError('Please enter a complete date')
      } else if (filters.startDate.length === 10) {
        // Validate complete date
        const error = validateDate(filters.startDate, 'start')
        setStartDateError(error)
      }
    }
  }

  const handleEndDateBlur = () => {
    if (filters.endDate) {
      // Check if date is incomplete
      if (filters.endDate.length > 0 && filters.endDate.length < 10) {
        setEndDateError('Please enter a complete date')
      } else if (filters.endDate.length === 10) {
        // Validate complete date
        const error = validateDate(filters.endDate, 'end', filters.startDate)
        setEndDateError(error)
      }
    }
  }

  // Check if form has errors
  const hasErrors = Boolean(startDateError || endDateError)

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
              onBlur={handleStartDateBlur}
              min={minDate}
              max={maxDate}
              disabled={isLoading}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:border-blue-500 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                startDateError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {startDateError && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{startDateError}</span>
            </div>
          )}
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
              onBlur={handleEndDateBlur}
              min={filters.startDate || minDate}
              max={maxDate}
              disabled={isLoading}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:border-blue-500 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                endDateError 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {endDateError && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{endDateError}</span>
            </div>
          )}
        </div>

        {/* apply filter button */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 invisible">
            action
          </label>
          <button 
            onClick={onApplyFilters}
            disabled={isLoading || hasErrors}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Apply'}
          </button>
          {/* Invisible error space to match other columns */}
          <div className="h-4"></div>
        </div>
      </div>
    </motion.div>
  )
}