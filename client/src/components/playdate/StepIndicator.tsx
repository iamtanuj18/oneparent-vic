'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
  showAllSteps?: boolean; // controls whether to show all steps or just current step
}

export function StepIndicator({ steps, currentStep, className = '', showAllSteps = true }: StepIndicatorProps) {
  // determine which steps to show based on showAllSteps prop
  const stepsToShow = showAllSteps ? steps : [steps[currentStep]];
  const adjustedCurrentStep = showAllSteps ? currentStep : 0;

  return (
    <div className={`w-full ${className}`}>
      {/* mobile layout - shows progress bar or just title */}
      <div className="block sm:hidden">
        {showAllSteps ? (
          <>
            <div className="text-center mb-3">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {steps[currentStep]}
              </h3>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </>
        ) : (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {steps[currentStep]}
            </h3>
          </div>
        )}
      </div>

      {/* desktop layout - shows circular step indicators */}
      <div className="hidden sm:flex justify-center">
        <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
          {stepsToShow.map((step, index) => {
            const isActive = index <= adjustedCurrentStep;
            const stepNumber = showAllSteps ? index + 1 : currentStep + 1;
            return (
              <motion.div 
                key={showAllSteps ? step : `${step}-${currentStep}`} 
                className="flex items-center"
                initial={showAllSteps && index > 0 ? { opacity: 0, x: -30 } : {}}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: showAllSteps ? index * 0.08 : 0,
                  ease: [0.25, 0.46, 0.45, 0.94] // smooth animation curve
                }}
              >
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-500 border-2 border-gray-300'
                    }`}
                    animate={index === adjustedCurrentStep ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {stepNumber}
                  </motion.div>
                  <span className={`mt-2 text-xs md:text-sm font-medium text-center whitespace-nowrap ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                </div>
                {index < stepsToShow.length - 1 && showAllSteps && (
                  <motion.div 
                    className="mx-2 md:mx-3 lg:mx-4"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: (index + 1) * 0.08,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    <ArrowRight className={`w-4 h-4 md:w-5 md:h-5 ${
                      index < adjustedCurrentStep ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}