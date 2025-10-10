'use client';

import { motion } from 'framer-motion';
import { FormData } from '../hooks/usePlayDateForm';
import Image from 'next/image';

interface AboutYouStepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  validationErrors?: Record<string, string>;
}

export function AboutYouStep({ formData, updateFormData, validationErrors = {} }: AboutYouStepProps) {
  // handle age input with validation
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // only allow numbers up to 2 digits
    if (!/^\d{0,2}$/.test(value)) {
      return;
    }
    
    updateFormData('parentAge', value);
  };

  // handle number of kids input with validation
  const handleNumKidsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // only allow single digit numbers
    if (!/^\d{0,1}$/.test(value)) {
      return;
    }
    
    updateFormData('numKids', value);
  };

  // validate age range - allow 18+ for parents
  const getAgeError = () => {
    const age = Number(formData.parentAge);
    if (formData.parentAge && !isNaN(age)) {
      if (age < 18) {
        return 'Age must be at least 18';
      }
      if (age > 99) {
        return 'Please enter a valid age';
      }
    }
    return validationErrors.parentAge;
  };

  // validate number of kids range
  const getNumKidsError = () => {
    const numKids = Number(formData.numKids);
    if (formData.numKids && !isNaN(numKids)) {
      if (numKids < 1) {
        return 'Number of kids must be at least 1';
      }
      if (numKids > 4) {
        return 'Number of kids must be 4 or below';
      }
    }
    return validationErrors.numKids;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Tell us about yourself
        </h2>
        <p className="text-base text-gray-600">
          Help us create more personalised activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* parent type selection */}
        <div className="lg:col-span-2">
          <label className="block text-base font-semibold text-gray-900 mb-3">
            I am a <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'mother', label: 'Mother', imageSrc: '/images/mother-selection.png' },
              { value: 'father', label: 'Father', imageSrc: '/images/father-selection.png' }
            ].map((type) => (
              <motion.button
                key={type.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData('parentType', type.value)}
                className={`rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  formData.parentType === type.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* image section */}
                <div className="w-full h-48 relative">
                  <Image
                    src={type.imageSrc}
                    alt={`${type.label} selection`}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* text section */}
                <div className="p-4 text-center">
                  <h3 className={`text-lg font-semibold ${
                    formData.parentType === type.value ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {type.label}
                  </h3>
                </div>
              </motion.button>
            ))}
          </div>
          {validationErrors.parentType && (
            <p className="text-red-500 text-sm mt-2">{validationErrors.parentType}</p>
          )}
        </div>

        {/* age selection */}
        <div className={formData.planFor === 'withKids' ? 'md:col-span-1' : 'md:col-span-2'}>
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Enter your age <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.parentAge || ''}
            onChange={handleAgeChange}
            placeholder="Enter age (18+)"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          />
          {getAgeError() && (
            <p className="text-red-500 text-sm mt-2">{getAgeError()}</p>
          )}
        </div>

        {/* number of kids (only show for parents) */}
        {formData.planFor === 'withKids' && (
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Number of kids <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.numKids || ''}
              onChange={handleNumKidsChange}
              placeholder="Enter number (1-4)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
            {getNumKidsError() && (
              <p className="text-red-500 text-sm mt-2">{getNumKidsError()}</p>
            )}
          </div>
        )}

        {/* energy level selection */}
        <div className="lg:col-span-2">
          <label className="block text-base font-semibold text-gray-900 mb-3">
            Activity energy level <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-4">
            The activity generated will match how much energy you want to invest when doing it.
          </p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'low', label: 'Low', color: 'bg-blue-400', desc: 'Minimal effort' },
              { id: 'moderate', label: 'Balanced', color: 'bg-green-400', desc: 'Some effort' },
              { id: 'high', label: 'Active', color: 'bg-yellow-400', desc: 'Good effort' },
              { id: 'very-high', label: 'High Energy', color: 'bg-red-400', desc: 'Full effort' }
            ].map((option) => (
              <motion.button
                key={option.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateFormData('activityEnergyLevel', option.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
                  formData.activityEnergyLevel === option.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${option.color} mx-auto mb-2`}></div>
                <div className="text-sm font-semibold mb-1">{option.label}</div>
                <div className="text-xs text-gray-500">{option.desc}</div>
              </motion.button>
            ))}
          </div>
          {validationErrors.activityEnergyLevel && (
            <p className="text-red-500 text-sm mt-2">{validationErrors.activityEnergyLevel}</p>
          )}
        </div>
      </div>
    </div>
  );
}