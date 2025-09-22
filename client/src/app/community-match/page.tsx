import { CommunityMatchPage } from '@/components/community-match'
import type { Metadata } from 'next'

// SEO metadata for community match page
export const metadata: Metadata = {
  title: 'Community Match | OneParent VIC',
  description: 'Find the perfect area to raise your family. Discover Melbourne suburbs where your language is spoken, compare housing costs, explore schools, and connect with your community - designed for single parents making confident moving decisions.',
  keywords: [
    'community match',
    'language communities',
    'cultural communities',
    'melbourne suburbs',
    'language speakers',
    'multicultural areas',
    'single parent housing',
    'victoria housing',
    'local government areas',
    'multicultural suburbs',
    'community connection',
    'housing prices',
    'rental costs',
    'school finder',
    'suburb search',
    'community finder',
    'cultural matching'
  ],
  openGraph: {
    title: 'Community Match | OneParent VIC',
    description: 'Find suburbs with people from your cultural background. Explore housing and schools in Greater Melbourne.',
    url: 'https://oneparentvic.me/community-match',
  },
}

export default function Page() {
  return <CommunityMatchPage />
}
