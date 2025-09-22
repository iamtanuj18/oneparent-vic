'use client';

import { motion } from 'framer-motion';
import { FormData, ChildInfo } from '../hooks/usePlayDateForm';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface AboutKidsStepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  validationErrors?: Record<string, string>;
}

export function AboutKidsStep({ formData, updateFormData, validationErrors = {} }: AboutKidsStepProps) {
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // handle age input with validation for kids
  const handleChildAgeChange = (childIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }
    
    // prevent input if length exceeds 2 digits
    if (value.length > 2) {
      return;
    }
    
    updateChildData(childIndex, 'age', value);
  };

  // validate child age range based on parent age
  const getChildAgeError = (childIndex: number) => {
    const child = kids[childIndex];
    if (!child) return '';
    
    const ageString = String(child.age || '');
    const age = parseInt(ageString);
    const maxAge = getMaxAge();
    
    if (ageString && !isNaN(age)) {
      if (age < 1) {
        return 'Age must be at least 1';
      }
      if (age > maxAge) {
        return `Age must be ${maxAge} or below`;
      }
    }
    return '';
  };

  // calculate maximum child age based on parent age
  const getMaxAge = () => {
    const parentAge = Number(formData.parentAge) || 30;
    return Math.max(parentAge - 20, 1);
  };

  // initialize kids array based on number of kids selected
  const initializeKids = (): ChildInfo[] => {
    const numKids = Number(formData.numKids) || 0;
    
    return Array.from({ length: numKids }, (_, i) => ({
      id: `${i + 1}`,
      gender: formData.kids[i]?.gender || '',
      age: formData.kids[i]?.age || '',
      activityStyle: formData.kids[i]?.activityStyle || ''
    }));
  };

  const validNumKids = Number(formData.numKids) || 0;
  const kids = formData.kids.length === validNumKids ? formData.kids : initializeKids();

  // update individual child data
  const updateChildData = (childIndex: number, field: keyof ChildInfo, value: any) => {
    const updatedKids = [...kids];
    updatedKids[childIndex] = { ...updatedKids[childIndex], [field]: value };
    updateFormData('kids', updatedKids);
  };

  // auto-clear validation error when all children are complete
  useEffect(() => {
    if (validationErrors.incompleteChildren && kids.length > 0) {
      const allChildrenComplete = kids.every(child => 
        child.gender && child.age && child.activityStyle
      );
      
      if (allChildrenComplete) {
        // clear the incomplete children error by updating a dummy field
        updateFormData('incompleteChildren' as any, null);
      }
    }
  }, [kids, validationErrors.incompleteChildren]);

  // switch active child tab
  const switchToChild = (index: number) => {
    setActiveChildIndex(index);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          About your kid{validNumKids > 1 ? 's' : ''}
        </h2>
        <p className="text-base text-gray-600">
          Help us create activities that match each child's personality
        </p>
      </div>

      {/* validation error display */}
      {validationErrors.incompleteChildren && (
        <div className="mb-6" data-error-message>
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-red-400 mr-3 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Complete information for all children
                </h3>
                <div className="text-sm text-red-700 mt-2">
                  <p className="font-medium">{validationErrors.incompleteChildren}</p>
                  <p className="mt-1 text-red-600">
                    👆 <strong>Use the child tabs below</strong> to switch between children and fill in their details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* child tabs - only show if multiple kids */}
      {validNumKids > 1 && (
        <>
          <div className={`${validationErrors.incompleteChildren ? 'ring-2 ring-red-200 ring-offset-2' : ''} transition-all`}>
            <div className="grid gap-1 bg-gray-100 p-1 rounded-lg mb-2" style={{ gridTemplateColumns: `repeat(${validNumKids}, 1fr)` }}>
              {kids.map((child, index) => {
                const isComplete = child.gender && child.age && child.activityStyle;
                const hasValidationError = validationErrors.incompleteChildren && !isComplete;
                const isActive = activeChildIndex === index;
                
                return (
                  <button
                    key={index}
                    onClick={() => switchToChild(index)}
                    className={`py-3 px-3 sm:px-4 rounded-md text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? hasValidationError 
                          ? 'bg-red-500 text-white shadow-lg transform scale-105' 
                          : 'bg-blue-500 text-white shadow-lg transform scale-105'
                        : hasValidationError
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50 bg-red-50 shadow-sm border border-red-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Child {index + 1}</span>
                      {isComplete ? (
                        <span className="text-green-400 text-xs">✓</span>
                      ) : (
                        <span className="text-yellow-400 text-xs">!</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className={`text-center mb-6 p-3 rounded-lg ${
            validationErrors.incompleteChildren 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-gray-50'
          }`}>
            <p className={`text-sm font-medium ${
              validationErrors.incompleteChildren ? 'text-yellow-800' : 'text-gray-600'
            }`}>
              {validationErrors.incompleteChildren 
                ? '⚠️ Please complete ALL children above (click tabs to switch)'
                : '👆 Click on a child tab to edit their information'
              }
            </p>
          </div>
        </>
      )}

          {/* child information form */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Child {activeChildIndex + 1}
        </h3>

        <div className="space-y-6">
          {/* gender selection */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'male', label: 'Male', imageSrc: '/images/boy-selection.png' },
                { value: 'female', label: 'Female', imageSrc: '/images/girl-selection.png' }
              ].map((type) => (
                <motion.button
                  key={type.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateChildData(activeChildIndex, 'gender', type.value)}
                  className={`rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                    kids[activeChildIndex]?.gender === type.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {/* image section */}
                  <div className="w-full h-32 relative">
                    <Image
                      src={type.imageSrc}
                      alt={`${type.label} selection`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* text section */}
                  <div className="p-3 text-center">
                    <h3 className={`text-base font-semibold ${
                      kids[activeChildIndex]?.gender === type.value ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {type.label}
                    </h3>
                  </div>
                </motion.button>
              ))}
            </div>
            {validationErrors.incompleteChildren && !kids[activeChildIndex]?.gender && (
              <p className="text-red-500 text-sm mt-2">Please select gender</p>
            )}
          </div>

          {/* age input */}
          <div>
            <label className="block text-base font-semibold text-gray-900 mb-3">
              Enter child's age <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={kids[activeChildIndex]?.age || ''}
              onChange={(e) => handleChildAgeChange(activeChildIndex, e)}
              placeholder={`Enter age (1-${getMaxAge()})`}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
            {getChildAgeError(activeChildIndex) && (
              <p className="text-red-500 text-sm mt-2">{getChildAgeError(activeChildIndex)}</p>
            )}
            {!getChildAgeError(activeChildIndex) && validationErrors.incompleteChildren && !kids[activeChildIndex]?.age && (
              <p className="text-red-500 text-sm mt-2">Please enter age</p>
            )}
          </div>
        </div>

        {/* activity style selection */}
        <div>
          <label className="block text-base font-semibold text-gray-900 mb-3">
            What type of activities do they enjoy? <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-600 mb-4">This helps us suggest activities that match their personality and interests</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { 
                value: 'calm', 
                label: 'Calm & Focused', 
                desc: 'eg. Reading, puzzles, quiet games',
                color: 'bg-blue-500'
              },
              { 
                value: 'active', 
                label: 'Active & Energetic', 
                desc: 'eg. Running, sports, exercise',
                color: 'bg-green-500'
              },
              { 
                value: 'creative', 
                label: 'Creative & Artistic', 
                desc: 'eg. Arts & crafts, music, building',
                color: 'bg-yellow-500'
              },
              { 
                value: 'social', 
                label: 'Social & Interactive', 
                desc: 'eg. Group games, team activities',
                color: 'bg-red-500'
              }
            ].map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateChildData(activeChildIndex, 'activityStyle', option.value)}
                className={`rounded-lg border-2 transition-all duration-200 p-4 text-center ${
                  kids[activeChildIndex]?.activityStyle === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {/* colored indicator dot */}
                <div className="flex justify-center mb-3">
                  <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                </div>
                
                {/* activity type title */}
                <h4 className={`text-base font-semibold mb-2 ${
                  kids[activeChildIndex]?.activityStyle === option.value ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {option.label}
                </h4>
                
                {/* activity description */}
                <p className="text-sm text-gray-600">{option.desc}</p>
              </motion.button>
            ))}
          </div>
          {validationErrors.incompleteChildren && !kids[activeChildIndex]?.activityStyle && (
            <p className="text-red-500 text-sm mt-2">Please select activity type</p>
          )}
        </div>
      </div>
    </div>
  );
}