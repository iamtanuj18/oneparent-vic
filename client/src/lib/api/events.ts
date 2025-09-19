// events api functions for fetching event data from multiple sources
import { apiFetch } from './client'

// types for event api responses
export interface EventItem {
  id: string
  source: string
  title: string
  description?: string
  date: string
  rawDate?: string
  location: string
  url?: string
  image?: string
}

export interface EventsResponse {
  events: EventItem[]
  hasMore: boolean
  page: number
}

export interface EventFilters {
  category: string
  startDate: string
  endDate: string
  page?: number
  perPage?: number
  isLoadMore?: boolean
}

// fetch events from ticketmaster api
export function fetchTicketmasterEvents(filters: EventFilters): Promise<EventsResponse> {
  return apiFetch('/events/ticketmaster', { method: 'POST', body: filters })
}

// fetch events from eventfinda api  
export function fetchEventfindaEvents(filters: EventFilters): Promise<EventsResponse> {
  return apiFetch('/events/eventfinda', { method: 'POST', body: filters })
}