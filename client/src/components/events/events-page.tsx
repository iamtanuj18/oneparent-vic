// main events page component with filtering, pagination, and error handling
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, AlertCircle, Loader2 } from 'lucide-react'
import { EventCard } from './event-card'
import { EventsFilter, FilterState } from './events-filter'
import { fetchTicketmasterEvents, fetchEventfindaEvents, EventItem } from '@/lib/api/events'
import { PageHeader, PlayDatePopup } from '@/components/ui'

// event categories for filtering
const CATEGORIES = [
  'Family & Kids Activities',
  'Community & Support', 
  'Wellbeing & Parenting',
  'Learning, Development & Exhibition',
  'Arts & Entertainment',
  'Markets & Local Events',
]

// events per source for balanced results
const EVENTS_PER_SOURCE = 6
const TARGET_TOTAL = EVENTS_PER_SOURCE * 2

// helper to add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// helper to format date as yyyy-mm-dd
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// remove duplicate events based on title and location
const deduplicateEvents = (events: EventItem[]): EventItem[] => {
  if (!events || events.length === 0) return []
  
  const seen = new Set<string>()
  const result: EventItem[] = []
  
  for (const event of events) {
    if (!event || !event.title || !event.location || !event.date) continue
    
    const key = `${event.title.toLowerCase().trim()}|${event.location.toLowerCase().trim()}|${event.date}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push(event)
    }
  }
  
  return result
}

export function EventsPage() {
  // popup state
  const [showPlayDatePopup, setShowPlayDatePopup] = useState(false)
  
  // filter state
  const [filters, setFilters] = useState<FilterState>({
    category: CATEGORIES[0],
    startDate: formatDate(new Date()),
    endDate: formatDate(addDays(new Date(), 45))
  })
  
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(filters)
  
  // events state
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // pagination state
  const [tmPage, setTmPage] = useState(0)
  const [efPage, setEfPage] = useState(0)
  const [tmHasMore, setTmHasMore] = useState(true)
  const [efHasMore, setEfHasMore] = useState(true)
  
  // request tracking to prevent race conditions
  const requestId = useRef(0)

  // fetch events from both sources
  const fetchEvents = async (isLoadMore = false, filtersToUse = appliedFilters) => {
    const currentRequestId = ++requestId.current
    
    try {
      if (!isLoadMore) {
        setIsLoading(true)
        setError(null)
        setEvents([])
        setTmPage(0)
        setEfPage(0)
        setTmHasMore(true)
        setEfHasMore(true)
      } else {
        setIsLoadingMore(true)
      }

      const fetchParams = {
        category: filtersToUse.category,
        startDate: filtersToUse.startDate,
        endDate: filtersToUse.endDate,
        perPage: EVENTS_PER_SOURCE,
        isLoadMore
      }

      let ticketmasterEvents: EventItem[] = []
      let eventfindaEvents: EventItem[] = []

      // fetch from ticketmaster if available
      if (!isLoadMore || tmHasMore) {
        try {
          const tmResponse = await fetchTicketmasterEvents({
            ...fetchParams,
            page: isLoadMore ? tmPage : 0
          })
          
          if (currentRequestId !== requestId.current) return
          
          ticketmasterEvents = tmResponse?.events || []
          
          if (ticketmasterEvents.length === EVENTS_PER_SOURCE) {
            setTmPage(prev => prev + 1)
          } else {
            setTmHasMore(false)
          }
        } catch (tmError) {
          console.warn('ticketmaster api error:', tmError)
          setTmHasMore(false)
        }
      }

      // fetch from eventfinda if available
      if (!isLoadMore || efHasMore) {
        try {
          const efResponse = await fetchEventfindaEvents({
            ...fetchParams,
            page: isLoadMore ? efPage : 0
          })
          
          if (currentRequestId !== requestId.current) return
          
          eventfindaEvents = efResponse?.events || []
          
          if (eventfindaEvents.length === EVENTS_PER_SOURCE) {
            setEfPage(prev => prev + 1)
          } else {
            setEfHasMore(false)
          }
        } catch (efError) {
          console.warn('eventfinda api error:', efError)
          setEfHasMore(false)
        }
      }

      // combine and deduplicate events
      const combinedEvents = [...ticketmasterEvents, ...eventfindaEvents]
      const newEvents = deduplicateEvents(combinedEvents)

      if (currentRequestId !== requestId.current) return

      if (isLoadMore) {
        setEvents(prev => deduplicateEvents([...prev, ...newEvents]))
      } else {
        setEvents(newEvents)
      }

      // stop pagination if no new events found during load more
      if (isLoadMore && newEvents.length === 0) {
        setTmHasMore(false)
        setEfHasMore(false)
      }

    } catch (err) {
      if (currentRequestId !== requestId.current) return
      
      console.error('events fetch error:', err)
      setError('unable to load events. please try again.')
    } finally {
      if (currentRequestId === requestId.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }

  // initial load
  useEffect(() => {
    fetchEvents(false, appliedFilters)
  }, [])

  // popup timing - show after 3 seconds with 24-hour tracking
  useEffect(() => {
    const checkShouldShowPopup = () => {
      try {
        const lastShown = localStorage.getItem('playdate-popup-last-shown')
        const now = Date.now()
        
        if (!lastShown) {
          return true // never shown before
        }
        
        const lastShownTime = parseInt(lastShown, 10)
        if (isNaN(lastShownTime)) {
          return true // invalid stored value
        }
        
        const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        
        return (now - lastShownTime) > twentyFourHours
      } catch {
        return true // fallback to showing popup
      }
    }
    
    if (checkShouldShowPopup()) {
      const popupTimer = setTimeout(() => {
        setShowPlayDatePopup(true)
      }, 3000) // 3 seconds

      return () => clearTimeout(popupTimer)
    }
  }, [])

  // handle popup close and remember timestamp
  const handleClosePopup = () => {
    setShowPlayDatePopup(false)
    try {
      localStorage.setItem('playdate-popup-last-shown', Date.now().toString())
    } catch {
      // silently fail if localStorage is not available
    }
  }

  // handle filter application
  const handleApplyFilters = () => {
    setAppliedFilters(filters)
    fetchEvents(false, filters)
  }

  // handle load more events
  const handleLoadMore = () => {
    if (isLoadingMore || (!tmHasMore && !efHasMore) || !appliedFilters) return
    fetchEvents(true, appliedFilters)
  }

  // handle event click
  const handleEventClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const hasMoreEvents = tmHasMore || efHasMore
  const hasEvents = events.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* page header component */}
      <PageHeader
        title="Find Events &"
        titleGradientText="Activities"
        subtitle="A single hub of family-friendly and related events happening across Victoria."
      />

      {/* main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* filter section */}
        <EventsFilter
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={handleApplyFilters}
          isLoading={isLoading}
          categories={CATEGORIES}
        />

        {/* loading state display */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">loading events...</p>
          </motion.div>
        )}

        {/* error state display */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">something went wrong</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => fetchEvents(false, appliedFilters)}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                try again
              </button>
            </div>
          </motion.div>
        )}

        {/* no events state display */}
        {!isLoading && !error && !hasEvents && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-md mx-auto">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">no events found</h3>
              <p className="text-gray-600">
                try changing the category or date range to view more events.
              </p>
            </div>
          </motion.div>
        )}

        {/* events grid display */}
        {!isLoading && !error && hasEvents && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            >
              {events.map((event, index) => (
                <EventCard
                  key={`${event.source}-${event.id}-${index}`}
                  event={event}
                  onClick={handleEventClick}
                />
              ))}
            </motion.div>

            {/* load more button or end message */}
            <div className="text-center">
              {hasMoreEvents ? (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      loading more events...
                    </>
                  ) : (
                    'load more events'
                  )}
                </button>
              ) : (
                <div className="py-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">no more events available</h3>
                  <p className="text-gray-600">
                    try changing the category or date range to view more events.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* playdate planner popup */}
      <PlayDatePopup 
        isOpen={showPlayDatePopup}
        onClose={handleClosePopup}
      />
    </div>
  )
}