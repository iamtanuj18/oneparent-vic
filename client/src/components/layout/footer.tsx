'use client'

import { useRouter } from 'next/navigation'

// footer navigation grouped by categories
const FOOTER_LINKS = [
  {
    title: 'Smart Tools',
    links: [
      { label: 'PlayDate Planner', href: '/playdate' },
      { label: 'Time & Learn Hub', href: '/time-and-learn-hub' }
    ]
  },
  {
    title: 'Single Parenting Journey',
    links: [
      { label: 'Your Journey Map', href: '/your-journey-map' },
      { label: 'Community Match', href: '/community-match' }
    
    ]
  },
  {
    title: 'More Resources',
    links: [
      { label: 'Emotion Tracker', href: '/emotion-tracker' },
      { label: 'Find Events', href: '/events' }
    ]
  }


]

export function Footer() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <footer className="bg-gradient-to-br from-[#0f1419] to-[#1a202c] text-white">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        
        {/* main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* brand section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-3xl font-bold tracking-tight">
                <span className="text-white">oneparent</span>
                <span className="gradient-text"> vic</span>
              </h3>
              <p className="text-gray-300 mt-4 text-base leading-relaxed">
                Making life easier for single parents across Victoria
              </p>
            </div>
          </div>

          {/* footer links */}
          {FOOTER_LINKS.map((section) => (
            <div key={section.title}>
              <h4 className="text-xl font-semibold text-white mb-6">
                {section.title}
              </h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleNavigation(link.href)}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-base group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom section - centered */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex justify-center">
            {/* copyright - centered */}
            <div className="text-gray-400 text-base text-center">
              {/* © {currentYear} oneparentvic.me */} oneparentvic.me - {currentYear}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}