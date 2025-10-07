// playdate planner promotion popup with image and concise text
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PlayDatePopupProps {
  isOpen: boolean
  onClose: () => void
}

export function PlayDatePopup({ isOpen, onClose }: PlayDatePopupProps) {
  const router = useRouter()

  const handleTryPlayDate = () => {
    // save timestamp when user clicks the button
    try {
      localStorage.setItem('playdate-popup-last-shown', Date.now().toString())
    } catch {
      // silently fail if localStorage is not available
    }
    
    try {
      router.push('/playdate')
      onClose()
    } catch (error) {
      console.warn('navigation error:', error)
      onClose()
    }
  }

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose()
    }
  }

  // early return if component should not be shown
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* main popup modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.4 
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative max-w-6xl w-full">
              
              {/* close button */}
              <button
                onClick={handleClose}
                className="absolute -top-4 -right-4 z-20 w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg border-2 border-white"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              {/* popup content container */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                
                {/* content layout */}
                <div className="flex flex-col md:flex-row min-h-[500px]">
                  
                  {/* image section */}
                  <div className="md:w-1/2 relative overflow-hidden">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-full h-full"
                    >
                      <img
                        src="/images/popupimg.png"
                        alt="playdate planner illustration"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  </div>

                  {/* text content section */}
                  <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-8"
                    >
                      
                      {/* main heading and description */}
                      <div className="space-y-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                            looking for
                          </span>
                          <br />
                          <span className="text-gray-900">activities?</span>
                        </h1>
                        
                        <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                          let our playdate planner create the perfect activity for you and your kids. personalized suggestions based on your budget, time, and child's interests.
                        </p>
                      </div>

                      {/* action buttons */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleTryPlayDate}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-200 flex-1 sm:flex-none text-lg"
                        >
                          Try Playdate Planner
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleClose}
                          className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-4 rounded-lg font-semibold transition-all duration-200 text-lg"
                        >
                          Maybe Later
                        </motion.button>
                      </div>
                      
                    </motion.div>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}