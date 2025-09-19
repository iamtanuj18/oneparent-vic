import { HeroSection } from '@/components/hero'
import { TimelineSection } from '@/components/timeline'
import { CommunityStoriesZigZag } from '@/components/community/community-stories-zigzag'
import { SmartToolsSection } from '@/components/smart-tools'
import { FinalCtaSection } from '@/components/final-cta'

export default function HomePage() {
  return (
    <>
      {/* main hero section with background images and call to action */}
      <HeroSection />
      
      {/* community growth statistics and timeline visualization */}
      <TimelineSection />
      
      {/* government support data and workforce statistics */}
      <CommunityStoriesZigZag />
      
      {/* feature showcase grid with six smart tools */}
      <SmartToolsSection />
      
      {/* final call to action for playdate planner */}
      <FinalCtaSection />
    </>
  )
}
