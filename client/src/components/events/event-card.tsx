// event card component for displaying individual event information
'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'
import { EventItem } from '@/lib/api/events'

interface EventCardProps {
  event: EventItem
  onClick?: (url?: string) => void
}

const formatEventDate = (dateStr: string): string => {
  if (!dateStr) return 'date not available'
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    
    return date.toLocaleDateString('en-AU', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

export function EventCard({ event, onClick }: EventCardProps) {
  // early return if no event data
  if (!event) return null

  const handleClick = () => {
    if (onClick) {
      onClick(event.url)
    } else if (event.url) {
      window.open(event.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group h-full flex flex-col"
      onClick={handleClick}
    >
      {/* event image with consistent aspect ratio */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden flex-shrink-0">
        {event.image ? (
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-blue-500" />
          </div>
        )}
      </div>
      
      {/* event content with flex layout for alignment */}
      <div className="p-6 flex-1 flex flex-col">
        {/* main content area */}
        <div className="flex-1">
          {/* title with fixed height for alignment */}
          <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem] leading-tight">
            {event.title || 'untitled event'}
          </h3>
          
          {/* description with consistent height */}
          <div className="mb-4 min-h-[3rem]">
            {event.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                {event.description}
              </p>
            )}
          </div>
          
          {/* event details section */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{formatEventDate(event.date)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* button at bottom always aligned */}
        <div className="mt-auto">
          {event.url && (
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              view details
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}