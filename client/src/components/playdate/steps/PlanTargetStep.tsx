'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { FormData } from '../hooks/usePlayDateForm';
import Image from 'next/image';

interface PlanTargetStepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  error?: string;
}

export function PlanTargetStep({ formData, updateFormData, error }: PlanTargetStepProps) {
  // helper function to get card styling based on selection state
  const getCardClassName = (isSelected: boolean) => {
    return `overflow-hidden cursor-pointer transition-all duration-200 border-2 h-full ${
      isSelected 
        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500 shadow-lg' 
        : 'bg-white hover:bg-gray-50 hover:shadow-md border-gray-200 hover:border-gray-300'
    }`;
  };

  // card configuration data to eliminate duplication
  const cardOptions = [
    {
      id: 'myself',
      title: 'For Myself',
      description: 'Some well-deserved me-time to recharge and enjoy personal activities',
      imageSrc: '/images/for-myself.png'
    },
    {
      id: 'withKids',
      title: 'With My Kids', 
      description: 'Fun family activities that both you and your children will enjoy',
      imageSrc: '/images/with-kids.png'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Who are you planning for?</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cardOptions.map((option) => (
          <motion.div 
            key={option.id}
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={getCardClassName(formData.planFor === option.id)}
              onClick={() => updateFormData('planFor', option.id)}
            >
              <div className="flex flex-col h-full">
                <div className="w-full h-48 flex-shrink-0">
                  <Image 
                    src={option.imageSrc} 
                    alt={option.title} 
                    width={400}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 text-center flex-grow flex flex-col justify-center">
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{option.title}</h3>
                  <p className="text-sm text-gray-600">
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-red-500 text-sm font-medium bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">
            {error}
          </p>
        </motion.div>
      )}
    </div>
  );
}