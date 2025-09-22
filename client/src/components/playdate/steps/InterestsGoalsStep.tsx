'use client';

import { motion } from 'framer-motion';
import { FormData } from '../hooks/usePlayDateForm';
import { useState } from 'react';
import { X } from 'lucide-react';
import { SafetyError } from '../SafetyError';

interface InterestsGoalsStepProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  validationErrors?: Record<string, string>;
  onSafetyCheck?: () => Promise<boolean>;
  safetyCheckError?: {
    message: string;
    issues?: string[];
    flaggedItems?: string[];
  } | null;
  onClearSafetyError?: () => void;
}

// maximum limits
const MAX_ITEMS = 5;
const MIN_ITEMS = 2;
const MAX_CHARS = 50;

// predefined interest suggestions
const INTEREST_SUGGESTIONS = [
  "Sports", "Music", "Science", "Movies"
];

const GOAL_SUGGESTIONS = [
  "Relaxation", "Learning Something New", "Quality Bonding Time"
];

export function InterestsGoalsStep({ 
  formData, 
  updateFormData, 
  validationErrors: propValidationErrors = {},
  onSafetyCheck,
  safetyCheckError,
  onClearSafetyError
}: InterestsGoalsStepProps) {
  const [interestInput, setInterestInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [interestError, setInterestError] = useState('');
  const [goalError, setGoalError] = useState('');

  // get current interests and goals from form data
  const interests = formData.interests || [];
  const goals = formData.goals || [];

  // generic helper to add items to array with validation
  const addItem = (
    item: string,
    currentArray: string[],
    fieldName: 'interests' | 'goals',
    setError: (error: string) => void,
    clearInput: () => void
  ) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    
    if (trimmed.length > MAX_CHARS) {
      setError(`Maximum ${MAX_CHARS} characters allowed`);
      return;
    }
    
    if (currentArray.includes(trimmed)) {
      setError(`This ${fieldName.slice(0, -1)} is already added`);
      return;
    }
    
    if (currentArray.length >= MAX_ITEMS) {
      setError(`Maximum ${MAX_ITEMS} ${fieldName} allowed`);
      return;
    }
    
    updateFormData(fieldName, [...currentArray, trimmed]);
    clearInput();
    setError('');
  };

  // helper functions for interests
  const addInterest = (interest: string) => {
    addItem(interest, interests, 'interests', setInterestError, () => setInterestInput(''));
  };

  const removeInterest = (interest: string) => {
    updateFormData('interests', interests.filter(i => i !== interest));
  };

  const addGoal = (goal: string) => {
    addItem(goal, goals, 'goals', setGoalError, () => setGoalInput(''));
  };

  const removeGoal = (goal: string) => {
    updateFormData('goals', goals.filter(g => g !== goal));
  };

  // generic keyboard handler
  const createKeyDownHandler = (
    input: string,
    addFunction: (item: string) => void,
    removeFunction: (item: string) => void,
    currentArray: string[]
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFunction(input);
    } else if (e.key === 'Backspace' && !input && currentArray.length > 0) {
      removeFunction(currentArray[currentArray.length - 1]);
    }
  };

  // keyboard handlers
  const handleInterestKeyDown = createKeyDownHandler(
    interestInput,
    addInterest,
    removeInterest,
    interests
  );

  const handleGoalKeyDown = createKeyDownHandler(
    goalInput,
    addGoal,
    removeGoal,
    goals
  );

  // clear errors when user types
  const handleInterestChange = (value: string) => {
    setInterestInput(value);
    if (interestError) setInterestError('');
  };

  const handleGoalChange = (value: string) => {
    setGoalInput(value);
    if (goalError) setGoalError('');
  };

  // reusable section component
  const renderTagSection = (
    type: 'interests' | 'goals',
    label: string,
    items: string[],
    suggestions: string[],
    input: string,
    error: string,
    placeholder: string,
    onInputChange: (value: string) => void,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void,
    addItem: (item: string) => void,
    removeItem: (item: string) => void,
    validationError?: string
  ) => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-base font-semibold text-gray-900">
            {label} <span className="text-red-500">*</span>
          </label>
          <span className="text-sm text-gray-600">
            {items.length}/{MAX_ITEMS} selected (min {MIN_ITEMS})
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Choose from suggestions below or add your own {type}
        </p>
        
        {/* suggestion chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addItem(suggestion)}
              disabled={items.includes(suggestion) || items.length >= MAX_ITEMS}
              className={`px-3 py-1 text-sm rounded-full border transition-all ${
                items.includes(suggestion)
                  ? 'bg-blue-100 text-blue-700 border-blue-300 cursor-not-allowed'
                  : items.length >= MAX_ITEMS
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* custom input */}
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder={placeholder}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_CHARS}
            disabled={items.length >= MAX_ITEMS}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => addItem(input)}
            disabled={!input.trim() || items.length >= MAX_ITEMS}
            className="px-4 py-2 text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md transition-all disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Add
          </button>
        </div>

        {/* error message */}
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        {/* selected items */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* validation error */}
      {validationError && (
        <p className="text-red-500 text-sm mt-2">Please add at least {MIN_ITEMS} {type}</p>
      )}
    </div>
  );

  // dynamic labels based on plan type
  const interestLabel = formData.planFor === 'withKids' 
    ? "Enter your and your kids' interests"
    : "Enter your interests";

  const goalLabel = "Enter your goals/outcomes for the activity";

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Tell us your interests & goals
        </h2>
        <p className="text-base text-gray-600">
          This helps in building an activity close to your interests and goals.
        </p>
      </div>

      {/* safety error display */}
      {safetyCheckError && (
        <SafetyError 
          issues={safetyCheckError.issues}
          flaggedItems={safetyCheckError.flaggedItems}
          planFor={formData.planFor as 'myself' | 'withKids'}
        />
      )}

      {/* interests section */}
      {renderTagSection(
        'interests',
        interestLabel,
        interests,
        INTEREST_SUGGESTIONS,
        interestInput,
        interestError,
        "eg. Sports",
        handleInterestChange,
        handleInterestKeyDown,
        addInterest,
        removeInterest,
        propValidationErrors?.interests
      )}

      {/* goals section */}
      {renderTagSection(
        'goals',
        goalLabel,
        goals,
        GOAL_SUGGESTIONS,
        goalInput,
        goalError,
        "eg. Relaxation",
        handleGoalChange,
        handleGoalKeyDown,
        addGoal,
        removeGoal,
        propValidationErrors?.goals
      )}
    </div>
  );
}