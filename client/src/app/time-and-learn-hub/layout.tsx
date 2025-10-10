import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Time & Learn Hub | OneParent VIC",
  description: "Personal time management and micro-learning companion for single parents in Victoria. Visualise your weekly schedule, discover free-time pockets, and create learning opportunities.",
  keywords: [
    "time management",
    "micro learning",
    "single parent schedule",
    "time tracker",
    "personal development",
    "learning planner",
    "productivity tools",
    "habit building",
    "self improvement",
    "weekly planner",
    "time optimization",
    "skill development",
    "parent education",
    "time analysis",
    "schedule management"
  ],
  openGraph: {
    title: "Time & Learn Hub | OneParent VIC",
    description: "Transform your free time into learning opportunities. Personal time management and micro-learning for busy single parents.",
    url: "https://oneparentvic.me/time-learn-hub",
  },
}

export default function TimeLearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}