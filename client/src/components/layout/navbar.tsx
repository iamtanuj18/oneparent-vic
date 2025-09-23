'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'

// navigation items
const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/'
  },
  {
    label: 'PlayDate Planner',
    href: '/playdate'
  },
  // {
  //   label: 'Time & Learn Hub', 
  //   href: '/time-and-learn-hub'
  // },
  {
    label: 'Your Journey Map',
    href: '/your-journey-map'
  },
  {
    label: 'Community Match',
    href: '/community-match'
  },
  // {
  //   label: 'Benefits Checker',
  //   href: '/benefits-entitlements'
  // },
  {
    label: 'Find Events',
    href: '/events'
  },
]

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()

  // split navigation items - first 5 shown normally, rest in dropdown
  const mainNavItems = NAV_ITEMS.slice(0, 5)
  const moreNavItems = NAV_ITEMS.slice(5)

  // handle scroll for all pages
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsMobileMenuOpen(false)
    setIsMoreDropdownOpen(false)
  }

  const scrollToHome = () => {
    router.push('/')
    setIsMobileMenuOpen(false)
    setIsMoreDropdownOpen(false)
  }

  // get navbar styling based on scroll state (consistent across all pages)
  const getNavbarClasses = () => {
    if (isScrolled) {
      // when scrolled: white background on all pages
      return "fixed top-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200/80 transition-all duration-300"
    }
    // not scrolled: transparent with overlay on all pages (like homepage)
    return "fixed top-0 left-0 right-0 z-[9999] bg-black/20 backdrop-blur-sm transition-all duration-300"
  }

  // get text color classes based on scroll state (consistent across all pages)
  const getTextClasses = () => {
    if (isScrolled) {
      // when scrolled: dark text on white background
      return "text-gray-900"
    }
    // not scrolled: white text on transparent/dark background
    return "text-white"
  }

  const getLinkClasses = () => {
    if (isScrolled) {
      // when scrolled: dark text with gray hover
      return "text-gray-800 hover:text-gray-900 hover:bg-gray-50"
    }
    // not scrolled: white text with white hover
    return "text-white hover:text-white/90 hover:bg-white/10"
  }

  return (
    <>
      <nav className={getNavbarClasses()}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* logo */}
            <div className="flex-shrink-0">
              <button 
                onClick={scrollToHome}
                className="text-3xl font-bold tracking-tight transition-all duration-300 hover:opacity-80"
              >
                <span className={getTextClasses()}>
                  oneparent
                </span>
                <span className="text-blue-600">
                  {' '}vic
                </span>
              </button>
            </div>

            {/* desktop navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* main navigation items (first 5) */}
              {mainNavItems.map((item) => (
                <div key={item.label} className="relative group">
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={`relative text-lg font-semibold transition-all duration-200 py-4 px-5 rounded-lg ${getLinkClasses()}`}
                  >
                    {item.label}
                    
                    {/* expanding line hover effect */}
                    <span className="absolute bottom-3 left-4 right-4 h-0.5 transition-all duration-300 ease-out transform scale-x-0 group-hover:scale-x-100 bg-blue-600" />
                  </button>
                </div>
              ))}
              
              {/* more dropdown (only show if more than 5 items) */}
              {NAV_ITEMS.length > 5 && (
                <div 
                  className="relative"
                  onMouseEnter={() => setIsMoreDropdownOpen(true)}
                  onMouseLeave={() => setIsMoreDropdownOpen(false)}
                >
                  <div className={`relative text-lg font-semibold transition-all duration-200 py-4 px-5 rounded-lg flex items-center cursor-pointer ${getLinkClasses()}`}>
                    More
                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isMoreDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {/* dropdown menu */}
                  <AnimatePresence>
                    {isMoreDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-48 bg-white shadow-lg backdrop-blur-md overflow-hidden z-[9998]"
                      >
                        <div className="py-2">
                          {moreNavItems.map((item) => (
                            <div key={item.label} className="relative group">
                              <button
                                onClick={() => handleNavigation(item.href)}
                                className="block w-full text-left px-5 py-3 text-lg font-semibold transition-colors duration-200 relative text-gray-800 hover:text-gray-900 hover:bg-gray-50"
                              >
                                {item.label}
                                
                                {/* expanding line hover effect for dropdown items */}
                                <span className="absolute bottom-2 left-4 right-4 h-0.5 transition-all duration-300 ease-out transform scale-x-0 group-hover:scale-x-100 bg-blue-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* mobile menu button */}
            <div className="lg:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`lg:hidden border-t backdrop-blur-md overflow-hidden ${
                isScrolled 
                  ? 'bg-white/95 border-gray-200'
                  : 'bg-black/30 border-white/20'
              }`}
            >
              <div className="px-6 py-6 space-y-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.href)}
                    className={`block w-full text-left transition-colors duration-200 py-4 px-4 rounded-lg font-semibold text-base ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        : 'text-white hover:text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}