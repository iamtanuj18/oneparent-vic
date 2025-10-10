// hero section with background image slideshow and call to action buttons
'use client'

import { Button } from '@/components/ui'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export function HeroSection() {
  // state for image slideshow and mobile display
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMobileContentVisible, setIsMobileContentVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const heroImages = [
    {
      src: '/images/homeimg1.png',
      alt: 'Single parent reading with child in cozy living room'
    },
    {
      src: '/images/homeimg2.png',
      alt: 'Single parent and child cooking together in kitchen'
    },
    {
      src: '/images/homeimg3.png',
      alt: 'Single parent playing with child in outdoor park setting'
    },
    {
      src: '/images/homeimg4.png',
      alt: 'Single parent helping child with homework at desk'
    }
  ]

  // detect mobile viewport and handle content visibility timing
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // delay mobile content appearance for better loading experience
    const timer = setTimeout(() => {
      setIsMobileContentVisible(true)
    }, 1500)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // auto advance image slideshow on desktop only
  useEffect(() => {
    if (isMobile) return
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 3500)

    return () => clearInterval(interval)
  }, [heroImages.length, isMobile])

  // smooth scroll navigation to page sections
  const scrollToSection = (sectionId: string) => {
    const targetSection = document.getElementById(sectionId)
    if (targetSection) {
      targetSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* background image slideshow with overlay */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => {
          // show first image on mobile, slideshow on desktop
          const shouldShow = isMobile ? index === 0 : index === currentImageIndex
          
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                shouldShow ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
              />
            </div>
          )
        })}
        {/* dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/30" />
      </div>

      {/* main content area */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="flex items-end md:items-center justify-center lg:justify-start min-h-screen pt-20 pb-32 md:pb-20">
          
          {/* content card with responsive visibility */}
          <div className={`w-full max-w-lg lg:max-w-md xl:max-w-lg transition-opacity duration-1000 ${
            isMobile ? (isMobileContentVisible ? 'opacity-100' : 'opacity-0') : 'opacity-100'
          }`}>
            <div className="bg-transparent md:bg-white/60 md:backdrop-blur-lg rounded-3xl p-6 md:p-8 lg:p-10 md:shadow-2xl md:border md:border-white/50 transform transition-all duration-300 md:hover:shadow-3xl">
              
              {/* main heading with gradient text */}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4 md:mb-8 text-center md:text-left">
                <span className="text-white md:text-gray-900 drop-shadow-lg md:drop-shadow-none">
                  Making life easier
                </span>
                <br />
                <span className="text-white md:text-gray-900 drop-shadow-lg md:drop-shadow-none">
                  for{" "}
                </span>
                <span className="md:hidden text-white drop-shadow-lg">
                  single parents across Victoria
                </span>
                <span className="hidden md:inline gradient-text">
                  single parents across Victoria
                </span>
              </h1>

              {/* descriptive text shown on desktop only */}
              <p className="hidden md:block text-xl text-gray-800 leading-relaxed mb-10 max-w-lg font-medium">
                Whether you have just began your journey as a single parent or already navigating through it, our platform offers simple tools and features to help make everyday life a little easier.
              </p>

              {/* call to action buttons */}
              <div className="flex flex-col gap-3 md:gap-5">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 md:px-10 py-3 md:py-5 text-base md:text-lg rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 md:gap-3 group"
                  onClick={() => scrollToSection('smart-tools')}
                >
                  See How We Help
                  <ArrowRight className="w-4 h-4 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/80 md:border-gray-500 text-white md:text-gray-900 hover:bg-white/20 md:hover:bg-gray-200/60 md:hover:border-gray-600 bg-white/10 md:bg-white/70 font-semibold px-6 md:px-10 py-3 md:py-5 text-base md:text-lg rounded-xl md:rounded-2xl transition-all duration-300 hover:shadow-md backdrop-blur-sm"
                  onClick={() => scrollToSection('community-insights')}
                >
                  View Community Insights
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
