import { EventsPage } from '@/components/events/events-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Find Events & Activities | OneParent VIC',
  description: 'Discover family-friendly events, activities, and gatherings happening across Victoria for single parents and their children.',
}

export default function Page() {
  return <EventsPage />
}