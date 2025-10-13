// smart tools grid section - feature showcase
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ANIMATION_CONFIG } from '@/lib/animation'

// smart tools data with routes for navigation
const SMART_TOOLS = [
  {
    id: 1,
    image: '/images/featureimg3.png',
    title: 'Single Parent Journey Map',
    description: 'See where you are in your single parenting journey and know what to expect at each step, from early days to now',
    route: '/your-journey-map'
  },
  {
    id: 2,
    image: '/images/featureimg2.png',
    title: 'Time & Learn Hub',
    description: 'We analyze your weekly schedule to find free time pockets and generate personalized micro-learning lessons based on your preferences.',
    route: '/time-and-learn-hub'
  },
  {
    id: 3,
    image: '/images/featureimg6.png',
    title: 'Emotion Tracker',
    description: 'Log your daily emotions and get weekly AI-powered insights, tips, and progress comparisons to support your mental wellbeing journey.',
    route: '/emotion-tracker'
  },
  {
    id: 4,
    image: '/images/featureimg1.png',
    title: 'PlayDate Planner',
    description: 'Get personalized activities generated for yourself or to do with your kids based on your preferences',
    route: '/playdate'
  },
  {
    id: 5,
    image: '/images/featureimg4.png',
    title: 'Community Match',
    description: 'Find suburbs where your cultural background is celebrated and your family feels truly at home, connecting with neighbors who share your values.',
    route: '/community-match'
  },
  {
    id: 6,
    image: '/images/featureimg5.png',
    title: 'Find Events',
    description: 'Discover all family events from multiple providers in one place, so you never miss out on creating precious memories with your children.',
    route: '/events'
  }
]

export function SmartToolsSection() {
  const router = useRouter()

  const handleCardClick = (route: string) => {
    router.push(route)
  }

  return (
    <section id="smart-tools" className="relative bg-orange-50 overflow-hidden">
      <div className="container mx-auto px-6 py-24 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center space-y-6 max-w-4xl mx-auto"
          >
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-gray-900">
              What we built for 
              <span className="gradient-text">
                {" "}you
              </span>
            </h2>
            
            <p className="text-xl leading-relaxed text-gray-600 max-w-3xl mx-auto">
              Simple solutions designed to make your life a little easier, every single day.
            </p>
          </motion.div>

          {/* tools grid - card format */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SMART_TOOLS.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: ANIMATION_CONFIG.duration, 
                  delay: index * 0.2,
                  ease: ANIMATION_CONFIG.ease 
                }}
                viewport={{ once: true, margin: "-50px" }}
                className="group cursor-pointer"
                onClick={() => handleCardClick(tool.route)}
              >
                {/* card container with fixed dimensions */}
                <div className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 h-[600px] flex flex-col">
                  {/* image section - fixed height */}
                  <div className="relative h-[320px] overflow-hidden bg-gray-50 flex-shrink-0">
                    <Image
                      src={tool.image}
                      alt={tool.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  
                  {/* content section - fixed height with proper alignment */}
                  <div className="p-6 h-[280px] flex flex-col justify-between flex-shrink-0">
                    {/* title - fixed height */}
                    <div className="h-[80px] flex items-start">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-3">
                        {tool.title}
                      </h3>
                    </div>
                    
                    {/* description - fixed height */}
                    <div className="h-[140px] flex items-start">
                      <p className="text-gray-700 text-base leading-relaxed line-clamp-6">
                        {tool.description}
                      </p>
                    </div>
                    
                    {/* call to action button - fixed position at bottom */}
                    <div className="h-[40px] flex items-center">
                      <span className="inline-flex items-center text-blue-600 font-semibold text-base hover:text-blue-700 transition-colors">
                        Try it now
                        <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}