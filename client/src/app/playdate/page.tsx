import { PlayDatePlanner } from '@/components/playdate/PlayDatePlanner';
import type { Metadata } from 'next';

// SEO metadata for playdate planner page
export const metadata: Metadata = {
  title: "PlayDate Planner | OneParent VIC",
  description: "AI-powered activity planner for single parents in Victoria. Generate personalized activities for yourself or with your kids - indoor, outdoor, free or budget-friendly options available.",
  keywords: [
    "playdate planner",
    "activity planner",
    "single parent activities", 
    "family activities victoria",
    "parent activities",
    "kids activities",
    "melbourne activities",
    "victoria family fun",
    "single parent playdates",
    "AI activity generator",
    "free family activities",
    "indoor activities",
    "outdoor activities",
    "parent self-care activities",
    "family bonding activities"
  ],
  openGraph: {
    title: "PlayDate Planner | OneParent VIC",
    description: "AI-powered activity planner for single parents in Victoria. Generate personalized activities for yourself or with your kids.",
    url: "https://oneparentvic.me/playdate",
  },
};

export default function PlayDatePage() {
  return <PlayDatePlanner />;
}