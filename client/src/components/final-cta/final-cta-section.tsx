// final call to action section with image and navigation
'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ANIMATION_CONFIG } from '@/lib/animation'

export function FinalCtaSection() {
  const router = useRouter()

  const handleTryNow = () => {
    router.push('/playdate')
  }
  return (
    <section className="bg-orange-50/30 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* call to action card with embedded image */}
        <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
            
            {/* content section - left side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: ANIMATION_CONFIG.duration }}
              viewport={{ once: true, margin: "-100px" }}
              className="p-8 lg:p-12 space-y-6 order-2 lg:order-1"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Ready for Your Next PlayDate?
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                Let our PlayDate Planner create the perfect activity for you and your kids. 
                Personalized suggestions based on your budget, time, and child's interests.
              </p>
              
              <div className="pt-4">
                <button 
                  onClick={handleTryNow}
                  className="btn-primary group"
                >
                  Try Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>

            {/* image section - right side with diagonal cut */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: ANIMATION_CONFIG.duration, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative h-80 lg:h-96 order-1 lg:order-2 overflow-hidden"
              style={{
                clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)'
              }}
            >
              <Image
                src="/images/playdate-cta.png"
                alt="Parent and child enjoying a fun playdate activity together"
                fill
                className="object-cover scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              
              {/* overlay gradient for better integration */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/10" />
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  )
}