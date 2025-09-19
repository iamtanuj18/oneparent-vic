// page header component for consistent dark themed headers across pages
'use client'

import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  subtitle: string
  titleGradientText?: string
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  titleGradientText,
  className = ""
}: PageHeaderProps) {
  // early return if required props are missing
  if (!title || !subtitle) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`bg-[#161a24] text-white pt-32 pb-20 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            <span className="text-white">{title}</span>
            {titleGradientText && (
              <>
                {" "}
                <span className="gradient-text">
                  {titleGradientText}
                </span>
              </>
            )}
          </h1>
          <p className="text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  )
}