import { CommunityMatchPage } from '@/components/community-match'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Match | OneParent VIC',
  description: 'Find suburbs where your cultural background is celebrated and your family feels truly at home, connecting with neighbors who share your values.',
  keywords: [
    'community match',
    'cultural community',
    'single parent community',
    'suburb finder',
    'cultural suburbs victoria',
    'melbourne communities',
    'diverse communities',
    'family neighborhoods',
    'cultural connection',
    'multicultural melbourne'
  ],
  openGraph: {
    title: 'Community Match | OneParent VIC',
    description: 'Find suburbs where your cultural background is celebrated and your family feels truly at home.',
    url: 'https://oneparentvic.me/community-match',
  },
}

export default function Page() {
  return <CommunityMatchPage />
}