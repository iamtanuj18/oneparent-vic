import type { Metadata } from 'next'

// SEO metadata for emotion tracker page
export const metadata: Metadata = {
  title: "Emotion Tracker | OneParent VIC",
  description: "Track your daily emotions, energy levels, and wellbeing as a single parent in Victoria. Get AI-powered weekly insights, mood analysis, and personalized mental health tips.",
  keywords: [
    "emotion tracker",
    "mood tracker", 
    "mental health tracker",
    "single parent wellbeing",
    "daily emotion log",
    "AI mood analysis",
    "mental health support",
    "parent self-care",
    "emotional wellness",
    "mood journal",
    "single parent mental health",
    "victoria parent support",
    "wellbeing tracker",
    "emotional health",
    "parent stress management"
  ],
  openGraph: {
    title: "Emotion Tracker | OneParent VIC",
    description: "Track your daily emotions and wellbeing as a single parent. Get AI-powered insights and personalized mental health support.",
    url: "https://oneparentvic.me/emotion-tracker",
  },
}

export default function EmotionTrackerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}